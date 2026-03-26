// ── ZuckerBot MCP Tool Definitions ───────────────────────────────────

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ZuckerBotClient, ZuckerBotApiError } from "./client.js";

// ── Helpers ──────────────────────────────────────────────────────────

const DEVELOPER_URL = "https://zuckerbot.ai/developer";
const DOCS_URL = "https://zuckerbot.ai/docs";
const CAMPAIGN_HINT = `Get your API key at ${DEVELOPER_URL} to launch this campaign.`;

function formatResult(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function formatError(err: unknown): { content: Array<{ type: "text"; text: string }>; isError: true } {
  if (err instanceof ZuckerBotApiError) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              error: true,
              code: err.errorCode,
              status: err.statusCode,
              message: err.message,
              ...(err.retryAfter ? { retry_after: err.retryAfter } : {}),
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }
  return {
    content: [
      {
        type: "text" as const,
        text: `Error: ${err instanceof Error ? err.message : String(err)}`,
      },
    ],
    isError: true,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function appendHint(data: unknown, hint: string): Record<string, unknown> {
  const record = asRecord(data);
  if (record) return { ...record, _hint: hint };
  return { result: data, _hint: hint };
}

function buildQuickstartPayload(client: ZuckerBotClient): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    status: client.authenticated ? "authenticated" : "demo_mode",
    message: client.authenticated
      ? "All 44 tools available."
      : "Running in demo mode - preview campaigns and generate creatives work without a key (5 free/day). Add your API key to unlock all 44 tools.",
    recommended_flow: [
      {
        step: 1,
        tool: "zuckerbot_preview_campaign",
        description: "Paste a URL -> get ad previews instantly",
        requires_key: false,
      },
      {
        step: 2,
        tool: "zuckerbot_generate_creatives",
        description: "Generate ad images or videos",
        requires_key: false,
      },
      {
        step: 3,
        tool: "zuckerbot_research_market",
        description: "Market size and ad benchmarks",
        requires_key: false,
      },
      {
        step: 4,
        tool: "zuckerbot_create_campaign",
        description: "Full campaign strategy with audience tiers",
        requires_key: true,
      },
      {
        step: 5,
        tool: "zuckerbot_launch_campaign",
        description: "Go live on Meta",
        requires_key: true,
      },
      {
        step: 6,
        tool: "zuckerbot_get_performance",
        description: "Real-time campaign metrics",
        requires_key: true,
      },
    ],
    pricing: "Anonymous: 5/day. Free tier: 25/mo. Pro ($49/mo): 500/mo.",
    docs: DOCS_URL,
  };

  if (!client.authenticated) {
    payload.setup = {
      step_1: "Try it now - call zuckerbot_preview_campaign with any business URL",
      step_2: `Get your free API key at ${DEVELOPER_URL}`,
      step_3: "Add ZUCKERBOT_API_KEY to your MCP config",
      step_4: "Restart your MCP client",
      example_config: {
        mcpServers: {
          zuckerbot: {
            command: "npx",
            args: ["-y", "zuckerbot-mcp"],
            env: { ZUCKERBOT_API_KEY: "zb_live_your_key_here" },
          },
        },
      },
    };
  }

  return payload;
}

function registerQuickstartTool(server: McpServer, client: ZuckerBotClient): void {
  server.tool(
    "zuckerbot_quickstart",
    "Show the current ZuckerBot mode, setup instructions, and the fastest recommended tool flow.",
    {},
    async () => {
      try {
        return formatResult(buildQuickstartPayload(client));
      } catch (err) {
        return formatError(err);
      }
    },
  );
}

const locationSchema = z
  .object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })
  .optional();

const goalsSchema = z
  .object({
    target_monthly_leads: z.number().int().optional(),
    target_cpl: z.number().optional(),
    target_monthly_budget: z.number().optional(),
    growth_multiplier: z.number().optional(),
    markets_to_target: z.array(z.string()).optional(),
    exclude_markets: z.array(z.string()).optional(),
  })
  .optional();

const creativeHandoffSchema = z
  .object({
    webhook_url: z.string().optional(),
    callback_url: z.string().optional(),
    product_focus: z.string().optional(),
    font_preset: z.string().optional(),
    market: z.string().optional(),
    notes: z.string().optional(),
    reference_urls: z.array(z.string()).optional(),
  })
  .passthrough()
  .optional();

const creativeUploadSchema = z.object({
  tier_name: z.string().describe("Approved audience tier name for this creative"),
  asset_url: z.string().describe("Publicly reachable image or video URL to upload to Meta"),
  asset_type: z.enum(["image", "video"]).default("image").describe("Asset type"),
  headline: z.string().describe("Primary headline for the ad"),
  body: z.string().describe("Primary body copy for the ad"),
  cta: z.string().optional().describe("Call to action label"),
  link_url: z.string().optional().describe("Optional landing page URL override"),
  angle_name: z.string().optional().describe("Approved creative angle name"),
  variant_index: z.number().int().optional().describe("Optional variant index for tracking"),
});

const businessContextTypeSchema = z
  .enum([
    "ad_performance",
    "customer_data",
    "brand_guidelines",
    "competitor_analysis",
    "sales_data",
    "other",
  ])
  .optional();

// ── Register all tools ───────────────────────────────────────────────

export function registerTools(server: McpServer, client: ZuckerBotClient): void {
  // ── 0. Quickstart ───────────────────────────────────────────────
  registerQuickstartTool(server, client);

  // ── 1. Preview Campaign ─────────────────────────────────────────
  server.tool(
    "zuckerbot_preview_campaign",
    "Generate a campaign preview from a business URL. Returns AI-generated ad creatives (headlines, copy, images) without needing a Meta account. Great for showing users what their ads would look like before they commit.",
    {
      url: z.string().describe("Business website URL to generate ads for"),
      ad_count: z
        .number()
        .int()
        .min(1)
        .max(3)
        .default(2)
        .describe("Number of ad variants to generate (1-3)"),
    },
    async ({ url, ad_count }) => {
      try {
        const result = await client.post("/campaigns/preview", {
          url,
          ad_count,
        });
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 2. Create Campaign ──────────────────────────────────────────
  server.tool(
    "zuckerbot_create_campaign",
    "Create a campaign draft. In intelligence mode this returns context-aware audience tiers, creative angles, budget guidance, and workflow next steps. Does NOT spend money or touch Meta.",
    {
      url: z.string().describe("Business website URL"),
      business_id: z.string().optional().describe("Existing ZuckerBot business ID to anchor intelligence mode"),
      business_name: z.string().optional().describe("Business name (auto-detected from URL if omitted)"),
      business_type: z
        .string()
        .optional()
        .describe("Business category (e.g., 'restaurant', 'fitness', 'roofing')"),
      location: locationSchema.describe("Business location for geo-targeting"),
      budget_daily_cents: z
        .number()
        .int()
        .optional()
        .describe("Daily budget in cents (e.g., 2000 = $20/day)"),
      mode: z
        .enum(["auto", "legacy", "intelligence"])
        .optional()
        .describe("Campaign planning mode. auto prefers intelligence when a business can be resolved"),
      objective: z
        .enum(["leads", "traffic", "conversions", "awareness"])
        .optional()
        .describe("Campaign objective. 'leads' for lead forms, 'traffic' for website visits, 'conversions' for website actions, 'awareness' for reach. Default: traffic"),
      goals: goalsSchema.describe("Optional business goals to guide planning"),
      creative_handoff: creativeHandoffSchema.describe("Optional creative-production handoff settings"),
    },
    async ({ url, business_id, business_name, business_type, location, budget_daily_cents, mode, objective, goals, creative_handoff }) => {
      try {
        const body: Record<string, unknown> = { url };
        if (business_id) body.business_id = business_id;
        if (business_name) body.business_name = business_name;
        if (business_type) body.business_type = business_type;
        if (location) body.location = location;
        if (budget_daily_cents !== undefined) body.budget_daily_cents = budget_daily_cents;
        if (mode) body.mode = mode;
        if (objective) body.objective = objective;
        if (goals) body.goals = goals;
        if (creative_handoff) body.creative_handoff = creative_handoff;

        const result = await client.post("/campaigns/create", body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_enrich_business",
    "Crawl a business website and extract structured context used by intelligence campaign planning.",
    {
      business_id: z.string().describe("Business ID to enrich"),
      url: z.string().optional().describe("Optional website URL override. Uses the stored business website when omitted."),
      force_refresh: z.boolean().optional().describe("Re-scrape even when cached context exists"),
    },
    async ({ business_id, url, force_refresh }) => {
      try {
        const body: Record<string, unknown> = {};
        if (url) body.url = url;
        if (force_refresh !== undefined) body.force_refresh = force_refresh;
        const result = await client.post(`/businesses/${business_id}/enrich`, body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_upload_business_context",
    "Upload text business context for a business and have ZuckerBot extract structured planning insights.",
    {
      business_id: z.string().describe("Business ID"),
      filename: z.string().describe("Name of the file or document"),
      content: z.string().describe("File content as text"),
      context_type: businessContextTypeSchema.describe("Optional hint about the type of uploaded context"),
    },
    async ({ business_id, filename, content, context_type }) => {
      try {
        const body: Record<string, unknown> = {
          filename,
          content,
        };
        if (context_type) body.context_type = context_type;
        const result = await client.post(`/businesses/${business_id}/uploads`, body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_list_business_context",
    "List uploaded business-context files and their extracted summaries for a business.",
    {
      business_id: z.string().describe("Business ID"),
    },
    async ({ business_id }) => {
      try {
        const result = await client.get(`/businesses/${business_id}/uploads`);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_get_campaign",
    "Get a campaign draft or live campaign, including intelligence workflow state, stored creatives, and linked tier executions.",
    {
      campaign_id: z.string().describe("ZuckerBot campaign ID"),
    },
    async ({ campaign_id }) => {
      try {
        const result = await client.get(`/campaigns/${campaign_id}`);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_approve_campaign_strategy",
    "Approve the generated intelligence strategy, optionally narrowing to specific audience tiers and creative angles before production starts.",
    {
      campaign_id: z.string().describe("Intelligence campaign ID"),
      tier_names: z.array(z.string()).optional().describe("Optional subset of audience tier names to approve"),
      angle_names: z.array(z.string()).optional().describe("Optional subset of creative angle names to approve"),
    },
    async ({ campaign_id, tier_names, angle_names }) => {
      try {
        const body: Record<string, unknown> = {};
        if (tier_names?.length) body.tier_names = tier_names;
        if (angle_names?.length) body.angle_names = angle_names;
        const result = await client.post(`/campaigns/${campaign_id}/approve-strategy`, body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_request_creative",
    "Create or dispatch a creative handoff package for an approved intelligence campaign. When an Ad Factory webhook is configured, ZuckerBot generates full scripts via Claude and dispatches the Ad Factory payload.",
    {
      campaign_id: z.string().describe("Intelligence campaign ID"),
      creative_handoff: creativeHandoffSchema.describe("Optional creative handoff configuration"),
    },
    async ({ campaign_id, creative_handoff }) => {
      try {
        const body: Record<string, unknown> = {};
        if (creative_handoff) body.creative_handoff = creative_handoff;
        const result = await client.post(`/campaigns/${campaign_id}/request-creative`, body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_upload_creative",
    "Upload finished creative assets for an approved intelligence campaign. This provisions paused tier executions when needed, uploads assets to Meta, and stores the resulting Meta IDs.",
    {
      campaign_id: z.string().describe("Intelligence campaign ID"),
      creatives: z.array(creativeUploadSchema).min(1).describe("Creative assets to attach to the campaign"),
      meta_access_token: z.string().optional().describe("Optional Meta/Facebook access token override"),
      meta_ad_account_id: z.string().optional().describe("Optional Meta ad account ID override (format: act_XXXXX)"),
      meta_page_id: z.string().optional().describe("Optional Facebook Page ID override"),
    },
    async ({ campaign_id, creatives, meta_access_token, meta_ad_account_id, meta_page_id }) => {
      try {
        const body: Record<string, unknown> = { creatives };
        if (meta_access_token) body.meta_access_token = meta_access_token;
        if (meta_ad_account_id) body.meta_ad_account_id = meta_ad_account_id;
        if (meta_page_id) body.meta_page_id = meta_page_id;
        const result = await client.post(`/campaigns/${campaign_id}/upload-creative`, body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_activate_campaign",
    "Activate the ready audience tiers for an intelligence campaign after strategy approval and creative upload. Only tiers with valid paused executions and creatives are turned on.",
    {
      campaign_id: z.string().describe("Intelligence campaign ID"),
      tier_names: z.array(z.string()).optional().describe("Optional subset of approved tiers to activate"),
      meta_access_token: z.string().optional().describe("Optional Meta/Facebook access token override"),
      meta_ad_account_id: z.string().optional().describe("Optional Meta ad account ID override (format: act_XXXXX)"),
      meta_page_id: z.string().optional().describe("Optional Facebook Page ID override"),
    },
    async ({ campaign_id, tier_names, meta_access_token, meta_ad_account_id, meta_page_id }) => {
      try {
        const body: Record<string, unknown> = {};
        if (tier_names?.length) body.tier_names = tier_names;
        if (meta_access_token) body.meta_access_token = meta_access_token;
        if (meta_ad_account_id) body.meta_ad_account_id = meta_ad_account_id;
        if (meta_page_id) body.meta_page_id = meta_page_id;
        const result = await client.post(`/campaigns/${campaign_id}/activate`, body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_suggest_angles",
    "Convenience helper that reads a campaign draft and returns the currently proposed creative angles plus the linked audience tiers.",
    {
      campaign_id: z.string().describe("Campaign ID"),
    },
    async ({ campaign_id }) => {
      try {
        const result = await client.get(`/campaigns/${campaign_id}`);
        const detail = asRecord(result) || {};
        const campaign = asRecord(detail.campaign) || {};
        const approvedStrategy = asRecord(campaign.approved_strategy);
        const draftStrategy = asRecord(campaign.strategy);
        const strategy = approvedStrategy || draftStrategy || {};
        const audienceTiers = Array.isArray(strategy.audience_tiers) ? strategy.audience_tiers : [];
        const creativeAngles = Array.isArray(strategy.creative_angles) ? strategy.creative_angles : [];

        return formatResult({
          campaign_id,
          campaign_version: campaign.campaign_version ?? null,
          creative_status: campaign.creative_status ?? null,
          strategy_summary: strategy.strategy_summary ?? null,
          audience_tiers: audienceTiers,
          creative_angles: creativeAngles,
        });
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 3. Launch Campaign ──────────────────────────────────────────
  server.tool(
    "zuckerbot_launch_campaign",
    "Launch a draft campaign on Meta (Facebook/Instagram). This is the money endpoint — it creates real ads on the user's Meta ad account and starts spending their budget. Stored credentials are auto-resolved when available.",
    {
      campaign_id: z.string().describe("ZuckerBot campaign ID from the create step"),
      meta_access_token: z.string().optional().describe("User's Meta/Facebook access token. Optional if Facebook is connected on zuckerbot.ai"),
      meta_ad_account_id: z.string().optional().describe("Meta ad account ID (format: act_XXXXX). Optional if Facebook is connected on zuckerbot.ai"),
      meta_page_id: z.string().optional().describe("Facebook Page ID. Optional if Facebook is connected on zuckerbot.ai"),
      variant_index: z
        .number()
        .int()
        .default(0)
        .describe("Which creative variant to launch (0-indexed)"),
      daily_budget_cents: z
        .number()
        .int()
        .optional()
        .describe("Override daily budget in cents"),
      radius_km: z.number().int().optional().describe("Override targeting radius in km"),
      launch_all_variants: z.boolean().optional().describe("Launch all creative variants as separate ads for A/B testing. Meta will auto-optimize for the winner."),
    },
    async ({
      campaign_id,
      meta_access_token,
      meta_ad_account_id,
      meta_page_id,
      variant_index,
      launch_all_variants,
      daily_budget_cents,
      radius_km,
    }) => {
      try {
        const body: Record<string, unknown> = { variant_index };
        if (meta_access_token) body.meta_access_token = meta_access_token;
        if (meta_ad_account_id) body.meta_ad_account_id = meta_ad_account_id;
        if (meta_page_id) body.meta_page_id = meta_page_id;
        if (daily_budget_cents !== undefined) body.daily_budget_cents = daily_budget_cents;
        if (radius_km !== undefined) body.radius_km = radius_km;
        if (launch_all_variants) body.launch_all_variants = true;

        const result = await client.post(`/campaigns/${campaign_id}/launch`, body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 4. Launch All Variants ─────────────────────────────────────
  server.tool(
    "zuckerbot_launch_all_variants",
    "Launch all creative variants from a draft campaign as separate ads for A/B testing. Uses stored Meta credentials when available.",
    {
      campaign_id: z.string().describe("ZuckerBot campaign ID from the create step"),
      meta_access_token: z.string().optional().describe("Optional Meta/Facebook access token override"),
      meta_ad_account_id: z.string().optional().describe("Optional Meta ad account ID override (format: act_XXXXX)"),
      meta_page_id: z.string().optional().describe("Optional Facebook Page ID override"),
      daily_budget_cents: z
        .number()
        .int()
        .optional()
        .describe("Optional daily budget override in cents"),
      radius_km: z.number().int().optional().describe("Optional targeting radius override in km"),
    },
    async ({ campaign_id, meta_access_token, meta_ad_account_id, meta_page_id, daily_budget_cents, radius_km }) => {
      try {
        const body: Record<string, unknown> = {
          launch_all_variants: true,
        };
        if (meta_access_token) body.meta_access_token = meta_access_token;
        if (meta_ad_account_id) body.meta_ad_account_id = meta_ad_account_id;
        if (meta_page_id) body.meta_page_id = meta_page_id;
        if (daily_budget_cents !== undefined) body.daily_budget_cents = daily_budget_cents;
        if (radius_km !== undefined) body.radius_km = radius_km;

        const result = await client.post(`/campaigns/${campaign_id}/launch`, body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 5. Pause / Resume Campaign ─────────────────────────────────
  server.tool(
    "zuckerbot_pause_campaign",
    "Pause or resume a running campaign on Meta. Pausing stops ad delivery and spend immediately. Resuming restarts delivery.",
    {
      campaign_id: z.string().describe("ZuckerBot campaign ID"),
      action: z
        .enum(["pause", "resume"])
        .default("pause")
        .describe("Whether to pause or resume the campaign"),
    },
    async ({ campaign_id, action }) => {
      try {
        const result = await client.post(`/campaigns/${campaign_id}/pause`, {
          action,
        });
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 6. Get Performance ──────────────────────────────────────────
  server.tool(
    "zuckerbot_get_performance",
    "Get real-time performance metrics for a campaign. Returns impressions, clicks, spend, leads, cost-per-lead, click-through rate, and a performance status (learning/healthy/underperforming/paused).",
    {
      campaign_id: z.string().describe("ZuckerBot campaign ID"),
    },
    async ({ campaign_id }) => {
      try {
        const result = await client.get(`/campaigns/${campaign_id}/performance`);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_create_seed_audience",
    "Build a Meta custom audience from stored hashed CAPI user data for a business and CRM stage.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
      source_stage: z.string().describe("CRM lifecycle or source stage to seed from"),
      name: z.string().optional().describe("Optional audience name override"),
      lookback_days: z.number().int().optional().describe("How many days of CAPI events to include"),
      min_contacts: z.number().int().optional().describe("Minimum matched contacts required before creation"),
    },
    async ({ business_id, source_stage, name, lookback_days, min_contacts }) => {
      try {
        const body: Record<string, unknown> = { source_stage };
        if (business_id) body.business_id = business_id;
        if (name) body.name = name;
        if (lookback_days !== undefined) body.lookback_days = lookback_days;
        if (min_contacts !== undefined) body.min_contacts = min_contacts;
        const result = await client.post("/audiences/create-seed", body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_create_lookalike_audience",
    "Create a Meta lookalike audience from a stored seed audience. Useful for intelligence tiers that need a 1%, 3%, or 5% prospecting expansion.",
    {
      seed_audience_id: z.string().describe("Stored seed audience row ID"),
      percentage: z.number().min(1).max(20).optional().describe("Lookalike percentage, typically 1, 3, or 5"),
      name: z.string().optional().describe("Optional audience name override"),
      country: z.string().optional().describe("Lookalike country code, such as US or AU"),
    },
    async ({ seed_audience_id, percentage, name, country }) => {
      try {
        const body: Record<string, unknown> = { seed_audience_id };
        if (percentage !== undefined) body.percentage = percentage;
        if (name) body.name = name;
        if (country) body.country = country;
        const result = await client.post("/audiences/create-lal", body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_list_audiences",
    "List stored Meta audiences for a business, including seed metadata, lookalike settings, sizes, and delivery status.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
    },
    async ({ business_id }) => {
      try {
        const params = new URLSearchParams();
        if (business_id) params.set("business_id", business_id);
        const result = await client.get(`/audiences/list${params.toString() ? `?${params.toString()}` : ""}`);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_refresh_audience",
    "Refresh a stored audience. Seed audiences are rebuilt from hashed CAPI data; lookalikes sync their latest Meta status after the seed refreshes.",
    {
      audience_id: z.string().describe("Stored audience row ID"),
    },
    async ({ audience_id }) => {
      try {
        const result = await client.post("/audiences/refresh", { audience_id });
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_get_audience_status",
    "Fetch the latest Meta status for a stored audience and update the local audience registry row.",
    {
      audience_id: z.string().describe("Stored audience row ID"),
    },
    async ({ audience_id }) => {
      try {
        const result = await client.get(`/audiences/${audience_id}/status`);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_delete_audience",
    "Delete a stored audience from Meta and remove it from ZuckerBot's local audience registry.",
    {
      audience_id: z.string().describe("Stored audience row ID"),
    },
    async ({ audience_id }) => {
      try {
        const result = await client.delete(`/audiences/${audience_id}`);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 7. Get Account Insights ───────────────────────────────────
  server.tool(
    "zuckerbot_get_account_insights",
    "Fetch historical Meta ad account insights for a connected business over a date range. Useful for month-over-month spend, clicks, impressions, CTR, CPM, CPC, and frequency analysis without exporting from Ads Manager.",
    {
      business_id: z.string().describe("Business ID linked to the connected Meta ad account"),
      date_from: z.string().describe("Start date in YYYY-MM-DD format"),
      date_to: z.string().describe("End date in YYYY-MM-DD format"),
      time_increment: z
        .enum(["daily", "monthly"])
        .default("monthly")
        .describe("Whether to break the results down daily or monthly"),
    },
    async ({ business_id, date_from, date_to, time_increment }) => {
      try {
        const params = new URLSearchParams({
          business_id,
          date_from,
          date_to,
          time_increment,
        });
        const result = await client.get(`/ad-account/insights?${params.toString()}`);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 8. Sync Conversion ─────────────────────────────────────────
  server.tool(
    "zuckerbot_sync_conversion",
    "Send conversion feedback to Meta's algorithm. When a lead converts (or doesn't), this teaches Meta to find more (or fewer) people like them. Critical for improving lead quality over time.",
    {
      campaign_id: z.string().describe("ZuckerBot campaign ID"),
      lead_id: z.string().describe("Lead ID to report conversion for"),
      quality: z
        .enum(["good", "bad"])
        .describe("Lead quality: 'good' = converted/contacted, 'bad' = lost/unresponsive"),
      meta_access_token: z.string().describe("User's Meta access token for CAPI"),
      user_data: z
        .object({
          email: z.string().optional(),
          phone: z.string().optional(),
          first_name: z.string().optional(),
          last_name: z.string().optional(),
        })
        .optional()
        .describe("Optional user data to improve match rate"),
    },
    async ({ campaign_id, lead_id, quality, meta_access_token, user_data }) => {
      try {
        const body: Record<string, unknown> = {
          lead_id,
          quality,
          meta_access_token,
        };
        if (user_data) body.user_data = user_data;

        const result = await client.post(`/campaigns/${campaign_id}/conversions`, body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 9. Research Reviews ─────────────────────────────────────────
  server.tool(
    "zuckerbot_research_reviews",
    "Get review intelligence for a business. Surfaces sentiment themes and standout proof points usable in ad copy.",
    {
      url: z.string().describe("Business website URL"),
    },
    async ({ url }) => {
      try {
        const result = await client.post("/research/reviews", { url });
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 10. Research Competitors ────────────────────────────────────
  server.tool(
    "zuckerbot_research_competitors",
    "Analyse competitor ads for a business category and location. Returns competitor positioning, creative patterns, and gaps to exploit.",
    {
      category: z.string().describe("Business category (e.g., 'online party games')"),
      location: z.string().describe("City/region (e.g., 'Austin, TX')"),
    },
    async ({ category, location }) => {
      try {
        const result = await client.post("/research/competitors", { category, location });
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 11. Research Market ─────────────────────────────────────────
  server.tool(
    "zuckerbot_research_market",
    "Get market size, audience estimates, and ad benchmarks for an industry and location. Use before creating a campaign to understand the landscape.",
    {
      industry: z.string().describe("Industry/business category (e.g., 'fitness', 'dental')"),
      location: z.string().describe("City/region (e.g., 'United States')"),
    },
    async ({ industry, location }) => {
      try {
        const result = await client.post("/research/market", {
          industry,
          location,
        });
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 12. Meta Connection Status ─────────────────────────────────
  server.tool(
    "zuckerbot_meta_status",
    "Check if the user has connected their Facebook/Meta account. If not connected, returns a URL where they can connect. Always check this before attempting to launch a campaign.",
    {},
    async () => {
      try {
        const result = await client.get("/meta/status");
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 13. List Meta Ad Accounts ──────────────────────────────────
  server.tool(
    "zuckerbot_list_ad_accounts",
    "List Meta ad accounts available to the connected user and indicate which ad account is currently selected for launches and autonomous management.",
    {},
    async () => {
      try {
        const result = await client.get("/meta/ad-accounts");
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 14. Select Meta Ad Account ─────────────────────────────────
  server.tool(
    "zuckerbot_select_ad_account",
    "Select and store the Meta ad account to use for launches, reporting, and autonomous management. Switching accounts clears the stored page selection so the user can pick a matching page.",
    {
      ad_account_id: z.string().describe("Meta ad account ID to use for future launches (format: act_XXXXX)"),
    },
    async ({ ad_account_id }) => {
      try {
        const result = await client.post("/meta/select-ad-account", {
          ad_account_id,
        });
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 15. List Meta Pixels ───────────────────────────────────────
  server.tool(
    "zuckerbot_list_pixels",
    "List Meta Pixels available to the currently selected Meta ad account and indicate which pixel is currently selected for conversion tracking.",
    {},
    async () => {
      try {
        const result = await client.get("/pixels");
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 16. Select Meta Pixel ──────────────────────────────────────
  server.tool(
    "zuckerbot_select_pixel",
    "Select and store the Meta Pixel to use for conversion tracking on the currently selected Meta ad account.",
    {
      pixel_id: z.string().describe("Meta Pixel ID to use for future conversion tracking"),
    },
    async ({ pixel_id }) => {
      try {
        const result = await client.post("/pixels/select", {
          pixel_id,
        });
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 17. List Facebook Pages ────────────────────────────────────
  server.tool(
    "zuckerbot_list_meta_pages",
    "List Facebook pages available to the connected Meta account and indicate which page is currently selected for launch.",
    {},
    async () => {
      try {
        const result = await client.get("/meta/pages");
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 18. Select Facebook Page ───────────────────────────────────
  server.tool(
    "zuckerbot_select_meta_page",
    "Select and store the Facebook page to use for launches. Use this when multiple pages are available.",
    {
      page_id: z.string().describe("Facebook Page ID to use for future launches"),
    },
    async ({ page_id }) => {
      try {
        const result = await client.post("/meta/select-page", {
          page_id,
        });
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 19. List Lead Forms ────────────────────────────────────────
  server.tool(
    "zuckerbot_list_lead_forms",
    "List available Meta lead forms (Instant Forms) for the selected Facebook page. Use this before launching lead generation campaigns so ZuckerBot reuses the business's existing CRM-connected form instead of generating a new one.",
    {},
    async () => {
      try {
        const result = await client.get("/lead-forms");
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 20. Select Lead Form ───────────────────────────────────────
  server.tool(
    "zuckerbot_select_lead_form",
    "Select and store the Meta lead form (Instant Form) from the selected Facebook page for future lead generation campaigns for the linked business.",
    {
      form_id: z.string().describe("Meta lead form ID to use for future lead generation launches"),
    },
    async ({ form_id }) => {
      try {
        const result = await client.post("/lead-forms/select", {
          form_id,
        });
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 21. Resolve Launch Credentials ─────────────────────────────
  server.tool(
    "zuckerbot_get_launch_credentials",
    "Resolve stored Meta launch credentials for the authenticated API key/user and report whether autonomous launch is possible.",
    {},
    async () => {
      try {
        const result = await client.get("/meta/credentials");
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 22. Generate Creatives ─────────────────────────────────────
  server.tool(
    "zuckerbot_generate_creatives",
    "Generate ad creatives independently from campaign creation. Supports image creatives (Seedream/Imagen) and video creatives (Kling). If the prompt text asks for a video ad, the tool auto-routes to Kling/video unless explicitly overridden.",
    {
      business_name: z.string().describe("Business name"),
      description: z.string().describe("Brief description of the business"),
      count: z
        .number()
        .int()
        .min(1)
        .max(5)
        .default(2)
        .describe("Number of creative variants to generate (1-5)"),
      model: z
        .enum(["auto", "seedream", "imagen", "kling"])
        .optional()
        .describe("Model selection. auto/seedream/imagen are image paths, kling is video path. Optional; inferred when omitted."),
      media_type: z
        .enum(["image", "video"])
        .optional()
        .describe("Output media type. Optional; video intent in text auto-selects 'video'."),
      quality: z
        .enum(["fast", "ultra"])
        .default("fast")
        .describe('Generation quality. "ultra" is supported only when model is "kling".'),
      generate_images: z
        .boolean()
        .default(true)
        .describe("Whether to generate AI images (set false for copy-only)"),
    },
    async ({ business_name, description, count, model, media_type, quality, generate_images }) => {
      try {
        const intentText = `${business_name} ${description}`.toLowerCase();
        const inferredVideoIntent = /\b(video|video ad|reel|short[- ]form|ugc|clip|tiktok)\b/.test(intentText);
        const resolvedModel = model ?? (inferredVideoIntent ? "kling" : "auto");
        const resolvedMediaType = resolvedModel === "kling" || media_type === "video" || inferredVideoIntent
          ? "video"
          : "image";
        const result = await client.post("/creatives/generate", {
          business_name,
          description,
          count,
          model: resolvedModel,
          media_type: resolvedMediaType,
          quality: quality ?? "fast",
          generate_images: generate_images ?? true,
        });
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 19. CAPI Config ────────────────────────────────────────────
  server.tool(
    "zuckerbot_capi_config",
    "Fetch or update the per-business Conversions API configuration, including stage-to-event mappings, CRM source, currency, optimisation target, and Meta action source.",
    {
      business_id: z.string().optional().describe("Optional business ID override for the authenticated API key"),
      is_enabled: z.boolean().optional().describe("Enable or disable CAPI delivery for the business"),
      currency: z.string().optional().describe("Business currency used for CAPI event values, such as USD or AUD"),
      crm_source: z.string().optional().describe("CRM source label, such as hubspot"),
      optimise_for: z.enum(["lead", "sql", "customer"]).optional().describe("Downstream optimisation target for autonomous evaluation"),
      action_source: z
        .enum(["website", "app", "email", "phone_call", "chat", "physical_store", "system_generated", "business_messaging", "other"])
        .optional()
        .describe("Meta Conversions API action_source. Defaults to website for CRM events"),
      rotate_webhook_secret: z.boolean().optional().describe("Rotate the webhook secret on update"),
      event_mapping: z
        .record(
          z.string(),
          z.object({
            meta_event: z.string().describe("Meta standard event name"),
            value: z.number().optional().describe("Event value in major currency units"),
          }),
        )
        .optional()
        .describe("CRM stage mapping object keyed by source stage"),
    },
    async ({ business_id, is_enabled, currency, crm_source, optimise_for, action_source, rotate_webhook_secret, event_mapping }) => {
      try {
        const hasUpdateFields =
          is_enabled !== undefined
          || currency !== undefined
          || crm_source !== undefined
          || optimise_for !== undefined
          || action_source !== undefined
          || rotate_webhook_secret !== undefined
          || event_mapping !== undefined;

        if (!hasUpdateFields) {
          const params = new URLSearchParams();
          if (business_id) params.set("business_id", business_id);
          const result = await client.get(`/capi/config${params.toString() ? `?${params.toString()}` : ""}`);
          return formatResult(result);
        }

        const body: Record<string, unknown> = {};
        if (business_id) body.business_id = business_id;
        if (is_enabled !== undefined) body.is_enabled = is_enabled;
        if (currency) body.currency = currency;
        if (crm_source) body.crm_source = crm_source;
        if (optimise_for) body.optimise_for = optimise_for;
        if (action_source) body.action_source = action_source;
        if (rotate_webhook_secret !== undefined) body.rotate_webhook_secret = rotate_webhook_secret;
        if (event_mapping) body.event_mapping = event_mapping;

        const result = await client.put("/capi/config", body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 20. CAPI Status ────────────────────────────────────────────
  server.tool(
    "zuckerbot_capi_status",
    "Get 7-day and 30-day Conversions API delivery, attribution, and event-type status for the authenticated business.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
    },
    async ({ business_id }) => {
      try {
        const params = new URLSearchParams();
        if (business_id) params.set("business_id", business_id);
        const result = await client.get(`/capi/status${params.toString() ? `?${params.toString()}` : ""}`);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 21. CAPI Test ──────────────────────────────────────────────
  server.tool(
    "zuckerbot_capi_test",
    "Send a synthetic CAPI test event through the business configuration and log it as a test event.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
      source_stage: z.string().optional().describe("CRM stage key to test against the mapping"),
      crm_source: z.string().optional().describe("Optional CRM source label override"),
      value: z.number().optional().describe("Optional event value override"),
      user_data: z
        .object({
          email: z.string().optional(),
          phone: z.string().optional(),
          first_name: z.string().optional(),
          last_name: z.string().optional(),
        })
        .optional()
        .describe("Optional user data to hash into the test payload"),
    },
    async ({ business_id, source_stage, crm_source, value, user_data }) => {
      try {
        const body: Record<string, unknown> = {};
        if (business_id) body.business_id = business_id;
        if (source_stage) body.source_stage = source_stage;
        if (crm_source) body.crm_source = crm_source;
        if (value !== undefined) body.value = value;
        if (user_data) body.user_data = user_data;

        const result = await client.post("/capi/config/test", body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 22. Create Portfolio ───────────────────────────────────────
  server.tool(
    "zuckerbot_create_portfolio",
    "Create a business-owned audience portfolio from a shared template or a custom tier definition.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
      template_id: z.string().optional().describe("Optional portfolio template ID"),
      template_name: z.string().optional().describe("Optional portfolio template name, such as 'Local Services'"),
      name: z.string().optional().describe("Optional portfolio name"),
      total_daily_budget_cents: z.number().int().optional().describe("Total daily budget in cents"),
      is_active: z.boolean().optional().describe("Whether the portfolio should be active immediately"),
      tiers: z
        .array(
          z.object({
            tier: z.string(),
            budget_pct: z.number(),
            target_cpa_multiplier: z.number(),
            description: z.string().optional(),
          }),
        )
        .optional()
        .describe("Optional custom tier array to override the template"),
    },
    async ({ business_id, template_id, template_name, name, total_daily_budget_cents, is_active, tiers }) => {
      try {
        const body: Record<string, unknown> = {};
        if (business_id) body.business_id = business_id;
        if (template_id) body.template_id = template_id;
        if (template_name) body.template_name = template_name;
        if (name) body.name = name;
        if (total_daily_budget_cents !== undefined) body.total_daily_budget_cents = total_daily_budget_cents;
        if (is_active !== undefined) body.is_active = is_active;
        if (tiers) body.tiers = tiers;

        const result = await client.post("/portfolios/create", body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 23. Portfolio Performance ─────────────────────────────────
  server.tool(
    "zuckerbot_portfolio_performance",
    "Fetch tier-by-tier performance for a launched audience portfolio, including selected evaluation metric and downstream attributed conversions.",
    {
      portfolio_id: z.string().describe("Audience portfolio ID"),
    },
    async ({ portfolio_id }) => {
      try {
        const result = await client.get(`/portfolios/${portfolio_id}/performance`);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 24. Rebalance Portfolio ───────────────────────────────────
  server.tool(
    "zuckerbot_rebalance_portfolio",
    "Dry-run or execute an audience portfolio rebalance using the same per-business cost metric hierarchy as autonomous evaluation.",
    {
      portfolio_id: z.string().describe("Audience portfolio ID"),
      dry_run: z.boolean().default(true).describe("When true, returns recommendations without applying changes"),
      meta_access_token: z.string().optional().describe("Optional Meta access token override for ad set budget updates"),
    },
    async ({ portfolio_id, dry_run, meta_access_token }) => {
      try {
        const body: Record<string, unknown> = { dry_run };
        if (meta_access_token) body.meta_access_token = meta_access_token;
        const result = await client.post(`/portfolios/${portfolio_id}/rebalance`, body);
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );
}

export function registerDemoTools(server: McpServer, client: ZuckerBotClient): void {
  registerQuickstartTool(server, client);

  server.tool(
    "zuckerbot_preview_campaign",
    "Generate a campaign preview from a business URL. Returns AI-generated ad creatives (headlines, copy, images) without needing a Meta account. Great for showing users what their ads would look like before they commit.",
    {
      url: z.string().describe("Business website URL to generate ads for"),
      ad_count: z
        .number()
        .int()
        .min(1)
        .max(3)
        .default(2)
        .describe("Number of ad variants to generate (1-3)"),
    },
    async ({ url, ad_count }) => {
      try {
        const result = await client.post("/campaigns/preview", {
          url,
          ad_count,
        });
        return formatResult(appendHint(result, CAMPAIGN_HINT));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_generate_creatives",
    "Generate ad creatives independently from campaign creation. Supports image creatives (Seedream/Imagen) and video creatives (Kling). If the prompt text asks for a video ad, the tool auto-routes to Kling/video unless explicitly overridden.",
    {
      business_name: z.string().describe("Business name"),
      description: z.string().describe("Brief description of the business"),
      count: z
        .number()
        .int()
        .min(1)
        .max(3)
        .default(2)
        .describe("Number of creative variants to generate (1-3)"),
      model: z
        .enum(["auto", "seedream", "imagen", "kling"])
        .optional()
        .describe("Model selection. auto/seedream/imagen are image paths, kling is video path. Optional; inferred when omitted."),
      media_type: z
        .enum(["image", "video"])
        .optional()
        .describe("Output media type. Optional; video intent in text auto-selects 'video'."),
      quality: z
        .enum(["fast", "ultra"])
        .default("fast")
        .describe('Generation quality. "ultra" is supported only when model is "kling".'),
      generate_images: z
        .boolean()
        .default(true)
        .describe("Whether to generate AI images (set false for copy-only)"),
    },
    async ({ business_name, description, count, model, media_type, quality, generate_images }) => {
      try {
        const intentText = `${business_name} ${description}`.toLowerCase();
        const inferredVideoIntent = /\b(video|video ad|reel|short[- ]form|ugc|clip|tiktok)\b/.test(intentText);
        const resolvedModel = model ?? (inferredVideoIntent ? "kling" : "auto");
        const resolvedMediaType = resolvedModel === "kling" || media_type === "video" || inferredVideoIntent
          ? "video"
          : "image";
        const result = await client.post("/creatives/generate", {
          business_name,
          description,
          count: Math.min(count, 3),
          model: resolvedModel,
          media_type: resolvedMediaType,
          quality: quality ?? "fast",
          generate_images: generate_images ?? true,
        });
        return formatResult(appendHint(result, CAMPAIGN_HINT));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_research_market",
    "Get market size, audience estimates, and ad benchmarks for an industry and location. Use before creating a campaign to understand the landscape.",
    {
      industry: z.string().describe("Industry/business category (e.g., 'fitness', 'dental')"),
      location: z.string().describe("City/region (e.g., 'United States')"),
    },
    async ({ industry, location }) => {
      try {
        const result = await client.post("/research/market", {
          industry,
          location,
        });
        return formatResult(result);
      } catch (err) {
        return formatError(err);
      }
    },
  );
}
