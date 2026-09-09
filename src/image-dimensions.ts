/** Parse original PNG/JPEG dimensions, not a downloaded thumbnail's dimensions. */
export function imageDimensions(bytes: Uint8Array): { width: number; height: number } {
  const data = Buffer.from(bytes);
  if (data.length >= 24 && data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && data.toString('ascii',12,16) === 'IHDR') {
    const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height };
  }
  if (data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    while (offset + 4 <= data.length) {
      if (data[offset++] !== 0xff) break;
      while (data[offset] === 0xff) offset++;
      const marker = data[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > data.length) break;
      const length = data.readUInt16BE(offset);
      if (length < 2 || offset + length > data.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && length >= 7) {
        const height = data.readUInt16BE(offset + 3), width = data.readUInt16BE(offset + 5);
        if (width > 0 && height > 0) return { width, height };
      }
      offset += length;
    }
  }
  throw new Error('The file is not a valid PNG/JPEG with readable dimensions.');
}

