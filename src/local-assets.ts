import { imageDimensions } from './image-dimensions.js';
import { open, type FileHandle } from 'node:fs/promises';
import { basename, extname, isAbsolute } from 'node:path';
import { ZuckerBotApiError, type ZuckerBotClient } from './client.js';

export const LOCAL_IMAGE_LIMIT = 30 * 1024 * 1024;
export const LOCAL_VIDEO_LIMIT = 4 * 1024 * 1024 * 1024;
const TYPES: Record<string, { type: 'image' | 'video'; mime: string }> = {
  '.jpg': { type: 'image', mime: 'image/jpeg' }, '.jpeg': { type: 'image', mime: 'image/jpeg' },
  '.png': { type: 'image', mime: 'image/png' }, '.mp4': { type: 'video', mime: 'video/mp4' },
  '.mov': { type: 'video', mime: 'video/quicktime' },
};
function invalid(code: string, message: string): never { throw new ZuckerBotApiError(400, code, message); }

/** Keep the descriptor open from validation through upload; never reopen a path
 * supplied by a hosted caller. Only stdio/CLI entrypoints enable this module. */
export interface LocalAsset {
  handle: FileHandle; path: string; name: string; size: number; mtimeMs: number;
  type: 'image' | 'video'; mime: string; width?: number; height?: number;
}
export async function inspectLocalAsset(filePath: string, enabled: boolean): Promise<LocalAsset> {
  if (!enabled) invalid('local_files_unavailable', 'file_path requires ZuckerBot MCP running locally (stdio or CLI). Hosted MCP cannot read files on your machine; use the local client or asset_url.');
  if (!isAbsolute(filePath)) invalid('invalid_file_path', 'file_path must be an absolute path to a local jpg, png, mp4 or mov file.');
  const kind = TYPES[extname(filePath).toLowerCase()];
  if (!kind) invalid('unsupported_file_type', 'Local files must be jpg/jpeg, png, mp4 or mov.');
  let handle: FileHandle;
  try { handle = await open(filePath, 'r'); }
  catch { return invalid('file_unreadable', `File does not exist or is not readable: ${filePath}`); }
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size === 0) invalid('invalid_file', `Expected a non-empty regular file: ${filePath}`);
    if (stat.size > (kind.type === 'image' ? LOCAL_IMAGE_LIMIT : LOCAL_VIDEO_LIMIT)) {
      invalid('file_too_large', `${basename(filePath)} exceeds the ${kind.type === 'image' ? '30 MB image' : '4 GB video'} limit.`);
    }
    const probe = Buffer.alloc(12);
    await handle.read(probe, 0, probe.length, 0);
    if (kind.mime === 'image/png' && !probe.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) invalid('invalid_file', 'The PNG file does not contain a PNG image.');
    if (kind.mime === 'image/jpeg' && !(probe[0] === 0xff && probe[1] === 0xd8)) invalid('invalid_file', 'The JPEG file does not contain a JPEG image.');
    const dimensions = kind.type === 'image' ? imageDimensions(await handle.readFile()) : {};
    return { handle, path: filePath, name: basename(filePath), size: stat.size, mtimeMs: stat.mtimeMs, ...kind, ...dimensions };
  } catch (err) { await handle.close(); throw err; }
}

function storageUrl(raw: string, expectedOrigin?: string): URL {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.endsWith('.supabase.co') ||
      (expectedOrigin && url.origin !== expectedOrigin)) invalid('invalid_upload_destination', 'The API returned an invalid private storage upload destination.');
  return url;
}

/** Stream directly to the scoped signed storage URL. Standard uploads support
 * up to 5 GB; the product cap is 4 GB. A dropped transfer must be retried from
 * the start, but neither MCP nor Vercel buffers a whole video. */
export async function uploadLocalAsset(client: ZuckerBotClient, businessId: string, file: LocalAsset, name?: string): Promise<Record<string, any>> {
  const prepared = await client.post('/assets/local', {
    phase: 'prepare', business_id: businessId, name: name || file.name,
    filename: file.name, size: file.size, content_type: file.mime,
  }) as Record<string, any>;
  const endpoint = storageUrl(prepared.signed_upload_url);
  if (!endpoint.pathname.startsWith('/storage/v1/object/upload/sign/') || typeof prepared.ticket !== 'string') {
    invalid('invalid_upload_response', 'The API did not provide a private upload session.');
  }
  const stream = file.handle.createReadStream({ start: 0, end: file.size - 1, autoClose: false, highWaterMark: 256 * 1024 });
  try {
    const response = await fetch(endpoint, {
      method: 'PUT', redirect: 'error', headers: {
        'Content-Type': file.mime, 'Content-Length': String(file.size), 'Cache-Control': 'max-age=0', 'x-upsert': 'false',
      }, body: stream as unknown as BodyInit, duplex: 'half',
      signal: AbortSignal.timeout(90 * 60 * 1000),
    } as RequestInit);
    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { message?: string; error?: string } | null;
      invalid('file_transfer_failed', `Private upload failed (HTTP ${response.status}): ${detail?.message || detail?.error || 'Storage rejected the file.'}`);
    }
    const finalStat = await file.handle.stat();
    if (finalStat.size !== file.size || finalStat.mtimeMs !== file.mtimeMs) invalid('file_changed', 'The file changed during upload. Retry with an unchanged file.');
  } catch (error) {
    if (error instanceof ZuckerBotApiError) throw error;
    invalid('file_transfer_failed', 'The private file transfer was interrupted. Retry the upload from the start. No ad was created.');
  } finally { stream.destroy(); }
  return await client.post('/assets/local', { phase: 'complete', business_id: businessId, ticket: prepared.ticket }) as Record<string, any>;
}
