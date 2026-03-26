import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerTools } from "../dist/tools.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredToolNames = [
  "zuckerbot_create_campaign",
  "zuckerbot_enrich_business",
  "zuckerbot_upload_business_context",
  "zuckerbot_list_business_context",
  "zuckerbot_get_campaign",
  "zuckerbot_approve_campaign_strategy",
  "zuckerbot_request_creative",
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
  "create -> approve -> request/upload creative -> activate",
  "zuckerbot_enrich_business",
  "zuckerbot_upload_business_context",
  "zuckerbot_activate_campaign",
  "zuckerbot_create_seed_audience",
  "zuckerbot_get_campaign",
];

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

registerTools(fakeServer, fakeClient);

for (const name of requiredToolNames) {
  if (!registeredTools.includes(name)) {
    throw new Error(`Missing MCP tool registration: ${name}`);
  }
}

const docsPath = path.resolve(__dirname, "../../src/pages/Docs.tsx");
const readmePath = path.resolve(__dirname, "../README.md");

const [docsText, readmeText] = await Promise.all([
  fs.readFile(docsPath, "utf8"),
  fs.readFile(readmePath, "utf8"),
]);

for (const snippet of requiredDocsSnippets) {
  if (!docsText.includes(snippet)) {
    throw new Error(`Docs smoke check failed. Missing snippet in Docs.tsx: ${snippet}`);
  }
}

for (const snippet of requiredReadmeSnippets) {
  if (!readmeText.includes(snippet)) {
    throw new Error(`README smoke check failed. Missing snippet: ${snippet}`);
  }
}

console.log("MCP contract smoke check passed.");
