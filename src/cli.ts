#!/usr/bin/env node

// ── ZuckerBot CLI ───────────────────────────────────────────────────
//
// Human-friendly CLI for the ZuckerBot API.
// Run Facebook/Instagram ad campaigns from your terminal.
//
// Usage:
//   zuckerbot preview https://example.com
//   zuckerbot create https://example.com --budget 2000 --objective leads
//   zuckerbot launch camp_abc123
//   zuckerbot status camp_abc123
//   zuckerbot pause camp_abc123
//   zuckerbot resume camp_abc123
//   zuckerbot creatives "My Biz" "Best coffee in town"
//   zuckerbot research reviews https://example.com
//   zuckerbot research competitors "cafes" "Brisbane, AU"
//   zuckerbot research market "fitness" "United States"
//   zuckerbot meta status
//   zuckerbot meta pages
//   zuckerbot meta select-page 123456
//   zuckerbot meta credentials
//
// Environment variables:
//   ZUCKERBOT_API_KEY  — Required. Your ZuckerBot API key.
//   ZUCKERBOT_API_URL  — Optional. API base URL.
//

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ZuckerBotClient, ZuckerBotApiError } from "./client.js";

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

const VERSION = readVersion();

// ── Helpers ─────────────────────────────────────────────────────────

function getClient(): ZuckerBotClient {
  try {
    const client = new ZuckerBotClient(getConfiguredApiKey(), VERSION);
    client.requireAuth();
    return client;
  } catch (err: unknown) {
    if (err instanceof ZuckerBotApiError && err.errorCode === "no_api_key") {
      console.error(chalk.red("\n  Missing API key.\n"));
      console.error(
        chalk.dim("  Set it via environment variable:\n") +
          chalk.cyan("    export ZUCKERBOT_API_KEY=zb_live_your_key_here\n") +
          chalk.dim("\n  Or inline:\n") +
          chalk.cyan("    ZUCKERBOT_API_KEY=zb_live_xxx zuckerbot preview https://example.com\n") +
          chalk.dim("\n  Get your key at ") +
          chalk.underline("https://zuckerbot.ai/developer") +
          "\n",
      );
      process.exit(1);
    }
    throw err;
  }
}

function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

function printFormatted(data: unknown, label?: string): void {
  if (label) {
    console.log(chalk.bold.green(`\n  ${label}\n`));
  }
  if (typeof data === "object" && data !== null) {
    printJson(data);
  } else {
    console.log(data);
  }
  console.log();
}

async function run<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const spinner = ora(label).start();
  try {
    const result = await fn();
    spinner.succeed(label);
    return result;
  } catch (err) {
    spinner.fail(label);
    if (err instanceof ZuckerBotApiError) {
      console.error(chalk.red(`\n  API Error (${err.statusCode}): ${err.message}`));
      if (err.retryAfter) {
        console.error(chalk.yellow(`  Retry after ${err.retryAfter}s`));
      }
      console.error();
    } else if (err instanceof Error) {
      console.error(chalk.red(`\n  Error: ${err.message}\n`));
    }
    process.exit(1);
  }
}

// ── Program ─────────────────────────────────────────────────────────

const program = new Command();

program
  .name("zuckerbot")
  .description("Run Facebook & Instagram ad campaigns from your terminal")
  .version(VERSION);

// ── preview ─────────────────────────────────────────────────────────

program
  .command("preview <url>")
  .description("Generate an ad preview from a business URL (no Meta account needed)")
  .option("-n, --count <number>", "Number of ad variants (1-3)", "2")
  .action(async (url: string, opts: { count: string }) => {
    const client = getClient();
    const result = await run("Generating ad preview", () =>
      client.post("/campaigns/preview", {
        url,
        ad_count: parseInt(opts.count, 10),
      }),
    );
    printFormatted(result, "Campaign Preview");
  });

// ── create ──────────────────────────────────────────────────────────

program
  .command("create <url>")
  .description("Create a full campaign with strategy, targeting, and creatives")
  .option("-b, --budget <cents>", "Daily budget in cents (e.g. 2000 = $20/day)")
  .option("-o, --objective <type>", "Objective: leads, traffic, conversions, awareness")
  .option("--name <n>", "Business name (auto-detected if omitted)")
  .option("--type <type>", "Business category (e.g. restaurant, fitness)")
  .option("--city <city>", "City for geo-targeting")
  .option("--state <state>", "State for geo-targeting")
  .option("--country <country>", "Country for geo-targeting")
  .action(async (url: string, opts: Record<string, string | undefined>) => {
    const client = getClient();
    const body: Record<string, unknown> = { url };
    if (opts.budget) body.budget_daily_cents = parseInt(opts.budget, 10);
    if (opts.objective) body.objective = opts.objective;
    if (opts.name) body.business_name = opts.name;
    if (opts.type) body.business_type = opts.type;
    if (opts.city || opts.state || opts.country) {
      body.location = {
        ...(opts.city ? { city: opts.city } : {}),
        ...(opts.state ? { state: opts.state } : {}),
        ...(opts.country ? { country: opts.country } : {}),
      };
    }

    const result = await run("Creating campaign", () =>
      client.post("/campaigns/create", body),
    );
    printFormatted(result, "Campaign Created");
  });

// ── launch ──────────────────────────────────────────────────────────

program
  .command("launch <campaign_id>")
  .description("Launch a draft campaign on Meta (starts spending)")
  .option("-v, --variant <index>", "Variant index to launch (0-indexed)", "0")
  .option("-a, --all", "Launch all variants for A/B testing")
  .option("-b, --budget <cents>", "Override daily budget in cents")
  .option("-r, --radius <km>", "Override targeting radius in km")
  .option("--token <token>", "Meta access token (uses stored creds if omitted)")
  .option("--ad-account <id>", "Meta ad account ID (act_XXXXX)")
  .option("--page <id>", "Facebook Page ID")
  .action(async (campaignId: string, opts: Record<string, string | boolean | undefined>) => {
    const client = getClient();
    const body: Record<string, unknown> = {};

    if (opts.all) {
      body.launch_all_variants = true;
    } else {
      body.variant_index = parseInt(opts.variant as string, 10);
    }
    if (opts.budget) body.daily_budget_cents = parseInt(opts.budget as string, 10);
    if (opts.radius) body.radius_km = parseInt(opts.radius as string, 10);
    if (opts.token) body.meta_access_token = opts.token;
    if (opts.adAccount) body.meta_ad_account_id = opts.adAccount;
    if (opts.page) body.meta_page_id = opts.page;

    const label = opts.all ? "Launching all variants (A/B test)" : "Launching campaign";
    const result = await run(label, () =>
      client.post(`/campaigns/${campaignId}/launch`, body),
    );
    printFormatted(result, "Campaign Launched");
  });

// ── status (performance) ────────────────────────────────────────────

program
  .command("status <campaign_id>")
  .description("Get real-time performance metrics for a campaign")
  .action(async (campaignId: string) => {
    const client = getClient();
    const result = await run("Fetching performance", () =>
      client.get(`/campaigns/${campaignId}/performance`),
    );
    printFormatted(result, "Campaign Performance");
  });

// ── pause ───────────────────────────────────────────────────────────

program
  .command("pause <campaign_id>")
  .description("Pause a running campaign")
  .action(async (campaignId: string) => {
    const client = getClient();
    const result = await run("Pausing campaign", () =>
      client.post(`/campaigns/${campaignId}/pause`, { action: "pause" }),
    );
    printFormatted(result, "Campaign Paused");
  });

// ── resume ──────────────────────────────────────────────────────────

program
  .command("resume <campaign_id>")
  .description("Resume a paused campaign")
  .action(async (campaignId: string) => {
    const client = getClient();
    const result = await run("Resuming campaign", () =>
      client.post(`/campaigns/${campaignId}/pause`, { action: "resume" }),
    );
    printFormatted(result, "Campaign Resumed");
  });

// ── creatives ───────────────────────────────────────────────────────

program
  .command("creatives <business_name> <description>")
  .description("Generate ad creatives (images or video)")
  .option("-n, --count <number>", "Number of variants (1-5)", "2")
  .option("-m, --model <model>", "Model: auto, seedream, imagen, kling")
  .option("-t, --type <type>", "Media type: image, video")
  .option("-q, --quality <quality>", "Quality: fast, ultra (ultra = kling only)", "fast")
  .option("--no-images", "Generate copy only, no images")
  .action(
    async (
      businessName: string,
      description: string,
      opts: { count: string; model?: string; type?: string; quality: string; images: boolean },
    ) => {
      const client = getClient();
      const body: Record<string, unknown> = {
        business_name: businessName,
        description,
        count: parseInt(opts.count, 10),
        quality: opts.quality,
        generate_images: opts.images,
      };
      if (opts.model) body.model = opts.model;
      if (opts.type) body.media_type = opts.type;

      const result = await run("Generating creatives", () =>
        client.post("/creatives/generate", body),
      );
      printFormatted(result, "Ad Creatives");
    },
  );

// ── conversion ──────────────────────────────────────────────────────

program
  .command("conversion <campaign_id> <lead_id> <quality>")
  .description("Send conversion feedback (good/bad) to Meta's algorithm")
  .option("--token <token>", "Meta access token (required)")
  .option("--email <email>", "Lead email for match rate")
  .option("--phone <phone>", "Lead phone for match rate")
  .action(
    async (
      campaignId: string,
      leadId: string,
      quality: string,
      opts: { token?: string; email?: string; phone?: string },
    ) => {
      if (!opts.token) {
        console.error(chalk.red("\n  --token is required for conversion sync.\n"));
        process.exit(1);
      }
      const client = getClient();
      const body: Record<string, unknown> = {
        lead_id: leadId,
        quality,
        meta_access_token: opts.token,
      };
      if (opts.email || opts.phone) {
        body.user_data = {
          ...(opts.email ? { email: opts.email } : {}),
          ...(opts.phone ? { phone: opts.phone } : {}),
        };
      }

      const result = await run("Syncing conversion", () =>
        client.post(`/campaigns/${campaignId}/conversions`, body),
      );
      printFormatted(result, "Conversion Synced");
    },
  );

// ── research (subcommands) ──────────────────────────────────────────

const research = program
  .command("research")
  .description("Research tools: reviews, competitors, market");

research
  .command("reviews <url>")
  .description("Get review intelligence for a business")
  .action(async (url: string) => {
    const client = getClient();
    const result = await run("Researching reviews", () =>
      client.post("/research/reviews", { url }),
    );
    printFormatted(result, "Review Intelligence");
  });

research
  .command("competitors <category> <location>")
  .description("Analyse competitor ads for a category and location")
  .action(async (category: string, location: string) => {
    const client = getClient();
    const result = await run("Analysing competitors", () =>
      client.post("/research/competitors", { category, location }),
    );
    printFormatted(result, "Competitor Analysis");
  });

research
  .command("market <industry> <location>")
  .description("Get market size, audience estimates, and ad benchmarks")
  .action(async (industry: string, location: string) => {
    const client = getClient();
    const result = await run("Researching market", () =>
      client.post("/research/market", { industry, location }),
    );
    printFormatted(result, "Market Intelligence");
  });

// ── meta (subcommands) ──────────────────────────────────────────────

const meta = program
  .command("meta")
  .description("Meta account tools: status, ad accounts, pages, credentials");

meta
  .command("status")
  .description("Check if Meta/Facebook is connected")
  .action(async () => {
    const client = getClient();
    const result = await run("Checking Meta connection", () =>
      client.get("/meta/status"),
    );
    printFormatted(result, "Meta Status");
  });

meta
  .command("accounts")
  .description("List available Meta ad accounts")
  .action(async () => {
    const client = getClient();
    const result = await run("Fetching ad accounts", () =>
      client.get("/meta/ad-accounts"),
    );
    printFormatted(result, "Meta Ad Accounts");
  });

meta
  .command("select-account <ad_account_id>")
  .description("Select a Meta ad account for future launches")
  .action(async (adAccountId: string) => {
    const client = getClient();
    const result = await run("Selecting ad account", () =>
      client.post("/meta/select-ad-account", { ad_account_id: adAccountId }),
    );
    printFormatted(result, "Ad Account Selected");
  });

meta
  .command("pages")
  .description("List available Facebook pages")
  .action(async () => {
    const client = getClient();
    const result = await run("Fetching pages", () =>
      client.get("/meta/pages"),
    );
    printFormatted(result, "Facebook Pages");
  });

meta
  .command("select-page <page_id>")
  .description("Select a Facebook page for future launches")
  .action(async (pageId: string) => {
    const client = getClient();
    const result = await run("Selecting page", () =>
      client.post("/meta/select-page", { page_id: pageId }),
    );
    printFormatted(result, "Page Selected");
  });

meta
  .command("credentials")
  .description("Check stored launch credentials")
  .action(async () => {
    const client = getClient();
    const result = await run("Resolving credentials", () =>
      client.get("/meta/credentials"),
    );
    printFormatted(result, "Launch Credentials");
  });

// ── mcp-server mode ─────────────────────────────────────────────────

program
  .command("serve")
  .description("Start in MCP server mode (stdio transport, for AI agents)")
  .action(async () => {
    // Dynamically import to avoid loading MCP SDK for CLI commands
    const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
    const { registerDemoTools, registerTools } = await import("./tools.js");

    const client = new ZuckerBotClient(getConfiguredApiKey(), VERSION);
    const server = new McpServer({ name: "zuckerbot", version: VERSION });
    if (client.authenticated) {
      registerTools(server, client);
    } else {
      registerDemoTools(server, client);
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
  });

// ── Parse ───────────────────────────────────────────────────────────

program.parse();
