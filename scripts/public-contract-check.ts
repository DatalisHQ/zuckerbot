import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const root = process.cwd();
const privateRepositoryIdentifier = ["DatalisHQ/zuckerbot", "d2fa8661"].join("-");

function readJson(relativePath: string): JsonRecord {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8")) as JsonRecord;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${String(expected)}, received ${String(actual)}`);
  }
}

const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");
const plugin = readJson(".claude-plugin/plugin.json");
const cursorPlugin = readJson(".cursor-plugin/plugin.json");
const mcpConfig = readJson(".mcp.json");
const serverManifest = readJson("server.json");
const version = requireString(packageJson.version, "package.json version");

assertEqual(packageLock.version, version, "package-lock.json version");
assertEqual(plugin.version, version, "Claude plugin version");
assertEqual(cursorPlugin.version, version, "Cursor plugin version");
assertEqual(cursorPlugin.name, "zuckerbot", "Cursor plugin name");
assertEqual(cursorPlugin.mcpServers, "./mcp.json", "Cursor MCP config path");
const hostedMcp = readJson("mcp.json");
const hostedServers = hostedMcp.mcpServers as JsonRecord | undefined;
const hostedZuckerbot = hostedServers?.zuckerbot as JsonRecord | undefined;
assertEqual(hostedZuckerbot?.url, "https://zuckerbot.ai/api/mcp", "Cursor hosted endpoint");
if (hostedZuckerbot?.headers !== undefined || hostedZuckerbot?.env !== undefined) {
  throw new Error("Cursor's OAuth connection must not include static credentials");
}
const skillPath = "skills/meta-ads/SKILL.md";
const skill = readFileSync(path.join(root, skillPath), "utf8");
if (!/^---\r?\nname: meta-ads\r?\ndescription: [^\r\n]+\r?\n---/.test(skill)) {
  throw new Error("Meta ads skill must have discoverable name and description frontmatter");
}
for (const relative of [requireString(cursorPlugin.logo, "Cursor logo"), "skills/meta-ads/references/grokbot-profile.md"]) {
  if (path.isAbsolute(relative) || relative.split(/[\\/]/).includes("..") || !existsSync(path.join(root, relative))) {
    throw new Error(`Cursor plugin asset must be an existing relative path: ${relative}`);
  }
}
assertEqual(serverManifest.version, version, "server.json version");

const lockPackages = packageLock.packages as JsonRecord | undefined;
const lockRoot = lockPackages?.[""] as JsonRecord | undefined;
assertEqual(lockRoot?.version, version, "package-lock root package version");

const serverPackages = serverManifest.packages as JsonRecord[] | undefined;
assertEqual(serverPackages?.[0]?.version, version, "server.json npm package version");

const mcpServers = mcpConfig.mcpServers as JsonRecord | undefined;
const zuckerbotConfig = mcpServers?.zuckerbot as JsonRecord | undefined;
const mcpArgs = zuckerbotConfig?.args as unknown[] | undefined;
if (!mcpArgs?.includes(`zuckerbot-mcp@${version}`)) {
  throw new Error(`.mcp.json must pin zuckerbot-mcp@${version}`);
}

const repository = packageJson.repository as JsonRecord | undefined;
if (repository?.directory !== undefined) {
  throw new Error("Public package.json must not point at the private mcp-server subdirectory");
}

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);

const allowedTopLevel = new Set([
  ".claude-plugin",
  ".cursor-plugin",
  ".github",
  ".gitignore",
  ".mcp.json",
  "AGENTS.md",
  "CLAUDE.md",
  "LICENSE",
  "README.md",
  "assets",
  "glama.json",
  "package-lock.json",
  "package.json",
  "mcp.json",
  "scripts",
  "server.json",
  "skills",
  "smithery.yaml",
  "src",
  "tsconfig.json",
]);

for (const file of trackedFiles) {
  const topLevel = file.split("/")[0];
  if (!allowedTopLevel.has(topLevel)) {
    throw new Error(`Forbidden public repository path: ${file}`);
  }
}

const textFilePattern = /\.(?:json|md|mjs|ts|yaml|yml)$/i;
const secretPatterns = [
  { label: "ZuckerBot live API key", pattern: /zb_live_[a-f0-9]{24,}/i },
  { label: "Stripe secret key", pattern: /sk_(?:live|test)_[a-zA-Z0-9]{16,}/ },
  { label: "Meta access token", pattern: /EAA[a-zA-Z0-9]{40,}/ },
  { label: "Supabase service-role JWT", pattern: /eyJ[a-zA-Z0-9_-]{40,}\.eyJ[a-zA-Z0-9_-]{40,}\.[a-zA-Z0-9_-]{20,}/ },
];

for (const file of trackedFiles.filter((candidate) => textFilePattern.test(candidate))) {
  const content = readFileSync(path.join(root, file), "utf8");
  if (content.includes(privateRepositoryIdentifier)) {
    throw new Error(`Private repository identifier leaked into ${file}`);
  }
  for (const { label, pattern } of secretPatterns) {
    if (pattern.test(content)) {
      throw new Error(`${label} pattern found in ${file}`);
    }
  }
}

console.log(
  `Public repository contract passed for zuckerbot-mcp@${version} (${trackedFiles.length} tracked files).`,
);
