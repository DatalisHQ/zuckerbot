// ── ZuckerBot MCP Tool Definitions ───────────────────────────────────

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ZuckerBotClient, ZuckerBotApiError } from "./client.js";

// ── Helpers ──────────────────────────────────────────────────────────

const DEVELOPER_URL = "https://zuckerbot.ai/developer";
const DOCS_URL = "https://zuckerbot.ai/docs";
const CAMPAIGN_HINT = `Get your API key at ${DEVELOPER_URL} to launch this campaign.`;
const CREATIVE_STATUS_POLL_INTERVAL_MS = 15_000;
const CREATIVE_STATUS_MAX_POLLS = 8;

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

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// Creative image/video *generation* tools are hidden by default (paid add-on
// coming). Set ZUCKERBOT_ENABLE_CREATIVE_TOOLS=1 (or "true") to register them.
// Creative *analysis* tools are always available.
function creativeGenerationToolsEnabled(): boolean {
  const flag = (process.env.ZUCKERBOT_ENABLE_CREATIVE_TOOLS || "").trim().toLowerCase();
  return flag === "1" || flag === "true";
}

async function pollCreativeStatus(
  client: ZuckerBotClient,
  campaignId: string,
): Promise<{ completed: boolean; attempts: number; lastStatus: unknown | null }> {
  let lastStatus: unknown | null = null;

  for (let attempt = 1; attempt <= CREATIVE_STATUS_MAX_POLLS; attempt += 1) {
    if (attempt > 1) {
      await sleep(CREATIVE_STATUS_POLL_INTERVAL_MS);
    }

    const status = await client.get(`/campaigns/${campaignId}/creative-status`);
    lastStatus = status;
    const payload = asRecord(status);
    if (payload?.all_complete === true) {
      return { completed: true, attempts: attempt, lastStatus };
    }
  }

  return {
    completed: false,
    attempts: CREATIVE_STATUS_MAX_POLLS,
    lastStatus,
  };
}

function buildQuickstartPayload(client: ZuckerBotClient): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    status: client.authenticated ? "authenticated" : "demo_mode",
    message: client.authenticated
      ? "All tools available. Start with zuckerbot_audit_account for an instant read-only audit of the connected ad account. For full campaign planning, use zuckerbot_analyse_account_history → zuckerbot_recommend_campaign_structure. For quick launches, use zuckerbot_preview_campaign → zuckerbot_create_campaign."
      : "Running in demo mode. Some tools require authentication.",
    recommended_flow: [
      {
        step: 0,
        tool: "zuckerbot_audit_account",
        description: "Full account audit: wasted spend, creative fatigue, opportunity score, action items",
        requires_key: true,
        flow: "audit",
      },
      {
        step: 1,
        tool: "zuckerbot_analyse_account_history",
        description: "Analyse past ad performance to inform campaign planning",
        requires_key: true,
        flow: "campaign_architect",
      },
      {
        step: 1.5,
        tool: "zuckerbot_recommend_campaign_structure",
        description: "Get AI-powered campaign structure with audience tiers and budget allocation",
        requires_key: true,
        flow: "campaign_architect",
      },
      {
        step: 2,
        tool: "zuckerbot_preview_campaign",
        description: "Paste a URL -> get ad previews instantly",
        requires_key: false,
        flow: "quick_launch",
      },
      {
        step: 3,
        tool: "zuckerbot_research_market",
        description: "Market size and ad benchmarks",
        requires_key: false,
        flow: "quick_launch",
      },
      {
        step: 4,
        tool: "zuckerbot_create_campaign",
        description: "Create a reviewed launch-ready campaign draft",
        requires_key: true,
        flow: "quick_launch",
      },
      {
        step: 5,
        tool: "zuckerbot_launch_campaign",
        description: "Launch the reviewed legacy draft on Meta",
        requires_key: true,
        flow: "quick_launch",
      },
      {
        step: 6,
        tool: "zuckerbot_get_performance",
        description: "Real-time campaign metrics",
        requires_key: true,
        flow: "quick_launch",
      },
    ],
    pricing: "Free: 1,000 calls/month, read-only including the account audit. Pro: $49/mo with 50K calls and all tools. Scale: $149/mo with 500K calls and all tools. Lifetime licences (Dealify): Tier 1 1 ad account/2.5K calls/mo, Tier 2 3 accounts/10K, Tier 3 10 accounts/30K — redeem with zuckerbot_redeem_license.",
    billing_tiers: {
      free: "1,000 calls/month, read-only (performance, research, analysis, audit)",
      pro: "$49/mo, 50K calls, all tools",
      scale: "$149/mo, 500K calls, agencies",
      lifetime: "Lifetime licences (Dealify): Tier 1 1 ad account/2.5K calls/mo, Tier 2 3 accounts/10K, Tier 3 10 accounts/30K — redeem with zuckerbot_redeem_license",
    },
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
    "Show the current ZuckerBot authentication mode (demo vs authenticated), the Free/Pro/Scale and Lifetime billing tiers, setup instructions if not yet configured, and the recommended tool flow from audit → campaign → launch → performance. Returns status, recommended_flow steps, pricing info, and setup guide for unauthenticated users. Call this first in any new session to orient the agent.",
    {},
    async () => {
      try {
        return formatResult(appendHint(buildQuickstartPayload(client), "Next: run zuckerbot_audit_account for an instant read-only audit of the connected ad account, use zuckerbot_upload_business_context to add business details, then zuckerbot_ad_accounts to connect your Meta ad account. For a quick demo, jump straight to zuckerbot_preview_campaign with any business URL."));
      } catch (err) {
        return formatError(err);
      }
    },
  );
}

function registerBillingStatusTool(server: McpServer, client: ZuckerBotClient): void {
  server.tool(
    "zuckerbot_billing_status",
    "Check your current ZuckerBot billing tier, API call usage this month, remaining quota, and overage costs. Use this when a user asks about their plan or usage limits.",
    {},
    async () => {
      try {
        client.requireAuth();
        const data = await client.get("/billing/status");
        const record = asRecord(data);
        const tier = typeof record?.tier === "string" ? record.tier : null;
        const usage = asRecord(record?.usage);
        const callsRemaining = typeof usage?.calls_remaining === "number" ? usage.calls_remaining : null;
        const upgradeUrl = typeof record?.upgrade_url === "string" ? record.upgrade_url : null;

        return formatResult(
          appendHint(
            data,
            tier === "free"
              ? `Free tier: 1,000 calls/month, read-only. Upgrade to Pro ($49/mo) for full access at ${upgradeUrl || DEVELOPER_URL}`
              : tier && typeof callsRemaining === "number"
                ? `${tier} tier: ${callsRemaining} calls remaining this month.`
                : "Billing status retrieved.",
          ),
        );
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

// ── Creative generation tools (env-gated) ────────────────────────────
//
// Image/video *generation* tools. Hidden by default — registered only when
// ZUCKERBOT_ENABLE_CREATIVE_TOOLS is "1" or "true" (paid add-on coming).
// Creative *analysis* tools (creative_analysis, creative_cross_analysis,
// tag_creative, creative_qa, generate_briefs) stay in registerTools and are
// always available.

function registerCreativeGenerationTools(server: McpServer, client: ZuckerBotClient): void {
  // ── Generate Static Ad ──────────────────────────────────────────
  server.tool(
    "zuckerbot_generate_static_ad",
    "Generate a brand-aware 1080×1080 static ad image. Automatically injects brand context (logo, colors, brand name, value props, social proof) from the business profile when business_id is provided — no need to pass brand data manually. Templates: stat_hook (statistic + supporting copy), pain_headline (bold headline + benefit bullets), testimonial (customer quote + portrait), feature_showcase (product + benefits). Returns a public image URL and QA scores. Present the image to the customer for approval; to generate more variants, call again with different parameters.",
    {
      business_id: z.string().optional().describe("Business ID for automatic brand context injection (logo, colors, CTA, testimonials)"),
      session_id: z.string().optional().describe("Architect session ID — when provided, the generated asset is linked to this campaign session"),
      template: z
        .enum(["stat_hook", "pain_headline", "testimonial", "feature_showcase"])
        .describe("Ad template"),
      headline: z.string().optional().describe("Primary headline (required for stat_hook, pain_headline, feature_showcase)"),
      subtext: z.string().optional().describe("Subtext below headline (stat_hook only)"),
      body: z.string().optional().describe("Body copy (stat_hook only)"),
      cta: z.string().optional().describe("CTA text. Auto-filled from business primary_cta if omitted."),
      quote: z.string().optional().describe("Testimonial quote. Auto-filled from business social_proof if omitted (testimonial template)."),
      attribution: z.string().optional().describe("Quote attribution (testimonial template)"),
      price_text: z.string().optional().describe("Price text (feature_showcase template)"),
      hero_prompt: z.string().optional().describe("Hero image generation prompt. Auto-generated from brand context if omitted."),
      hero_image_url: z.string().optional().describe("Direct hero image URL (skips AI image generation)"),
      skip_qa: z.boolean().default(false).describe("Skip QA vision scoring for faster generation"),
      slot_id: z.string().optional().describe("Optional creative brief slot_id for linking to a campaign brief"),
    },
    async (params) => {
      try {
        client.requireAuth();
        const body: Record<string, unknown> = { ...params };
        if (params.business_id) {
          body.business_id = await client.resolveBusinessId(params.business_id);
        }
        const result = await client.post("/architect/generate-static", body);
        return formatResult(
          appendHint(
            result,
            "Static ad generated. Present the public_url image to the customer for review. To generate more variants, call again with different parameters (or different template). When all creatives are ready, get customer approval in the conversation before pushing to Meta.",
          ),
        );
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── Generate Video Ad ───────────────────────────────────────────
  server.tool(
    "zuckerbot_generate_video_ad",
    "Generate a video ad through ZuckerBot's video generation pipeline (AI scripting → AI video → captioned overlay → hosted upload). ASYNC operation: returns a job_id immediately. Poll with zuckerbot_get_video_ad_status every 30 seconds for completion. Brand context is loaded server-side. Typical generation time: 5-15 minutes. Note: AI-generated video ads may face Meta ad review scrutiny — rejection tracking is built in.",
    {
      business_id: z.string().describe("Business ID (required for creative routing)"),
      focus: z.string().describe("Product/feature focus for the ad (e.g., 'missed_calls', 'quoting', 'scheduling')"),
      market: z.string().default("AU").describe("Target market code (AU, US, UK, NZ)"),
      ad_account_id: z.string().optional().describe("Meta ad account ID (auto-resolved if omitted)"),
      session_id: z.string().optional().describe("Architect session ID for tracking"),
      slot_id: z.string().optional().describe("Creative brief slot_id for tracking"),
    },
    async ({ business_id, focus, market, ad_account_id, session_id, slot_id }) => {
      try {
        client.requireAuth();
        const body: Record<string, unknown> = {
          business_id,
          focus,
          market,
        };
        if (ad_account_id) body.ad_account_id = ad_account_id;
        if (session_id) body.session_id = session_id;
        if (slot_id) body.slot_id = slot_id;
        const result = await client.post("/architect/generate-video", body);
        return formatResult(
          appendHint(
            result,
            "Video generation dispatched. Call zuckerbot_get_video_ad_status with the job_id every 30 seconds to check completion. Typical time: 5-15 minutes.",
          ),
        );
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── Get Video Ad Status ─────────────────────────────────────────
  server.tool(
    "zuckerbot_get_video_ad_status",
    "Check the status of an async video ad generation job. Returns current status and, when complete, the final video URL. Also surfaces Meta ad review status and rejection reasons if the ad has been submitted to Meta. Poll every 30 seconds until status is 'completed' or 'failed'.",
    {
      job_id: z.string().describe("Internal job ID from zuckerbot_generate_video_ad"),
    },
    async ({ job_id }) => {
      try {
        client.requireAuth();
        const result = await client.get(`/architect/video-status/${encodeURIComponent(job_id)}`);
        const record = (result && typeof result === "object" ? result : {}) as Record<string, unknown>;
        const status = typeof record.status === "string" ? record.status : "unknown";
        let hint: string;
        if (status === "completed") {
          hint = "Video ready. Present the video_url to the customer for approval. After approval, use zuckerbot_create_full_campaign to push it to Meta.";
        } else if (status === "failed" || status === "cancelled") {
          hint = "Video generation failed. Check error_message for details. Retry with zuckerbot_generate_video_ad.";
        } else {
          hint = "Still processing. Poll again in 30 seconds.";
        }
        if (record.meta_review_status === "rejected") {
          hint += ` Meta rejected this ad. Reason: ${typeof record.meta_rejection_reason === "string" ? record.meta_rejection_reason : "unknown"}. Consider revising creative before retrying.`;
        }
        return formatResult(appendHint(result, hint));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── Request Creative (creative-pipeline dispatch) ───────────────
  server.tool(
    "zuckerbot_request_creative",
    "Dispatch a creative production request for an approved intelligence campaign. If a creative-production webhook is configured on the business, ZuckerBot generates full video scripts and fires the production payload. Use this when you want ZuckerBot to handle creative production end-to-end rather than uploading your own assets.",
    {
      campaign_id: z.string().describe("Intelligence campaign ID"),
      creative_handoff: creativeHandoffSchema.describe("Optional creative handoff configuration"),
    },
    async ({ campaign_id, creative_handoff }) => {
      try {
        const body: Record<string, unknown> = {};
        if (creative_handoff) body.creative_handoff = creative_handoff;
        const result = await client.post(`/campaigns/${campaign_id}/request-creative`, body);
        return formatResult(appendHint(result, "Creative request dispatched for planning/review. Monitor progress with zuckerbot_get_creative_status. Multi-tier activation is temporarily disabled; use a legacy campaign draft for a live launch."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── Generate Creatives ──────────────────────────────────────────
  server.tool(
    "zuckerbot_generate_creatives",
    "Generate standalone ad creative variants (images or video) using AI image and video models. Works independently of campaign creation — useful for quick mockups, creative testing, or building assets before attaching them to a campaign. If the description mentions video, reels, UGC, or TikTok, the tool auto-routes to the video model.",
    {
      business_id: z.string().optional()
        .describe("Optional business ID. When provided, brand context (name, tagline, value props, audience) is automatically injected into the generation request for more on-brand results."),
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
        .describe("Model selection. auto/seedream/imagen are image paths, kling is the video path. Optional; inferred from the description when omitted."),
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
    async ({ business_id, business_name, description, count, model, media_type, quality, generate_images }) => {
      try {
        const intentText = `${business_name} ${description}`.toLowerCase();
        const inferredVideoIntent = /\b(video|video ad|reel|short[- ]form|ugc|clip|tiktok)\b/.test(intentText);
        const resolvedModel = model ?? (inferredVideoIntent ? "kling" : "auto");
        const resolvedMediaType = resolvedModel === "kling" || media_type === "video" || inferredVideoIntent
          ? "video"
          : "image";
        const result = await client.post("/creatives/generate", {
          ...(business_id ? { business_id } : {}),
          business_name,
          description,
          count,
          model: resolvedModel,
          media_type: resolvedMediaType,
          quality: quality ?? "fast",
          generate_images: generate_images ?? true,
        });
        return formatResult(appendHint(result, "Creatives generated. To attach them to a campaign, call zuckerbot_upload_creative with the asset URLs. To score them against performance patterns, call zuckerbot_creative_qa."));
      } catch (err) {
        return formatError(err);
      }
    },
  );
}

// ── Register all tools ───────────────────────────────────────────────

export function registerTools(server: McpServer, client: ZuckerBotClient): void {
  // ── 0. Quickstart ───────────────────────────────────────────────
  registerQuickstartTool(server, client);
  registerBillingStatusTool(server, client);

  // ── 0a. Account Audit ───────────────────────────────────────────
  server.tool(
    "zuckerbot_audit_account",
    "Run a full audit of the connected Meta ad account: wasted spend detection, creative fatigue, a complete-account opportunity score (0-100 when all inputs return), and prioritised action items. Saves a shareable web report when the API key resolves to one saved business. Read-only and available on every tier — the recommended FIRST call for any new account or when a user asks 'how are my ads doing?'.",
    {
      meta_ad_account_id: z.string().optional().describe("Meta ad account ID to audit (format: act_XXXXX). Defaults to the connected account."),
      company_name: z.string().optional().describe("Company name used in the audit narrative. Defaults to the connected business name."),
    },
    async ({ meta_ad_account_id, company_name }) => {
      try {
        client.requireAuth();
        // Ask the API to persist when one business is resolvable, but keep the
        // audit itself available when setup/selection is still incomplete.
        // This stays one metered request and one Meta audit in both cases.
        const body: Record<string, unknown> = {
          save_report: true,
          save_report_if_available: true,
        };
        if (meta_ad_account_id) body.meta_ad_account_id = meta_ad_account_id;
        if (company_name) body.company_name = company_name;
        const result = await client.post("/audit", body);
        const record = asRecord(result);
        const audit = asRecord(record?.audit);
        const raw = asRecord(audit?.rawInsights);
        const dataCompleteness = asRecord(raw?.data_completeness);
        // Raw Meta insight rows drown the agent's context; the summarised
        // findings above them carry everything the report presents.
        if (raw && "campaign_rows" in raw) delete (raw as Record<string, unknown>).campaign_rows;
        const reportUrl = typeof record?.report_url === "string" ? `https://zuckerbot.ai${record.report_url}` : null;
        const partialDataHint = raw?.data_truncated === true
          ? " NOTE: Meta returned incomplete data. Check audit.rawInsights.data_completeness and do not present opportunityScore or exact spend/fatigue ratios as complete-account measures."
          : "";
        const scoreHint = typeof audit?.opportunityScore !== "number"
          ? " NOTE: No opportunity score is available for this result. Do not present or infer a numeric account rating."
          : "";
        const currencyHint = dataCompleteness?.account_currency_available === false
          ? " NOTE: Meta did not return the account currency. Describe money as account-currency units; do not label it AUD or invent another currency code."
          : "";
        const reportHint = reportUrl
          ? ` A shareable web report was saved — give the user this link: ${reportUrl}`
          : " No shareable report was saved because this API key does not resolve to one saved business.";
        return formatResult(
          appendHint(
            result,
            `Audit complete.${reportHint}${partialDataHint}${scoreHint}${currencyHint} Present complete observed findings and audit.rawInsights.action_items to the user, then act on them: zuckerbot_get_performance to drill into a specific campaign, zuckerbot_pause_campaign to stop wasted spend, or zuckerbot_creative_analysis to diagnose fatigued creatives.`,
          ),
        );
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 0b. Redeem Lifetime Licence ─────────────────────────────────
  server.tool(
    "zuckerbot_redeem_license",
    "Redeem a ZuckerBot lifetime licence code (format ZB-XXXXX-XXXXX-XXXXX) purchased on Dealify or AppSumo. Each code activates the plan it was purchased for: Tier 1 (1 ad account, 2,500 calls/mo), Tier 2 (3 accounts, 10K calls/mo) or Tier 3 (10 accounts, 30K calls/mo). Codes also stack additively on one account up to Tier 3 — e.g. two Tier 1 codes = Tier 2. Redeeming upgrades ALL of the account's API keys to the new tier immediately.",
    {
      code: z.string().describe("Lifetime licence code in the format ZB-XXXXX-XXXXX-XXXXX"),
    },
    async ({ code }) => {
      try {
        client.requireAuth();
        const result = await client.post("/ltd/redeem", { code });
        const record = asRecord(result);
        const mintedKey = asRecord(record?.api_key);
        const hint = mintedKey
          ? "IMPORTANT: a new API key was minted during redemption. Show the full api_key.key value to the user IMMEDIATELY and tell them to store it securely — it will NEVER be shown again. Then follow the next_steps in the response."
          : "Licence redeemed — all of this account's API keys are upgraded to the new tier. If the tier is below Lifetime Tier 3, stacking another code raises it. Run zuckerbot_audit_account to put the new limits to work.";
        return formatResult(appendHint(result, hint));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 0c. Creative generation (env-gated) ─────────────────────────
  if (creativeGenerationToolsEnabled()) {
    registerCreativeGenerationTools(server, client);
  }

  // ── 1. Analyse Account History ─────────────────────────────────
  server.tool(
    "zuckerbot_analyse_account_history",
    "Analyse the historical ad performance for a business. For accounts WITH history: returns aggregated metrics by audience type, top performing creatives, and comparable CPL ranges. For NEW accounts with NO history: returns is_cold_start=true with industry benchmarks. Use this as the FIRST step in campaign planning — feed the result into zuckerbot_recommend_campaign_structure.",
    {
      business_id: z.string().optional().describe("Business ID (auto-resolved from API key if omitted)"),
      lookback_days: z
        .number()
        .int()
        .min(7)
        .max(365)
        .default(90)
        .describe("Number of days of history to analyse (default: 90)"),
      include_audience_history: z
        .boolean()
        .default(true)
        .describe("Include analysis of which audiences have been targeted before"),
      target_audience: z
        .string()
        .optional()
        .describe("Optional audience keyword to check if it has been targeted before (e.g., 'pool builders')"),
    },
    async ({ business_id, lookback_days, include_audience_history, target_audience }) => {
      try {
        client.requireAuth();
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const body: Record<string, unknown> = {
          business_id: resolvedBusinessId,
          lookback_days,
          include_audience_history,
        };
        if (target_audience) body.target_audience = target_audience;
        const result = await client.post("/architect/analyse-history", body);
        const record = asRecord(result);
        const isColdStart = record?.is_cold_start === true;
        const hint = isColdStart
          ? "No campaign history found (cold start). Industry benchmarks are included. Call zuckerbot_recommend_campaign_structure — it will use conservative defaults based on objective + budget + industry."
          : "History analysis complete. Call zuckerbot_recommend_campaign_structure with this business_id and your target audience to get an AI-generated campaign plan.";
        return formatResult(appendHint(result, hint));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 2. Recommend Campaign Structure ─────────────────────────────
  server.tool(
    "zuckerbot_recommend_campaign_structure",
    "Generate a campaign structure recommendation: audience tiers, budget allocation, creative mix. For accounts WITH history: uses Claude to generate data-driven recommendations. For NEW accounts (cold start): generates conservative defaults from industry benchmarks + safe 2-tier structure (broad 60% / interest 40%). Always returns comparable_historical_cpl with source (account_history or industry_benchmarks) and a disclaimer — NEVER a CPL projection. Lead campaigns default to Meta Instant Form; for leads driving to a website landing page rather than Meta Instant Form, set lead_destination='website'. Present the recommendation to the customer for approval before proceeding.",
    {
      business_id: z.string().optional().describe("Business ID (auto-resolved from API key if omitted)"),
      objective: z
        .enum(["leads", "sales", "traffic", "awareness", "engagement"])
        .optional()
        .describe("Campaign objective. If omitted, defaults to 'leads' for most SMB use cases. Leads default to Meta Instant Form unless lead_destination is 'website'."),
      lead_destination: z
        .enum(["meta_form", "website"])
        .optional()
        .describe("For objective='leads': 'meta_form' uses a Meta Instant Form (default), 'website' optimizes for the Pixel Lead event on a landing page."),
      destination_url: z
        .string()
        .optional()
        .describe("Optional landing-page URL for this campaign. Required/recommended for lead_destination='website'; overrides the business website for ad links."),
      target_audience: z
        .string()
        .describe("Target audience description (e.g., 'pool builders in Texas', 'plumbers in Brisbane')"),
      daily_budget_aud: z
        .number()
        .min(5)
        .optional()
        .describe("Daily budget in AUD. If omitted, defaults to $50/day."),
      history_digest: z
        .string()
        .optional()
        .describe("Optional JSON string of a prior zuckerbot_analyse_account_history result. If omitted, history is pulled automatically."),
      constraints: z
        .object({
          exclude_audiences: z.array(z.string()).optional(),
          force_objective: z.enum(["leads", "sales", "traffic", "awareness", "engagement"]).optional(),
          max_tiers: z.number().int().min(1).max(6).optional(),
          prefer_video: z.boolean().optional(),
          prefer_static: z.boolean().optional(),
        })
        .optional()
        .describe("Optional constraints on the recommendation"),
    },
    async ({ business_id, objective, lead_destination, destination_url, target_audience, daily_budget_aud, history_digest, constraints }) => {
      try {
        client.requireAuth();
        const resolvedBusinessId = business_id ? await client.resolveBusinessId(business_id) : undefined;
        const body: Record<string, unknown> = { target_audience };
        if (resolvedBusinessId) body.business_id = resolvedBusinessId;
        if (objective) body.objective = objective;
        if (lead_destination) body.lead_destination = lead_destination;
        if (destination_url) body.destination_url = destination_url;
        if (daily_budget_aud !== undefined) body.daily_budget_aud = daily_budget_aud;
        if (history_digest) body.history_digest = history_digest;
        if (constraints) body.constraints = constraints;

        const result = await client.post("/architect/recommend-structure", body);
        const record = (result && typeof result === "object" ? result : {}) as Record<string, unknown>;
        const isColdStart = record.is_cold_start === true;

        const hint = isColdStart
          ? "Cold-start recommendation generated. Present the 2-tier structure (broad + interest) and creative mix to the customer. Emphasise that CPL range is an industry benchmark — NOT a prediction. Once approved, call zuckerbot_generate_campaign_brief with the session_id."
          : "Data-driven recommendation generated. Present audience tiers, budget allocation, and creative mix to the customer for review. comparable_historical_cpl is based on this account's history with a disclaimer — it is NOT a commitment. Once approved, call zuckerbot_generate_campaign_brief with the session_id.";

        return formatResult(appendHint(result, hint));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 3. Generate Campaign Brief ─────────────────────────────────
  server.tool(
    "zuckerbot_generate_campaign_brief",
    "Generate a detailed creative brief from an approved campaign structure. SAFE — pure function, no Meta API calls, no money spent. Automatically pulls brand context and historical creative patterns (or uses brand context alone for cold-start accounts). Returns per-slot creative directions: for static ads, specific ad template + headline/body/CTA + hero image prompt; for video ads, hook concept + voiceover direction + visual style. After brief is generated, present it to the customer, then call zuckerbot_generate_static_ad / zuckerbot_generate_video_ad for each slot.",
    {
      business_id: z.string().optional().describe("Business ID (auto-resolved from API key if omitted)"),
      session_id: z.string().optional().describe("Architect session ID from zuckerbot_recommend_campaign_structure"),
      approved_structure: z.string().optional().describe("JSON string of approved campaign structure (if no session_id)"),
      additional_creative_direction: z.string().optional().describe("Optional extra direction from the customer (e.g., 'lean into fear of missing calls')"),
    },
    async ({ business_id, session_id, approved_structure, additional_creative_direction }) => {
      try {
        client.requireAuth();
        const body: Record<string, unknown> = {};
        if (business_id) body.business_id = await client.resolveBusinessId(business_id);
        if (session_id) body.session_id = session_id;
        if (approved_structure) body.approved_structure = approved_structure;
        if (additional_creative_direction) body.additional_creative_direction = additional_creative_direction;

        const result = await client.post("/architect/generate-brief", body);
        return formatResult(
          appendHint(
            result,
            "Creative brief generated with per-slot directions. Use zuckerbot_generate_static_ad for each static slot (passing the slot's compositor_params) and zuckerbot_generate_video_ad for each video slot (passing the slot's focus and video_direction). Present all generated creatives to the customer — they approve/reject in the conversation (e.g., 'push 1 and 3').",
          ),
        );
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 7. Create Full Campaign ─────────────────────────────────────
  server.tool(
    "zuckerbot_create_full_campaign",
    "Build a complete PAUSED Meta campaign from an approved Campaign Architect session. IMPORTANT: dry_run defaults to TRUE. When dry_run=true, returns the exact campaign structure that WOULD be created without calling Meta — safe, free, no side effects. Present this to the customer first. Only set dry_run=false after explicit customer approval. When dry_run=false, creates Meta objects in PAUSED state for review; Architect auto-activation is temporarily disabled. Generated videos get linked for rejection tracking automatically.",
    {
      session_id: z.string().describe("Campaign Architect session ID with approved strategy and creatives"),
      dry_run: z.boolean().default(true)
        .describe("DEFAULT TRUE. Set to false ONLY after customer has approved the dry-run preview. Live mode creates real Meta objects."),
      meta_access_token: z.string().optional().describe("Meta access token override (live mode only)"),
      meta_ad_account_id: z.string().optional().describe("Meta ad account ID override (live mode only)"),
      meta_page_id: z.string().optional().describe("Facebook Page ID override (live mode only)"),
      activate: z.literal(false).default(false)
        .describe("Must remain false. Architect auto-activation is temporarily disabled; live mode creates PAUSED Meta objects only."),
    },
    async ({ session_id, dry_run, meta_access_token, meta_ad_account_id, meta_page_id, activate }) => {
      try {
        client.requireAuth();
        const body: Record<string, unknown> = { session_id, dry_run, activate };
        if (meta_access_token) body.meta_access_token = meta_access_token;
        if (meta_ad_account_id) body.meta_ad_account_id = meta_ad_account_id;
        if (meta_page_id) body.meta_page_id = meta_page_id;

        const result = await client.post("/architect/create-campaign", body);
        const record = (result && typeof result === 'object' ? result : {}) as Record<string, unknown>;
        const isDryRun = record.dry_run === true;

        const hint = isDryRun
          ? "DRY RUN — no Meta objects were created. Present the would_create structure to the customer. If they approve, call again with dry_run=false to create live Meta objects."
          : "Campaign built in PAUSED state on Meta for review. Architect auto-activation and campaign resume are temporarily disabled; use a reviewed legacy draft with zuckerbot_launch_campaign for the supported live path. Videos linked for rejection tracking.";

        return formatResult(appendHint(result, hint));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 8. Preview Campaign ─────────────────────────────────────────
  server.tool(
    "zuckerbot_preview_campaign",
    "Generate a zero-cost campaign preview from any business URL. Scrapes the site, writes AI-generated headlines and body copy, and generates ad images — all without a Meta account or live budget. Use this as the first step to show a user what their ads could look like before committing to a full campaign.",
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
        return formatResult(appendHint(result, "Preview generated. Call zuckerbot_create_campaign with the same URL; it defaults to the reviewed legacy draft path that can be launched safely."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 7. Create Campaign ──────────────────────────────────────────
  server.tool(
    "zuckerbot_create_campaign",
    "Create a new campaign draft for a business. Defaults to legacy mode, the only launch-ready path during Dealify hardening. Intelligence mode remains available for planning only and cannot be activated. This tool does not spend money or create anything on Meta; review the draft, then use zuckerbot_launch_campaign.",
    {
      url: z.string().describe("Business website URL"),
      business_id: z.string().optional().describe("Existing ZuckerBot business ID to anchor intelligence mode"),
      architect_session_id: z.string().optional()
        .describe("Optional Campaign Architect session ID. When provided, the intelligence strategy is loaded from the session instead of generating fresh."),
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
        .default("legacy")
        .describe("Campaign planning mode. Default legacy is the only launch-ready path. auto/intelligence are planning-only while multi-tier activation is disabled."),
      objective: z
        .enum(["leads", "traffic", "conversions", "awareness"])
        .optional()
        .describe("Campaign objective. 'leads' defaults to Meta Instant Form unless lead_destination is 'website', 'traffic' for website visits, 'conversions' for website actions, 'awareness' for reach. Default: traffic"),
      lead_destination: z
        .enum(["meta_form", "website"])
        .optional()
        .describe("For objective='leads': 'meta_form' uses a Meta Instant Form (default), 'website' uses a Meta Pixel Lead event and links ads to destination_url."),
      destination_url: z
        .string()
        .optional()
        .describe("Optional landing-page URL override for ad links, e.g. a campaign-specific LP instead of the business homepage."),
      goals: goalsSchema.describe("Optional business goals to guide planning"),
      creative_handoff: creativeHandoffSchema.describe("Optional creative-production handoff settings"),
    },
    async ({ url, business_id, architect_session_id, business_name, business_type, location, budget_daily_cents, mode, objective, lead_destination, destination_url, goals, creative_handoff }) => {
      try {
        const body: Record<string, unknown> = { url };
        if (business_id) body.business_id = business_id;
        if (architect_session_id) body.architect_session_id = architect_session_id;
        if (business_name) body.business_name = business_name;
        if (business_type) body.business_type = business_type;
        if (location) body.location = location;
        if (budget_daily_cents !== undefined) body.budget_daily_cents = budget_daily_cents;
        body.mode = mode ?? "legacy";
        if (objective) body.objective = objective;
        if (lead_destination) body.lead_destination = lead_destination;
        if (destination_url) body.destination_url = destination_url;
        if (goals) body.goals = goals;
        if (creative_handoff) body.creative_handoff = creative_handoff;

        const result = await client.post("/campaigns/create", body);
        return formatResult(appendHint(result, mode === "legacy"
          ? "Launch-ready legacy draft created. Review it, confirm Meta credentials and budget, then call zuckerbot_launch_campaign."
          : "Planning-only intelligence draft created. Multi-tier activation is temporarily disabled; create a legacy-mode draft when the user is ready to launch."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_enrich_business",
    "Crawl a business website and extract structured intelligence used by campaign planning: company description, services, pricing signals, testimonials, location data, and brand tone. Run this before creating a campaign when the business has not been enriched yet, or use force_refresh after a website update to refresh stale context.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
      url: z.string().optional().describe("Optional website URL override. Uses the stored business website when omitted."),
      force_refresh: z.boolean().optional().describe("Re-scrape even when cached context exists"),
    },
    async ({ business_id, url, force_refresh }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const body: Record<string, unknown> = {};
        if (url) body.url = url;
        if (force_refresh !== undefined) body.force_refresh = force_refresh;
        const result = await client.post(`/businesses/${resolvedBusinessId}/enrich`, body);
        return formatResult(appendHint(result, "Business enriched. Call zuckerbot_create_campaign with the business_id to build a context-aware intelligence campaign."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_upload_business_context",
    "Upload a text document (ad performance data, brand guidelines, customer data, sales data, or competitor analysis) so ZuckerBot can extract structured planning insights from it. Accepts raw text content — not binary files. Use this when the business has existing performance data or brand docs that should inform campaign strategy.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
      filename: z.string().describe("Name of the file or document"),
      content: z.string().describe("File content as text"),
      context_type: businessContextTypeSchema.describe("Optional hint about the type of uploaded context"),
    },
    async ({ business_id, filename, content, context_type }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const body: Record<string, unknown> = {
          filename,
          content,
        };
        if (context_type) body.context_type = context_type;
        const result = await client.post(`/businesses/${resolvedBusinessId}/uploads`, body);
        return formatResult(appendHint(result, "Context uploaded and extracted. Call zuckerbot_list_business_context to see all uploaded files, or zuckerbot_create_campaign to use this context in planning."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_list_business_context",
    "List all uploaded business-context files for a business along with their extracted summaries. Use this to confirm what planning documents are loaded before creating a campaign, or to check whether a previous upload was processed successfully.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
    },
    async ({ business_id }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const result = await client.get(`/businesses/${resolvedBusinessId}/uploads`);
        return formatResult(appendHint(result, "Use zuckerbot_upload_business_context to add more context, or zuckerbot_create_campaign to build a strategy using all available context."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_get_campaign",
    "Fetch the full details of a ZuckerBot campaign by ID: intelligence workflow state, approved strategy, stored creatives, audience tier executions, and performance status. Use this to inspect a campaign at any stage of the lifecycle.",
    {
      campaign_id: z.string().describe("ZuckerBot campaign ID"),
    },
    async ({ campaign_id }) => {
      try {
        const result = await client.get(`/campaigns/${campaign_id}`);
        return formatResult(appendHint(result, "Inspect creative_status and workflow state. Legacy campaigns can launch directly after review. Intelligence campaigns are planning-only while multi-tier activation is disabled."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_approve_campaign_strategy",
    "Approve the AI-generated intelligence strategy for a campaign, optionally narrowing to specific audience tiers and creative angles. This locks in the plan before creative production starts. Required before calling zuckerbot_request_creative or zuckerbot_upload_creative.",
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
        return formatResult(appendHint(result, "Strategy approved. Upload your creative assets with zuckerbot_upload_creative, or use the Campaign Architect flow: analyse_account_history → recommend_campaign_structure → generate_campaign_brief."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_upload_creative",
    "Upload finished creative assets (images or videos) to an approved intelligence campaign. ZuckerBot queues the Meta upload and ad-creation jobs asynchronously, then polls until they complete or the polling window expires. Use this when you have your own creative assets ready.",
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
        const payload = asRecord(result);
        const creativeStatus = typeof payload?.creative_status === "string" ? payload.creative_status : null;
        const queuedJobs = Array.isArray(payload?.queued_jobs) ? payload.queued_jobs : [];

        if (creativeStatus !== "uploading" || queuedJobs.length === 0) {
          return formatResult(appendHint(result, "Creatives uploaded. Call zuckerbot_get_creative_status to check processing status. Intelligence activation is temporarily disabled; use a reviewed legacy draft for live launch."));
        }

        try {
          const polled = await pollCreativeStatus(client, campaign_id);
          if (polled.completed) {
            return formatResult(appendHint({
              initial_response: payload,
              creative_status: "ready_to_activate",
              polling: {
                completed: true,
                attempts: polled.attempts,
                interval_seconds: CREATIVE_STATUS_POLL_INTERVAL_MS / 1000,
              },
              final_status: polled.lastStatus,
            }, "All creatives uploaded and processed for review. Intelligence activation is temporarily disabled; use a reviewed legacy draft for live launch."));
          }

          return formatResult(appendHint({
            initial_response: payload,
            creative_status: "uploading",
            message: "Uploads queued and still processing.",
            polling: {
              completed: false,
              attempts: polled.attempts,
              interval_seconds: CREATIVE_STATUS_POLL_INTERVAL_MS / 1000,
              suggested_tool: "zuckerbot_get_creative_status",
            },
            last_status: polled.lastStatus,
          }, "Uploads still processing. Call zuckerbot_get_creative_status in 15–30 seconds to check progress. Completed intelligence creatives remain review-only while activation is disabled."));
        } catch (pollError) {
          return formatResult(appendHint({
            initial_response: payload,
            creative_status: "uploading",
            message: "Uploads queued, but polling creative-status failed after the initial queue request.",
            polling_error: pollError instanceof Error ? pollError.message : String(pollError),
            suggested_tool: "zuckerbot_get_creative_status",
          }, "Polling failed but uploads were queued. Call zuckerbot_get_creative_status manually to check progress."));
        }
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_get_creative_status",
    "Check the asynchronous upload queue for an intelligence campaign to see if Meta ad-creation jobs are complete. Poll this after zuckerbot_upload_creative when the initial response shows creative_status='uploading'. Returns all_complete=true when every queued job has finished for review; intelligence activation is temporarily disabled.",
    {
      campaign_id: z.string().describe("Intelligence campaign ID"),
    },
    async ({ campaign_id }) => {
      try {
        const result = await client.get(`/campaigns/${campaign_id}/creative-status`);
        return formatResult(appendHint(result, "If still uploading, poll again in 15–30 seconds. Completed intelligence creatives remain available for review, but multi-tier activation is temporarily disabled; use a legacy draft for live launch."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_activate_campaign",
    "Temporarily unavailable during Dealify launch hardening. Intelligence campaigns are planning-only; create a legacy-mode draft and use zuckerbot_launch_campaign for the supported live path.",
    {
      campaign_id: z.string().describe("Intelligence campaign ID"),
      tier_names: z.array(z.string()).optional().describe("Optional subset of approved tiers to activate"),
      meta_access_token: z.string().optional().describe("Optional Meta/Facebook access token override"),
      meta_ad_account_id: z.string().optional().describe("Optional Meta ad account ID override (format: act_XXXXX)"),
      meta_page_id: z.string().optional().describe("Optional Facebook Page ID override"),
    },
    async ({ campaign_id, tier_names, meta_access_token, meta_ad_account_id, meta_page_id }) => {
      void tier_names;
      void meta_access_token;
      void meta_ad_account_id;
      void meta_page_id;
      return formatResult({
        error: true,
        code: "intelligence_activation_temporarily_disabled",
        message: "Multi-tier activation is temporarily disabled. Create a campaign with mode='legacy', review it, then call zuckerbot_launch_campaign.",
        campaign_id,
        supported_create_mode: "legacy",
        supported_launch_tool: "zuckerbot_launch_campaign",
      });
    },
  );

  server.tool(
    "zuckerbot_suggest_angles",
    "Return only the creative angles and audience tiers for a campaign draft — a lightweight alternative to zuckerbot_get_campaign when you need just the strategy summary without the full campaign payload, stored creatives, or tier execution details.",
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

        return formatResult(appendHint({
          campaign_id,
          campaign_version: campaign.campaign_version ?? null,
          creative_status: campaign.creative_status ?? null,
          strategy_summary: strategy.strategy_summary ?? null,
          audience_tiers: audienceTiers,
          creative_angles: creativeAngles,
        }, "Review the angles and tiers. Call zuckerbot_approve_campaign_strategy with specific tier_names and angle_names to narrow the plan before production."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 3. Launch Campaign ──────────────────────────────────────────
  server.tool(
    "zuckerbot_launch_campaign",
    "Launch a draft campaign on Meta (Facebook/Instagram). THIS IS THE MONEY ENDPOINT — it creates real ads on the user's Meta ad account and immediately begins spending their budget. Stored Meta credentials are auto-resolved when available. Set launch_all_variants=true to launch every creative variant as separate ads for A/B testing (Meta auto-optimizes for the winner). Always confirm the user has budget available and Meta is connected (zuckerbot_meta_status) before calling.",
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
        return formatResult(appendHint(result, "Campaign launched. Call zuckerbot_get_performance to monitor spend and leads. Use zuckerbot_pause_campaign to stop delivery, or zuckerbot_sync_conversion to send lead quality feedback to Meta."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 4. Pause Campaign ──────────────────────────────────────────
  server.tool(
    "zuckerbot_pause_campaign",
    "Pause a running Meta ad campaign. Pausing stops ad delivery and spend immediately while leaving the campaign in Meta. Use this when creative needs refreshing, budget is exhausted, entitlement is withdrawn, or the user asks to stop spending. Resume is temporarily disabled during Dealify launch hardening.",
    {
      campaign_id: z.string().describe("ZuckerBot campaign ID"),
      action: z
        .literal("pause")
        .default("pause")
        .describe("Pause the campaign"),
    },
    async ({ campaign_id, action }) => {
      try {
        const result = await client.post(`/campaigns/${campaign_id}/pause`, {
          action,
        });
        return formatResult(appendHint(result, "Campaign paused. Call zuckerbot_get_performance to confirm delivery has stopped, or zuckerbot_get_campaign to inspect the full workflow state."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 5. Get Performance ──────────────────────────────────────────
  server.tool(
    "zuckerbot_get_performance",
    "Fetch real-time performance metrics for a ZuckerBot campaign. Legacy campaigns return a flat metrics summary (impressions, clicks, leads, spend, CPL, CTR). Intelligence campaigns additionally return tier-by-tier and ad-by-ad Meta insights, daily breakdowns, CAPI attribution totals, and AI-recommended next actions. Use this to monitor an active campaign or to diagnose underperformance.",
    {
      campaign_id: z.string().describe("ZuckerBot campaign ID"),
    },
    async ({ campaign_id }) => {
      try {
        const result = await client.get(`/campaigns/${campaign_id}/performance`);
        return formatResult(appendHint(result, "For creative-level analysis, call zuckerbot_creative_analysis to see which hooks/styles are performing best. For historical trends, use zuckerbot_get_campaign_insights. If CPL is high, use zuckerbot_sync_conversion to signal lead quality to Meta."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_creative_analysis",
    "Analyse creative performance patterns for a business by grouping ads by hook type, visual style, product focus, setting, CTA type, copy tone, or opening element. Returns average CPL/CTR/CPC/frequency per group, per-group trend direction, a structured insight object with recommendations, and can optionally include the top and bottom individual ads for the selected metric. Use this before generating new briefs to inform the creative strategy.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
      group_by: z.enum(["hook_type", "visual_style", "product_focus", "setting", "cta_type", "copy_tone", "opening_element"]).describe("Creative attribute to group by"),
      metric: z.enum(["cpl", "ctr", "cpc", "frequency"]).optional().describe("Metric to rank by. Defaults to cpl."),
      date_from: z.string().optional().describe("Optional start date in YYYY-MM-DD"),
      date_to: z.string().optional().describe("Optional end date in YYYY-MM-DD"),
      min_spend: z.number().optional().describe("Optional minimum spend threshold per ad"),
      min_impressions: z.number().int().optional().describe("Optional minimum impression threshold per ad"),
      include_ads: z.boolean().optional().describe("When true, include the top 5 and bottom 5 ads by the selected metric."),
      summary_mode: z.boolean().optional()
        .describe("When true, returns a condensed narrative summary optimised for feeding into recommend_campaign_structure. Default: false."),
    },
    async ({ business_id, group_by, metric, date_from, date_to, min_spend, min_impressions, include_ads, summary_mode }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const params = new URLSearchParams({ business_id: resolvedBusinessId, group_by });
        if (metric) params.set("metric", metric);
        if (date_from) params.set("date_from", date_from);
        if (date_to) params.set("date_to", date_to);
        if (min_spend !== undefined) params.set("min_spend", String(min_spend));
        if (min_impressions !== undefined) params.set("min_impressions", String(min_impressions));
        if (include_ads) params.set("include_ads", "true");
        if (summary_mode) params.set("summary_mode", "true");
        const result = await client.get(`/creative/analysis?${params.toString()}`);
        return formatResult(appendHint(result, "Analysis complete. Call zuckerbot_creative_cross_analysis to find winning attribute combinations, rerun with include_ads=true to inspect the best and worst individual ads, or use zuckerbot_generate_briefs to produce new creative briefs weighted toward the strongest patterns. Feed these insights into zuckerbot_recommend_campaign_structure for data-driven campaign planning."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_creative_cross_analysis",
    "Cross two creative dimensions to find winning combinations. Example: hook_type × visual_style can reveal that curiosity + ugc outperforms pain_point + stock. Returns a performance matrix, best and worst combinations, and an actionable insight string.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
      group_by: z.enum(["hook_type", "visual_style", "product_focus", "setting", "cta_type", "copy_tone", "opening_element"]).describe("Primary dimension"),
      cross_by: z.enum(["hook_type", "visual_style", "product_focus", "setting", "cta_type", "copy_tone", "opening_element"]).describe("Secondary dimension to cross with"),
      metric: z.enum(["cpl", "ctr", "cpc", "frequency"]).optional().describe("Metric to rank by. Defaults to cpl."),
      date_from: z.string().optional().describe("Optional start date in YYYY-MM-DD"),
      date_to: z.string().optional().describe("Optional end date in YYYY-MM-DD"),
      min_spend: z.number().optional().describe("Optional minimum spend threshold per ad"),
    },
    async ({ business_id, group_by, cross_by, metric, date_from, date_to, min_spend }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const params = new URLSearchParams({
          business_id: resolvedBusinessId,
          group_by,
          cross_by,
        });
        if (metric) params.set("metric", metric);
        if (date_from) params.set("date_from", date_from);
        if (date_to) params.set("date_to", date_to);
        if (min_spend !== undefined) params.set("min_spend", String(min_spend));
        const result = await client.get(`/creative/analysis/cross?${params.toString()}`);
        const bestCombination =
          result && typeof result === "object"
            ? (result as { best_combination?: { group?: string; cross?: string } }).best_combination
            : undefined;
        const bestGroup = bestCombination?.group;
        const bestCross = bestCombination?.cross;
        const hint = bestGroup && bestCross
          ? `Best combination: ${bestGroup} × ${bestCross}. Use zuckerbot_generate_briefs to create briefs targeting this combination.`
          : "Cross-analysis complete. Use zuckerbot_generate_briefs to create briefs targeting the best-performing combination.";
        return formatResult(appendHint(result, hint));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_generate_briefs",
    "Generate creative production briefs based on the business's tagged ad-performance patterns. Each brief specifies hook type, visual style, copy tone, CTA, and script guidance weighted toward the top-performing creative attributes. Use after running zuckerbot_creative_analysis to know which patterns to bias toward.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
      count: z.number().int().min(1).max(10).optional().describe("How many briefs to generate. Defaults to 5."),
      bias: z.string().optional().describe("Optional generation bias, for example performance or exploration"),
      exclude_angles: z.array(z.string()).optional().describe("Optional angles or product focuses to avoid"),
      target_market: z.string().optional().describe("Optional target market override, for example AU or US"),
      font_preset: z.string().optional().describe("Optional font preset override"),
      metric: z.enum(["cpl", "ctr", "cpc", "frequency"]).optional().describe("Optional ranking metric. Defaults to cpl."),
    },
    async ({ business_id, count, bias, exclude_angles, target_market, font_preset, metric }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const body: Record<string, unknown> = { business_id: resolvedBusinessId };
        if (count !== undefined) body.count = count;
        if (bias) body.bias = bias;
        if (exclude_angles?.length) body.exclude_angles = exclude_angles;
        if (target_market) body.target_market = target_market;
        if (font_preset) body.font_preset = font_preset;
        if (metric) body.metric = metric;
        const result = await client.post("/creative/generate-briefs", body);
        return formatResult(appendHint(result, "Briefs generated. Pass them to your creative team for production. Once assets are ready, use zuckerbot_upload_creative to attach them to a campaign. For automated brief generation tied to a campaign plan, use zuckerbot_generate_campaign_brief."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_creative_qa",
    "Score proposed creative variants against the business's historical top-performing patterns. Accepts raw creative specs (copy, headline, CTA, asset URLs, frame URLs for video) and returns a pattern-match score for each. Use this before producing expensive creative assets to pre-validate concepts against what has historically worked.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
      creatives: z.array(
        z.object({
          creative_type: z.enum(["video", "image", "carousel", "static"]).describe("Creative type"),
          thumbnail_url: z.string().optional().describe("Optional thumbnail URL"),
          video_url: z.string().optional().describe("Optional video URL"),
          asset_url: z.string().optional().describe("Optional primary asset URL"),
          ad_copy: z.string().optional().describe("Optional ad body copy"),
          headline: z.string().optional().describe("Optional headline"),
          cta_text: z.string().optional().describe("Optional CTA text"),
          frame_urls: z.array(z.string()).optional().describe("Optional sampled frame URLs for video analysis"),
        }),
      ).min(1).describe("Creative variants to score"),
    },
    async ({ business_id, creatives }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const result = await client.post("/creative/qa", {
          business_id: resolvedBusinessId,
          creatives,
        });
        return formatResult(appendHint(result, "QA complete. High-scoring creatives are ready for production. Low-scoring ones need rework — use the pattern analysis to understand why they don't match. Call zuckerbot_upload_creative to attach approved assets to a campaign."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_create_seed_audience",
    "Build a Meta custom audience from hashed CAPI user data stored for a business, filtered by CRM lifecycle stage (e.g., 'lead', 'customer'). Use this as the first step to create retargeting or reactivation audiences from your own first-party CRM data.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
      source_stage: z.string().describe("CRM lifecycle or source stage to seed from"),
      name: z.string().optional().describe("Optional audience name override"),
      lookback_days: z.number().int().optional().describe("How many days of CAPI events to include"),
      min_contacts: z.number().int().optional().describe("Minimum matched contacts required before creation"),
    },
    async ({ business_id, source_stage, name, lookback_days, min_contacts }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const body: Record<string, unknown> = { source_stage };
        body.business_id = resolvedBusinessId;
        if (name) body.name = name;
        if (lookback_days !== undefined) body.lookback_days = lookback_days;
        if (min_contacts !== undefined) body.min_contacts = min_contacts;
        const result = await client.post("/audiences/create-seed", body);
        return formatResult(appendHint(result, "Seed audience created. Call zuckerbot_create_lookalike_audience with the returned seed_audience_id to expand it into a 1–5% lookalike prospecting audience."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_create_lookalike_audience",
    "Create a Meta lookalike audience from a stored seed audience. Expands a first-party seed (e.g., 'customer' stage) into a 1%, 3%, or 5% prospecting audience that Meta will target based on similarity. Typically used for the prospecting tier of an intelligence campaign.",
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
        return formatResult(appendHint(result, "Lookalike audience created. Call zuckerbot_list_audiences to confirm delivery status, or zuckerbot_get_audience_status to check size and readiness before using it in a campaign launch."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_list_audiences",
    "List all stored Meta audiences for a business: seed audiences, lookalike audiences, sizes, delivery statuses, and CAPI source details. Use this to see what audiences are available before launching a campaign, or to find audience IDs for refresh and delete operations.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
    },
    async ({ business_id }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const params = new URLSearchParams({ business_id: resolvedBusinessId });
        const result = await client.get(`/audiences/list${params.toString() ? `?${params.toString()}` : ""}`);
        return formatResult(appendHint(result, "Use zuckerbot_create_lookalike_audience to create a LAL from any seed audience listed here. Use zuckerbot_refresh_audience to rebuild a seed from the latest CAPI events."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_refresh_audience",
    "Rebuild a stored audience from fresh data. For seed audiences: re-hashes the latest CAPI events for the source CRM stage. For lookalike audiences: syncs the current size and delivery status from Meta after the seed refreshes. Use this when CAPI has received new events since the audience was last built.",
    {
      audience_id: z.string().describe("Stored audience row ID"),
    },
    async ({ audience_id }) => {
      try {
        const result = await client.post("/audiences/refresh", { audience_id });
        return formatResult(appendHint(result, "Audience refreshed. Call zuckerbot_get_audience_status to check updated size and delivery readiness."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_get_audience_status",
    "Fetch the current Meta delivery status, size, and readiness for a stored audience. Updates the local audience registry row. Use this to check if an audience is large enough to use in a campaign before launch.",
    {
      audience_id: z.string().describe("Stored audience row ID"),
    },
    async ({ audience_id }) => {
      try {
        const result = await client.get(`/audiences/${audience_id}/status`);
        return formatResult(appendHint(result, "If the audience is ready (delivery_status: READY) and has sufficient size, it can be used in a campaign launch. If size is low, call zuckerbot_refresh_audience to rebuild from fresh CAPI data."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_delete_audience",
    "Permanently delete a stored audience from both Meta and ZuckerBot's local registry. This cannot be undone. Use when an audience is stale, was created in error, or you need to free up Meta audience slots.",
    {
      audience_id: z.string().describe("Stored audience row ID"),
    },
    async ({ audience_id }) => {
      try {
        const result = await client.delete(`/audiences/${audience_id}`);
        return formatResult(appendHint(result, "Audience deleted. Call zuckerbot_list_audiences to confirm removal."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 6. Get Account Insights ───────────────────────────────────
  server.tool(
    "zuckerbot_get_account_insights",
    "Fetch historical Meta ad account performance for a connected business over a date range. Returns spend, clicks, impressions, CTR, CPM, CPC, and frequency aggregated daily or monthly. Useful for top-level budget reporting and month-over-month trend analysis without opening Ads Manager.",
    {
      business_id: z.string().optional().describe("Optional business ID override linked to the connected Meta ad account"),
      date_from: z.string().describe("Start date in YYYY-MM-DD format"),
      date_to: z.string().describe("End date in YYYY-MM-DD format"),
      time_increment: z
        .enum(["daily", "monthly"])
        .default("monthly")
        .describe("Whether to break the results down daily or monthly"),
    },
    async ({ business_id, date_from, date_to, time_increment }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const params = new URLSearchParams({
          business_id: resolvedBusinessId,
          date_from,
          date_to,
          time_increment,
        });
        const result = await client.get(`/ad-account/insights?${params.toString()}`);
        return formatResult(appendHint(result, "For campaign-level breakdown, use zuckerbot_get_campaign_insights with the same date range. For creative-level patterns, use zuckerbot_creative_analysis."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  server.tool(
    "zuckerbot_get_campaign_insights",
    "Query campaign, ad set, or ad-level performance for any campaign in the connected Meta ad account — including campaigns not created by ZuckerBot. Tags each row with is_zuckerbot so you can benchmark ZuckerBot campaigns against manually managed ones. Supports date range filtering, campaign name search, status filters, time-series breakdowns, and multi-column sorting. For deduped truth use meta_result / cost_per_meta_result (Meta's Ads Manager \"Results\" for any objective) or conversion_leads / meta_leads — not the inflated, deprecated leads / cpl. meta_result and conversion_leads are most reliable on campaign-level, non-time-incremented queries.",
    {
      business_id: z.string().optional().describe("Optional business ID override linked to the connected Meta ad account"),
      date_from: z.string().optional().describe("Optional start date in YYYY-MM-DD format. Defaults to 7 days ago."),
      date_to: z.string().optional().describe("Optional end date in YYYY-MM-DD format. Defaults to today."),
      campaign_ids: z.string().optional().describe("Optional comma-separated Meta campaign IDs"),
      search: z.string().optional().describe("Optional case-insensitive campaign name substring filter"),
      status: z.string().optional().describe("Optional status filter. Use active, paused, or all for the simple path, or pass legacy comma-separated values such as ACTIVE,PAUSED."),
      level: z
        .enum(["campaign", "adset", "ad"])
        .optional()
        .describe("Return campaign totals, ad set breakdowns, or ad breakdowns"),
      time_increment: z
        .enum(["daily", "monthly"])
        .optional()
        .describe("Optional daily or monthly time-series breakdown"),
      sort: z.string().optional().describe("Optional sort field. Plain values sort descending; prefix with '+' for ascending. One of: spend, leads, cpl, meta_leads, conversion_leads, cpcl, meta_result, cpmr, results, cpr, ctr, impressions. Prefer meta_result / cpmr (Meta's deduped 'Results' for any objective) or conversion_leads / meta_leads over the deprecated, inflated leads / cpl."),
      limit: z.number().int().min(1).max(500).optional().describe("Maximum campaigns to return after sorting"),
      refresh: z.boolean().optional().describe("Bypass the short-lived performance cache"),
    },
    async ({
      business_id,
      date_from,
      date_to,
      campaign_ids,
      search,
      status,
      level,
      time_increment,
      sort,
      limit,
      refresh,
    }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const params = new URLSearchParams();
        if (date_from) params.set("date_from", date_from);
        if (date_to) params.set("date_to", date_to);
        if (campaign_ids) params.set("campaign_ids", campaign_ids);
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (level) params.set("level", level);
        if (time_increment) params.set("time_increment", time_increment);
        if (sort) params.set("sort", sort);
        if (limit !== undefined) params.set("limit", String(limit));
        if (refresh !== undefined) params.set("refresh", String(refresh));
        const result = await client.get(`/businesses/${resolvedBusinessId}/meta/campaigns?${params.toString()}`);
        return formatResult(appendHint(result, "For per-campaign detail and CAPI attribution, call zuckerbot_get_performance with a specific campaign_id. For creative performance breakdown, use zuckerbot_creative_analysis. For full campaign planning, start with zuckerbot_analyse_account_history."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 7. Sync Conversion ─────────────────────────────────────────
  server.tool(
    "zuckerbot_sync_conversion",
    "Send downstream conversion quality feedback to Meta via CAPI. When a ZuckerBot-sourced lead converts (sale, appointment, qualified call) or bounces (uncontactable, bad fit), reporting it here teaches Meta's algorithm to find more (or fewer) people like them — improving lead quality over time. Call this from your CRM when a lead status changes.",
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
        return formatResult(appendHint(result, "Conversion signal sent. Use zuckerbot_capi_status to view aggregate CAPI delivery and attribution, or zuckerbot_get_performance to see updated CPL and lead metrics."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 8. Research Reviews ─────────────────────────────────────────
  server.tool(
    "zuckerbot_research_reviews",
    "Fetch review intelligence for a business by name. Searches Google and Yelp to surface star rating, review count, recurring sentiment themes, and standout customer quotes that can be used directly in ad copy. Use before creating a campaign to identify proof points and objection-handling angles.",
    {
      business_name: z.string().describe("Business name to research reviews for (e.g., 'Rosebud Dental Austin')"),
      location: z.string().optional().describe("Optional city/region to narrow review search (e.g., 'Austin, TX')"),
      platform: z.enum(["google", "yelp", "all"]).optional().describe("Review platform to search. Defaults to all."),
    },
    async ({ business_name, location, platform }) => {
      try {
        const body: Record<string, unknown> = { business_name };
        if (location) body.location = location;
        if (platform) body.platform = platform;
        const result = await client.post("/research/reviews", body);
        return formatResult(appendHint(result, "Use standout quotes in ad copy and address negative themes as objection-handling. Follow up with zuckerbot_research_competitors to see how rivals are positioning, then zuckerbot_create_campaign to build the strategy."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 9. Research Competitors ────────────────────────────────────
  server.tool(
    "zuckerbot_research_competitors",
    "Scrape Meta Ad Library and search the web to analyse competitor ads in a given industry and location. Returns competitor positioning, common creative hooks, and exploitable gaps. Use before creating a campaign to benchmark against the competitive landscape and find differentiation opportunities.",
    {
      industry: z.string().describe("Business industry or category (e.g., 'dental', 'online party games', 'roofing')"),
      location: z.string().describe("City, region, or country to scope the competitor search (e.g., 'Austin, TX', 'United States')"),
      country: z.string().optional().describe("Optional 2-letter country code to refine Meta Ad Library results (e.g., 'US', 'AU'). Defaults to US."),
    },
    async ({ industry, location, country }) => {
      try {
        const body: Record<string, unknown> = { industry, location };
        if (country) body.country = country;
        const result = await client.post("/research/competitors", body);
        return formatResult(appendHint(result, "Use the identified gaps and hook patterns as input for zuckerbot_create_campaign or zuckerbot_generate_briefs to build differentiated creative angles."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 10. Research Market ─────────────────────────────────────────
  server.tool(
    "zuckerbot_research_market",
    "Get market size, addressable audience estimates, and Meta ad benchmarks (CPL, CTR, CPM) for an industry and location. Use before creating a campaign to set realistic budget expectations and understand how large the targetable audience is. Also useful for proposals and client presentations.",
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
        return formatResult(appendHint(result, "Market research complete. Use these benchmarks to set realistic budget and CPL targets when calling zuckerbot_create_campaign, or share with the user for proposal context."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 11. Meta Connection Status ─────────────────────────────────
  server.tool(
    "zuckerbot_meta_status",
    "Check whether the user's Facebook/Meta account is connected to ZuckerBot. Returns connection status, connected ad accounts, and a connect URL if not yet linked. Always call this before attempting to launch a campaign to confirm Meta credentials are available.",
    {},
    async () => {
      try {
        const result = await client.get("/meta/status");
        return formatResult(appendHint(result, "If Meta is connected, call zuckerbot_ad_accounts to list and select the right ad account, then zuckerbot_pixels and zuckerbot_meta_pages to complete setup before launch."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 12. Ad Accounts (list + select) ───────────────────────────
  server.tool(
    "zuckerbot_ad_accounts",
    "List Meta ad accounts available to the connected user and show which is currently selected for launches and reporting. Optionally select an ad account by providing select_id — this clears the stored page selection so you can pick a matching page. Call this during setup or when switching between multiple ad accounts.",
    {
      select_id: z.string().optional().describe("If provided, selects this Meta ad account ID for future operations (format: act_XXXXX). If omitted, lists all available accounts."),
    },
    async ({ select_id }) => {
      try {
        if (select_id) {
          const result = await client.post("/meta/select-ad-account", { ad_account_id: select_id });
          return formatResult(appendHint(result, "Ad account selected. Call zuckerbot_pixels to select a conversion pixel, then zuckerbot_meta_pages to select the Facebook Page for ad delivery."));
        }
        const result = await client.get("/meta/ad-accounts");
        return formatResult(appendHint(result, "Review available ad accounts. Call zuckerbot_ad_accounts with select_id to choose one, then proceed with pixel and page selection."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 13. Pixels (list + select) ─────────────────────────────────
  server.tool(
    "zuckerbot_pixels",
    "List Meta Pixels available on the currently selected ad account and show which is currently selected for conversion tracking. Optionally select a pixel by providing select_id. The selected pixel is used for all future conversion tracking and CAPI attribution.",
    {
      select_id: z.string().optional().describe("If provided, selects this Meta Pixel ID for conversion tracking. If omitted, lists all available pixels."),
    },
    async ({ select_id }) => {
      try {
        if (select_id) {
          const result = await client.post("/pixels/select", { pixel_id: select_id });
          return formatResult(appendHint(result, "Pixel selected. Call zuckerbot_meta_pages to select a Facebook Page, then zuckerbot_get_launch_credentials to confirm all launch credentials are ready."));
        }
        const result = await client.get("/pixels");
        return formatResult(appendHint(result, "Review available pixels. Call zuckerbot_pixels with select_id to choose the conversion tracking pixel for this business."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 14. Meta Pages (list + select) ────────────────────────────
  server.tool(
    "zuckerbot_meta_pages",
    "List Facebook Pages available to the connected Meta account and show which is currently selected for ad delivery. Optionally select a page by providing select_id. The selected page is used as the ad identity for all future launches.",
    {
      select_id: z.string().optional().describe("If provided, selects this Facebook Page ID for future ad launches. If omitted, lists all available pages."),
    },
    async ({ select_id }) => {
      try {
        if (select_id) {
          const result = await client.post("/meta/select-page", { page_id: select_id });
          return formatResult(appendHint(result, "Facebook Page selected. Call zuckerbot_get_launch_credentials to confirm all Meta credentials are ready for launch."));
        }
        const result = await client.get("/meta/pages");
        return formatResult(appendHint(result, "Review available pages. Call zuckerbot_meta_pages with select_id to choose the page that will appear as the ad identity."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 15. Lead Forms (list + select) ────────────────────────────
  server.tool(
    "zuckerbot_lead_forms",
    "List Meta lead forms (Instant Forms) available on the selected Facebook Page and show which is currently selected. Optionally select a form by providing select_id to persist it for future lead generation campaign launches. Use this before launching a leads-objective campaign so ZuckerBot reuses the business's CRM-connected form rather than creating a new one.",
    {
      select_id: z.string().optional().describe("If provided, selects this Meta lead form ID for future lead generation launches. If omitted, lists all available forms."),
    },
    async ({ select_id }) => {
      try {
        if (select_id) {
          const result = await client.post("/lead-forms/select", { form_id: select_id });
          return formatResult(appendHint(result, "Lead form selected. It will be used for all future leads-objective campaign launches for this business. Call zuckerbot_launch_campaign to go live."));
        }
        const result = await client.get("/lead-forms");
        return formatResult(appendHint(result, "Review available lead forms. Call zuckerbot_lead_forms with select_id to choose the form connected to your CRM."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 16. Resolve Launch Credentials ─────────────────────────────
  server.tool(
    "zuckerbot_get_launch_credentials",
    "Resolve and validate all stored Meta launch credentials for the authenticated user: access token, ad account, page, and pixel. Reports whether autonomous launch (no credential params needed at launch time) is possible. Call this after completing the setup sequence to confirm everything is ready before launching a campaign.",
    {},
    async () => {
      try {
        const result = await client.get("/meta/credentials");
        return formatResult(appendHint(result, "If autonomous_launch_possible is true, you can call zuckerbot_launch_campaign without passing Meta credential params. If not, check which credentials are missing and use the appropriate setup tool."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 18. CAPI Config — Read ─────────────────────────────────────
  server.tool(
    "zuckerbot_get_capi_config",
    "Fetch the current Conversions API configuration for a business: whether CAPI delivery is enabled, CRM source, currency, stage-to-event mappings, action source, and webhook URL. Use this before configuring CAPI to see what is already set, or to audit the current event mapping.",
    {
      business_id: z.string().optional().describe("Optional business ID override for the authenticated API key"),
    },
    async ({ business_id }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const params = new URLSearchParams({ business_id: resolvedBusinessId });
        const result = await client.get(`/capi/config?${params.toString()}`);
        return formatResult(appendHint(result, "Review the event_mapping to confirm CRM stages map to the correct Meta events. To update settings, call zuckerbot_set_capi_config. To verify delivery is working, call zuckerbot_capi_status."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 19. CAPI Config — Write ────────────────────────────────────
  server.tool(
    "zuckerbot_set_capi_config",
    "Update the Conversions API configuration for a business. Set stage-to-event mappings (e.g., 'lead' → Meta Lead event), enable/disable delivery, change the CRM source, currency, optimisation target, or action source. Changes take effect immediately for new CAPI events. Use zuckerbot_capi_test to verify the updated config works.",
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
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const body: Record<string, unknown> = { business_id: resolvedBusinessId };
        if (is_enabled !== undefined) body.is_enabled = is_enabled;
        if (currency) body.currency = currency;
        if (crm_source) body.crm_source = crm_source;
        if (optimise_for) body.optimise_for = optimise_for;
        if (action_source) body.action_source = action_source;
        if (rotate_webhook_secret !== undefined) body.rotate_webhook_secret = rotate_webhook_secret;
        if (event_mapping) body.event_mapping = event_mapping;

        const result = await client.put("/capi/config", body);
        return formatResult(appendHint(result, "CAPI config updated. Call zuckerbot_capi_test to send a synthetic test event and verify the new configuration works end-to-end."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 20. CAPI Status ────────────────────────────────────────────
  server.tool(
    "zuckerbot_capi_status",
    "Get 7-day and 30-day CAPI delivery statistics for the business: total events sent, events by type (Lead/Contact/Purchase), match quality breakdown, and attribution counts. Use this to confirm CAPI is functioning and that events are being matched by Meta.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
    },
    async ({ business_id }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const params = new URLSearchParams({ business_id: resolvedBusinessId });
        const result = await client.get(`/capi/status${params.toString() ? `?${params.toString()}` : ""}`);
        return formatResult(appendHint(result, "If events_sent is 0 or match quality is 'none', review the config with zuckerbot_get_capi_config and test delivery with zuckerbot_capi_test. If attribution looks good, use zuckerbot_create_seed_audience to build custom audiences from the attributed leads."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 21. CAPI Test ──────────────────────────────────────────────
  server.tool(
    "zuckerbot_capi_test",
    "Send a synthetic CAPI test event through the business configuration to verify the full pipeline: stage mapping, hashing, and Meta Graph API delivery. Logs as a test event (does not affect real attribution). Use after setting up or updating CAPI config to confirm events are flowing.",
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
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const body: Record<string, unknown> = {
          business_id: resolvedBusinessId,
        };
        if (source_stage) body.source_stage = source_stage;
        if (crm_source) body.crm_source = crm_source;
        if (value !== undefined) body.value = value;
        if (user_data) body.user_data = user_data;

        const result = await client.post("/capi/config/test", body);
        return formatResult(appendHint(result, "Test event sent. Check status in the response — if 'sent', CAPI is working. If 'skipped' or 'failed', review the config with zuckerbot_get_capi_config and fix the event mapping."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 22. Create Portfolio ───────────────────────────────────────
  server.tool(
    "zuckerbot_create_portfolio",
    "Create a planning and monitoring-only multi-tier audience portfolio for a business from a shared template (e.g., 'Local Services', 'eCommerce') or a custom tier array. Portfolios split a proposed total budget across prospecting, retargeting, and reactivation tiers with per-tier CPA targets. Portfolio launch is temporarily disabled during Dealify hardening.",
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
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const body: Record<string, unknown> = {
          business_id: resolvedBusinessId,
        };
        if (template_id) body.template_id = template_id;
        if (template_name) body.template_name = template_name;
        if (name) body.name = name;
        if (total_daily_budget_cents !== undefined) body.total_daily_budget_cents = total_daily_budget_cents;
        if (is_active !== undefined) body.is_active = is_active;
        if (tiers) body.tiers = tiers;

        const result = await client.post("/portfolios/create", body);
        return formatResult(appendHint(result, "Planning portfolio created. Call zuckerbot_get_portfolio to review the tier configuration. Portfolio launch is temporarily disabled; use a reviewed legacy draft for live launch."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 23. Get Portfolio ─────────────────────────────────────────
  server.tool(
    "zuckerbot_get_portfolio",
    "Fetch the configuration and current performance snapshot for an audience portfolio by ID. Returns tier definitions, budget allocations, CPA targets, and any existing performance data. Use this to inspect a portfolio for planning, monitoring, or rebalancing an already-active portfolio.",
    {
      portfolio_id: z.string().describe("Audience portfolio ID"),
    },
    async ({ portfolio_id }) => {
      try {
        const result = await client.get(`/portfolios/${portfolio_id}`);
        return formatResult(appendHint(result, "Review tier config and performance. To adjust planning settings, call zuckerbot_update_portfolio. Existing active portfolios can be monitored or rebalanced, but new portfolio launch is temporarily disabled."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 24. Update Portfolio ──────────────────────────────────────
  server.tool(
    "zuckerbot_update_portfolio",
    "Update the name, total daily budget, active status, or tier configuration of an existing audience portfolio. Changes to budget and tiers take effect on the next autonomous evaluation cycle. Use this to adjust a portfolio without relaunching all tiers.",
    {
      portfolio_id: z.string().describe("Audience portfolio ID to update"),
      name: z.string().optional().describe("New portfolio name"),
      total_daily_budget_cents: z.number().int().optional().describe("New total daily budget in cents (minimum 500)"),
      is_active: z.boolean().optional().describe("Enable or disable the portfolio for autonomous evaluation"),
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
        .describe("Updated tier configuration. Replaces the existing tiers array."),
    },
    async ({ portfolio_id, name, total_daily_budget_cents, is_active, tiers }) => {
      try {
        const body: Record<string, unknown> = {};
        if (name !== undefined) body.name = name;
        if (total_daily_budget_cents !== undefined) body.total_daily_budget_cents = total_daily_budget_cents;
        if (is_active !== undefined) body.is_active = is_active;
        if (tiers) body.tiers = tiers;
        const result = await client.put(`/portfolios/${portfolio_id}`, body);
        return formatResult(appendHint(result, "Portfolio updated. If budget changed, call zuckerbot_rebalance_portfolio with dry_run=false to redistribute budgets across tiers. Call zuckerbot_portfolio_performance to see live metrics."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 25. Portfolio Performance ─────────────────────────────────
  server.tool(
    "zuckerbot_portfolio_performance",
    "Fetch live Meta performance and downstream CAPI attribution for a launched audience portfolio. Returns enriched tier rows with ad breakdowns, daily metrics, CPA vs. target comparisons, and autonomous evaluation outputs. Use this to monitor a running portfolio and decide whether to rebalance.",
    {
      portfolio_id: z.string().describe("Audience portfolio ID"),
    },
    async ({ portfolio_id }) => {
      try {
        const result = await client.get(`/portfolios/${portfolio_id}/performance`);
        return formatResult(appendHint(result, "Review CPA vs. target for each tier. If tiers are over/under-spending, call zuckerbot_rebalance_portfolio to redistribute budgets. Use zuckerbot_pause_campaign to stop an underperforming tier."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 26. Rebalance Portfolio ───────────────────────────────────
  server.tool(
    "zuckerbot_rebalance_portfolio",
    "Dry-run or execute a budget rebalance across portfolio tiers based on each tier's actual vs. target CPA. With dry_run=true (default) returns recommendations without making changes — useful for review before committing. With dry_run=false updates Meta ad set budgets and local records in one operation.",
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
        return formatResult(appendHint(result, "Rebalance complete. Call zuckerbot_portfolio_performance to verify the new budget allocation is reflected in Meta delivery data."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 27. Launch Portfolio ──────────────────────────────────────
  server.tool(
    "zuckerbot_launch_portfolio",
    "Temporarily unavailable during Dealify launch hardening. Portfolio planning and monitoring remain available, but new multi-tier launches must not create Meta objects. Create a legacy-mode draft and use zuckerbot_launch_campaign for the supported live path.",
    {
      portfolio_id: z.string().describe("Audience portfolio ID to launch"),
      meta_access_token: z.string().optional().describe("Optional Meta/Facebook access token override"),
      meta_ad_account_id: z.string().optional().describe("Optional Meta ad account ID override (format: act_XXXXX)"),
      meta_page_id: z.string().optional().describe("Optional Facebook Page ID override"),
    },
    async ({ portfolio_id, meta_access_token, meta_ad_account_id, meta_page_id }) => {
      void meta_access_token;
      void meta_ad_account_id;
      void meta_page_id;
      return formatResult({
        error: true,
        code: "portfolio_launch_temporarily_disabled",
        message: "Portfolio launch is temporarily disabled. Create a campaign with mode='legacy', review it, then call zuckerbot_launch_campaign.",
        portfolio_id,
        supported_create_mode: "legacy",
        supported_launch_tool: "zuckerbot_launch_campaign",
      });
    },
  );

  // ── 28. Tag Creative ──────────────────────────────────────────
  server.tool(
    "zuckerbot_tag_creative",
    "Tag Meta ads with creative attributes (hook type, visual style, product focus, CTA type, copy tone, setting) by providing ad metadata and optional asset URLs. ZuckerBot uses Claude vision to analyze the creative and store structured tags. These tags feed the zuckerbot_creative_analysis pipeline. Run this after launching new ads to keep the creative intelligence database current.",
    {
      business_id: z.string().optional().describe("Optional business ID override"),
      ads: z.array(
        z.object({
          meta_ad_id: z.string().describe("Meta ad ID to tag"),
          meta_ad_name: z.string().optional().describe("Optional ad name for context"),
          meta_campaign_id: z.string().optional().describe("Optional parent campaign ID"),
          meta_adset_id: z.string().optional().describe("Optional parent ad set ID"),
          creative_type: z.enum(["video", "image", "carousel", "static"]).describe("Creative format"),
          thumbnail_url: z.string().optional().describe("Optional thumbnail image URL for vision analysis"),
          video_url: z.string().optional().describe("Optional video URL"),
          ad_copy: z.string().optional().describe("Optional ad body copy text"),
          headline: z.string().optional().describe("Optional headline text"),
          cta_text: z.string().optional().describe("Optional CTA button text"),
          frame_urls: z.array(z.string()).optional().describe("Optional sampled video frame URLs for analysis"),
        }),
      ).min(1).describe("One or more Meta ads to tag with creative attributes"),
    },
    async ({ business_id, ads }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const result = await client.post("/creative/tag", {
          business_id: resolvedBusinessId,
          ads,
        });
        return formatResult(appendHint(result, "Creative tags stored. Call zuckerbot_creative_analysis to see aggregate performance patterns across these tagged attributes, or zuckerbot_generate_briefs to create briefs weighted toward top performers."));
      } catch (err) {
        return formatError(err);
      }
    },
  );

  // ── 29. Send CAPI Event ───────────────────────────────────────
  server.tool(
    "zuckerbot_send_capi_event",
    "Manually send a Conversions API event for a business contact/lead. Useful for debugging CAPI pipelines, testing stage mappings with real user data, or sending events from custom integrations not covered by the webhook. Authenticates with the business API key OR with an x-zuckerbot-webhook-secret header if using the webhook path.",
    {
      business_id: z.string().optional().describe("Optional business ID override (resolved from API key when omitted)"),
      source_stage: z.string().describe("CRM stage key to map to a Meta event (e.g., 'lead', 'salesqualifiedlead', 'customer')"),
      crm_source: z.string().optional().describe("Optional CRM source label override (e.g., 'hubspot', 'salesforce')"),
      lead_id: z.string().optional().describe("Optional ZuckerBot lead ID for attribution matching"),
      meta_lead_id: z.string().optional().describe("Optional Meta Lead Gen Ads lead ID for attribution matching"),
      email: z.string().optional().describe("Optional contact email for identity matching"),
      phone: z.string().optional().describe("Optional contact phone for identity matching"),
      first_name: z.string().optional().describe("Optional first name for identity matching"),
      last_name: z.string().optional().describe("Optional last name for identity matching"),
      value: z.number().optional().describe("Optional event value override in major currency units"),
      event_time: z.string().optional().describe("Optional ISO 8601 event timestamp. Defaults to now."),
      fbclid: z.string().optional().describe("Optional Facebook click ID for fbc cookie attribution"),
    },
    async ({ business_id, source_stage, crm_source, lead_id, meta_lead_id, email, phone, first_name, last_name, value, event_time, fbclid }) => {
      try {
        const resolvedBusinessId = await client.resolveBusinessId(business_id);
        const body: Record<string, unknown> = {
          business_id: resolvedBusinessId,
          source_stage,
        };
        if (crm_source) body.crm_source = crm_source;
        if (lead_id) body.lead_id = lead_id;
        if (meta_lead_id) body.meta_lead_id = meta_lead_id;
        if (email) body.email = email;
        if (phone) body.phone = phone;
        if (first_name) body.first_name = first_name;
        if (last_name) body.last_name = last_name;
        if (value !== undefined) body.value = value;
        if (event_time) body.event_time = event_time;
        if (fbclid) body.fbclid = fbclid;

        const result = await client.post("/capi/events", body);
        return formatResult(appendHint(result, "Event dispatched. Check the status field: 'sent' = successfully delivered to Meta, 'skipped' = CAPI disabled or stage unmapped, 'failed' = Meta rejected the event. Use zuckerbot_capi_status for aggregate delivery metrics."));
      } catch (err) {
        return formatError(err);
      }
    },
  );
}
