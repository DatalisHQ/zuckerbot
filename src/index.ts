#!/usr/bin/env node

// ── ZuckerBot MCP Server ─────────────────────────────────────────────
//
// Exposes the ZuckerBot API as MCP tools for AI agents.
// Connect via stdio transport (standard for MCP servers).
//
// Environment variables:
//   ZUCKERBOT_API_KEY  — Required. Your ZuckerBot API key.
//   ZUCKERBOT_API_URL  — Optional. API base URL (default: https://zuckerbot.ai/api/v1)
//

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ZuckerBotClient } from "./client.js";
import { registerDemoTools, registerTools } from "./tools.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readVersion(): string {
  const pkg = JSON.parse(
    readFileSync(join(__dirname, "..", "package.json"), "utf8"),
  ) as { version?: string };

  return pkg.version || "0.0.0";
}

function getConfiguredApiKey(): string | null {
  const apiKey = process.env.ZUCKERBOT_API_KEY?.trim() || "";
  if (!apiKey) return null;
  if (!/^zb_(?:live|test)_[^\s]+$/i.test(apiKey)) return null;
  if (/^zb_(?:live|test)_your_key_here$/i.test(apiKey)) return null;
  return apiKey;
}

async function main(): Promise<void> {
  const version = readVersion();
  const apiKey = getConfiguredApiKey();
  const client = new ZuckerBotClient(apiKey, version);

  // Create the MCP server
  const server = new McpServer({
    name: "zuckerbot",
    version,
  });

  if (client.authenticated) {
    registerTools(server, client);
  } else {
    registerDemoTools(server, client);
  }

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error starting ZuckerBot MCP server:", err.message || err);
  process.exit(1);
});
