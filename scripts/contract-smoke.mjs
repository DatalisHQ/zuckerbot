import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerTools } from "../dist/tools.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default tool surface (ZUCKERBOT_ENABLE_CREATIVE_TOOLS unset).
const requiredToolNames = [
  "zuckerbot_audit_account",
  "zuckerbot_redeem_license",
  "zuckerbot_create_campaign",
  "zuckerbot_enrich_business",
  "zuckerbot_upload_business_context",
  "zuckerbot_list_business_context",
  "zuckerbot_get_campaign",
  "zuckerbot_approve_campaign_strategy",
  "zuckerbot_upload_creative",
  "zuckerbot_activate_campaign",
  "zuckerbot_suggest_angles",
  "zuckerbot_create_seed_audience",
  "zuckerbot_create_lookalike_audience",
  "zuckerbot_list_audiences",
  "zuckerbot_refresh_audience",
  "zuckerbot_get_audience_status",
  "zuckerbot_delete_audience",
];

// Creative image/video generation tools — hidden unless
// ZUCKERBOT_ENABLE_CREATIVE_TOOLS is "1" or "true".
const gatedCreativeToolNames = [
  "zuckerbot_generate_static_ad",
  "zuckerbot_generate_video_ad",
  "zuckerbot_get_video_ad_status",
  "zuckerbot_generate_creatives",
  "zuckerbot_request_creative",
];

const requiredDocsSnippets = [
  "/v1/businesses/:id/enrich",
  "/v1/businesses/:id/uploads",
  "/v1/businesses/:id/uploads/:fileId/re-extract",
  "/v1/campaigns/:id/approve-strategy",
  "/v1/campaigns/:id/request-creative",
  "/v1/campaigns/:id/upload-creative",
  "/v1/campaigns/:id/activate",
  "/v1/audiences/create-seed",
  "/v1/audiences/create-lal",
  "/v1/audiences/list",
];

const requiredReadmeSnippets = [
  "legacy create -> review -> launch -> monitor",
  "Intelligence activation, portfolio launch, and campaign resume are temporarily unavailable",
  "zuckerbot_enrich_business",
  "zuckerbot_upload_business_context",
  "zuckerbot_activate_campaign",
  "zuckerbot_create_seed_audience",
  "zuckerbot_get_campaign",
  "zuckerbot_redeem_license",
  "ZUCKERBOT_ENABLE_CREATIVE_TOOLS",
  "https://zuckerbot.ai/api/mcp",
];

const fakeClient = {
  get() {
    throw new Error("Smoke checks should not execute HTTP requests.");
  },
  post() {
    throw new Error("Smoke checks should not execute HTTP requests.");
  },
  put() {
    throw new Error("Smoke checks should not execute HTTP requests.");
  },
  delete() {
    throw new Error("Smoke checks should not execute HTTP requests.");
  },
};

function collectRegisteredTools() {
  const registeredTools = [];
  const fakeServer = {
    tool(name, description, inputSchema, handler) {
      if (typeof name !== "string" || !name) {
        throw new Error("Encountered a tool with an invalid name.");
      }
      if (typeof description !== "string" || !description) {
        throw new Error(`Tool ${name} is missing a description.`);
      }
      if (!inputSchema || typeof inputSchema !== "object") {
        throw new Error(`Tool ${name} is missing an input schema.`);
      }
      if (typeof handler !== "function") {
        throw new Error(`Tool ${name} is missing a handler.`);
      }
      registeredTools.push(name);
    },
  };
  registerTools(fakeServer, fakeClient);
  return registeredTools;
}

// ── Default surface: creative generation tools hidden ────────────────
delete process.env.ZUCKERBOT_ENABLE_CREATIVE_TOOLS;
const defaultTools = collectRegisteredTools();

for (const name of requiredToolNames) {
  if (!defaultTools.includes(name)) {
    throw new Error(`Missing MCP tool registration: ${name}`);
  }
}

for (const name of gatedCreativeToolNames) {
  if (defaultTools.includes(name)) {
    throw new Error(
      `Gated creative tool ${name} must NOT be registered by default (only with ZUCKERBOT_ENABLE_CREATIVE_TOOLS=1).`,
    );
  }
}

// ── Flag on: creative generation tools appear ────────────────────────
process.env.ZUCKERBOT_ENABLE_CREATIVE_TOOLS = "1";
const flaggedTools = collectRegisteredTools();
delete process.env.ZUCKERBOT_ENABLE_CREATIVE_TOOLS;

for (const name of gatedCreativeToolNames) {
  if (!flaggedTools.includes(name)) {
    throw new Error(
      `Gated creative tool ${name} missing with ZUCKERBOT_ENABLE_CREATIVE_TOOLS=1.`,
    );
  }
}

const docsPath = path.resolve(__dirname, "../../src/pages/Docs.tsx");
const readmePath = path.resolve(__dirname, "../README.md");

const readmeText = await fs.readFile(readmePath, "utf8");

// The private monorepo has the full web docs next to mcp-server/. The public
// distribution repo intentionally contains only the MCP/CLI package, so keep
// this extra parity check when the private docs are present and skip it in the
// standalone public checkout.
try {
  const docsText = await fs.readFile(docsPath, "utf8");
  for (const snippet of requiredDocsSnippets) {
    if (!docsText.includes(snippet)) {
      throw new Error(`Docs smoke check failed. Missing snippet in Docs.tsx: ${snippet}`);
    }
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

for (const snippet of requiredReadmeSnippets) {
  if (!readmeText.includes(snippet)) {
    throw new Error(`README smoke check failed. Missing snippet: ${snippet}`);
  }
}

console.log(
  `MCP contract smoke check passed. Default tools: ${defaultTools.length}, with creative flag: ${flaggedTools.length}.`,
);
