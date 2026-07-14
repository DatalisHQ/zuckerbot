<div align="center">

# ZuckerBot

**The Meta Ads toolkit for AI agents.**

Audit your ad account in one message. 50+ tools for account auditing, campaign management, creative analysis, audience building, and conversion tracking. One `npx` command. Works with Claude, ChatGPT, OpenClaw, Cursor, and any MCP-compatible agent.

[![npm version](https://img.shields.io/npm/v/zuckerbot-mcp?style=flat-square&color=CB3837)](https://www.npmjs.com/package/zuckerbot-mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-io.github.Crumbedsausage/zuckerbot-8A2BE2?style=flat-square)](https://github.com/modelcontextprotocol/servers)
[![GitHub stars](https://img.shields.io/github/stars/DatalisHQ/zuckerbot?style=flat-square)](https://github.com/DatalisHQ/zuckerbot/stargazers)

```json
{
  "mcpServers": {
    "zuckerbot": {
      "command": "npx",
      "args": ["-y", "zuckerbot-mcp"],
      "env": { "ZUCKERBOT_API_KEY": "zb_live_your_key_here" }
    }
  }
}
```

[Get API Key (free)](https://zuckerbot.ai/get-started) · [npm](https://www.npmjs.com/package/zuckerbot-mcp) · [Docs](https://zuckerbot.ai/docs) · [Website](https://zuckerbot.ai)

</div>

---

## Why ZuckerBot?

Your agent already writes code, manages files, and searches the web. It should manage your ads too.

ZuckerBot gives any AI agent full Meta Ads capabilities through MCP. No dashboard, no UI to learn, no platform to log into. Your agent installs it, connects your ad account, and gets to work.

**What agents can do with ZuckerBot:**
- **Audit your ad account in one message** — wasted spend, creative fatigue, opportunity score, prioritised action items (free tier included)
- Pull campaign performance and spot what's working
- Analyse ad creatives and recommend what to test next
- Build and launch campaigns with targeting and budget
- Create custom and lookalike audiences
- Set up server-side conversion tracking (CAPI)
- Research competitors, reviews, and market benchmarks
- Generate ad creative briefs and copy

## How it works

```
You ↔ Your Agent (Claude, ChatGPT, OpenClaw, Cursor, etc.)
                  ↕
            ZuckerBot MCP
                  ↕
         Meta Marketing API
```

ZuckerBot handles the Meta API complexity. Your agent handles the conversation. You make the decisions.

## Install

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "zuckerbot": {
      "command": "npx",
      "args": ["-y", "zuckerbot-mcp"],
      "env": { "ZUCKERBOT_API_KEY": "zb_live_your_key_here" }
    }
  }
}
```

### OpenClaw

Add to your MCP config:

```json
{
  "mcpServers": {
    "zuckerbot": {
      "command": "npx",
      "args": ["-y", "zuckerbot-mcp"],
      "env": { "ZUCKERBOT_API_KEY": "zb_live_your_key_here" }
    }
  }
}
```

### Cursor / Windsurf / Any MCP Client

Same config pattern. ZuckerBot works with any client that supports the Model Context Protocol.

### Remote MCP (no install)

Don't want to run anything locally? `https://zuckerbot.ai/api/mcp` is a hosted Streamable HTTP endpoint serving the same tools.

- **claude.ai** — add it as a custom connector (Settings → Connectors → Add custom connector) and authenticate via OAuth, or pass an `Authorization: Bearer zb_live_...` header.
- **Claude Code:**

```bash
claude mcp add --transport http zuckerbot https://zuckerbot.ai/api/mcp --header "Authorization: Bearer zb_live_..."
```

- **Any Streamable HTTP client** — point it at `https://zuckerbot.ai/api/mcp` with your API key as a bearer token.

### CLI (for humans)

```bash
npm install -g zuckerbot-mcp

zuckerbot preview https://your-business.com
zuckerbot meta status
zuckerbot create https://your-business.com --budget 5000 --objective leads
```

## Tools (50+)

### Audit & Licensing (2)
| Tool | What it does |
|------|-------------|
| `audit_account` | Full read-only account audit: wasted spend, creative fatigue, opportunity score (0-100), projected CPL improvement, prioritised action items. Available on every tier — the recommended first call |
| `redeem_license` | Redeem a lifetime licence code (Dealify/AppSumo) and upgrade all API keys on the account |

### Setup & Account (7)
| Tool | What it does |
|------|-------------|
| `quickstart` | Guided setup: check auth, show next steps, recommended tool flow |
| `meta_status` | Check Meta connection status for your API key |
| `list_ad_accounts` | List available Meta ad accounts and current selection |
| `select_ad_account` | Connect a specific ad account |
| `list_meta_pages` | List Facebook pages and current selection |
| `select_meta_page` | Set active page for ad delivery |
| `get_launch_credentials` | Verify all required credentials are set before launching |

### Campaigns (9)
| Tool | What it does |
|------|-------------|
| `preview_campaign` | Generate ad preview from a URL (no Meta account needed) |
| `create_campaign` | Create a campaign draft with strategy, targeting, and creatives |
| `get_campaign` | Get campaign detail, workflow state, and linked creatives |
| `approve_campaign_strategy` | Approve tiers and creative angles for an intelligence campaign |
| `suggest_angles` | Get proposed creative angles and audience tiers for a draft |
| `activate_campaign` | Activate ready tiers and begin ad delivery |
| `launch_campaign` | Launch one or all variants from a draft on Meta |
| `pause_campaign` | Pause or resume a live campaign |
| `get_performance` | Real-time campaign metrics: spend, leads, CPL, CTR, ROAS |

### Audiences (6)
| Tool | What it does |
|------|-------------|
| `create_seed_audience` | Build a custom audience from hashed CAPI users |
| `create_lookalike_audience` | Create a lookalike from any seed audience |
| `list_audiences` | List all custom and lookalike audiences |
| `refresh_audience` | Refresh an audience or sync latest state from Meta |
| `get_audience_status` | Check audience size, status, and readiness |
| `delete_audience` | Remove an audience from Meta and ZuckerBot |

### Creatives (8)
| Tool | What it does |
|------|-------------|
| `upload_creative` | Upload finished assets and provision paused Meta ads |
| `get_creative_status` | Check creative generation progress |
| `creative_analysis` | AI analysis of ad creative performance with recommendations |
| `creative_qa` | Quality check creatives against Meta ad policies |
| `generate_briefs` | Generate creative briefs based on performance data |
| `generate_creatives`* | Generate ad copy and images (or AI video) |
| `request_creative`* | Create a creative handoff package for production |

\* Creative image/video **generation** tools (`generate_static_ad`, `generate_video_ad`, `get_video_ad_status`, `generate_creatives`, `request_creative`) are disabled by default — enable them with `ZUCKERBOT_ENABLE_CREATIVE_TOOLS=1` in your MCP config env (paid add-on coming). All creative **analysis** tools stay available.

### Conversion Tracking / CAPI (5)
| Tool | What it does |
|------|-------------|
| `capi_config` | Get or update server-side conversion tracking config |
| `capi_status` | 7-day and 30-day CAPI delivery and attribution stats |
| `capi_test` | Send a test event through the CAPI pipeline |
| `sync_conversion` | Send lead quality feedback to Meta's algorithm |
| `list_pixels` | List and select Meta pixels for conversion tracking |

### Reporting (2)
| Tool | What it does |
|------|-------------|
| `get_campaign_insights` | Campaign / ad set / ad-level Meta performance for any campaign in the account (including non-ZuckerBot ones), with deduped lead metrics |
| `get_account_insights` | Account-wide spend, impressions, CTR, CPM, CPC, and frequency aggregated daily or monthly |

`get_campaign_insights` surfaces three distinct lead figures rather than one collapsed number, each verified against Ads Manager:

| Field | Meaning |
|-------|---------|
| `meta_result` / `cost_per_meta_result` | Meta's authoritative deduped "Results" for **any** objective (Ads Manager "Results" column), with `meta_result_type` naming the underlying result (`conversion_lead` for lead campaigns, `offsite_conversion.fb_pixel_complete_registration` / `purchase` for sales). Supersedes the now-deprecated `results` / `cost_per_result` |
| `meta_leads` / `cost_per_meta_lead` | Deduped on-Meta leads (`onsite_conversion.lead_grouped`) — matches Ads Manager "Meta Leads" |
| `conversion_leads` / `cost_per_conversion_lead` | CRM-qualified conversion leads (from Meta's `results` indicator `conversion_leads:conversion_lead`) — matches "Conversion leads". Lead-specific (0 for non-lead objectives) |
| `actions` / `cost_per_action_type` | Full labelled arrays of `{ action_type, value }` (counts) and `{ action_type, value }` (cost in dollars) for every Meta action type |
| `results` / `cost_per_result` | **Deprecated.** Objective-resolved result that mis-ranks mixed campaigns. Kept for back-compat — prefer `meta_result` / `cost_per_meta_result` |
| `leads` / `cpl` | **Deprecated.** Inflated surface count (`action_type: lead`) that double-counts the instant-form lead and its CAPI echo. Kept for back-compat — prefer `meta_leads` / `conversion_leads` |

Costs are derived as `spend / count`; Meta's `cost_per_action_type` is non-additive and is never summed. The same fields roll up in `summary` as `total_meta_result` / `blended_cost_per_meta_result` (with `meta_result_type`), `total_meta_leads` / `blended_cost_per_meta_lead`, and `total_conversion_leads` / `blended_cost_per_conversion_lead` (with `total_leads` / `blended_cpl` deprecated alongside their per-row counterparts).

### Portfolios (5)
| Tool | What it does |
|------|-------------|
| `create_portfolio` | Create an audience portfolio from a template |
| `launch_portfolio` | Launch all campaigns in a portfolio |
| `portfolio_performance` | Tier-by-tier portfolio performance breakdown |
| `rebalance_portfolio` | Dry-run or apply budget rebalancing across tiers |

### Research (3)
| Tool | What it does |
|------|-------------|
| `research_reviews` | Review intelligence for any business |
| `research_competitors` | Competitor ad analysis by industry and location |
| `research_market` | Market intelligence and ad benchmarks |

### Business Context (4)
| Tool | What it does |
|------|-------------|
| `enrich_business` | Crawl a website and cache structured business context |
| `upload_business_context` | Upload text content and extract business insights |
| `list_business_context` | List uploaded context files and summaries |
| `select_lead_form` | Select a lead form for campaign targeting |

## Typical Agent Flow

```
0. Audit       →  audit_account (how is this account doing today?)
1. Research    →  research_reviews + research_competitors (parallel)
2. Preview     →  preview_campaign (show user what ads look like)
3. Create      →  create_campaign (draft with strategy + targeting)
4. Approve     →  approve_campaign_strategy
5. Creative    →  request_creative or upload_creative
6. Activate    →  activate_campaign
7. Monitor     →  get_performance + creative_analysis
8. Optimise    →  sync_conversion + audience tools
```

Every tool returns a `_hint` field suggesting the logical next step, so your agent always knows what to do next.
Shorthand: create -> approve -> request/upload creative -> activate.
MCP names include `zuckerbot_enrich_business`, `zuckerbot_upload_business_context`, `zuckerbot_get_campaign`, `zuckerbot_activate_campaign`, and `zuckerbot_create_seed_audience`.

## ZuckerBot vs alternatives

| | ZuckerBot | Pipeboard | AdAmigo.ai | Supermetrics |
|---|---|---|---|---|
| **What it is** | Meta Ads toolkit for agents | Basic Meta MCP | Full ad management agent | Data extraction |
| **Tools** | 50+ | ~20 | N/A (platform) | N/A (connectors) |
| **Creative analysis** | ✅ AI-powered | ❌ | ✅ Platform-only | ❌ |
| **CAPI support** | ✅ Full pipeline | ❌ | Partial | ❌ |
| **Audience builder** | ✅ Seed + LAL | ❌ | ✅ Platform-only | ❌ |
| **Works with any agent** | ✅ MCP standard | ✅ MCP standard | ❌ Locked to platform | ❌ |
| **Price** | Free tier available | Free | $349/mo/account | $39-299/mo |

## Pricing

| Tier | Monthly | API Calls | Tools |
|------|---------|-----------|-------|
| **Free** | $0 | 1,000/mo | Read-only (performance, analysis, research, **account audit**) |
| **Pro** | $49 + 0.1% of ad spend | 50,000/mo | All tools including campaign management |
| **Scale** | $149 + 0.05% of ad spend | 500,000/mo | All tools + multi-account + priority rate limits |

Free tier gets you started. Pro pays for itself with one optimised campaign.

[Get your API key](https://zuckerbot.ai/get-started)

## Lifetime deal

Grabbed a ZuckerBot lifetime licence on Dealify? Codes look like `ZB-XXXXX-XXXXX-XXXXX` and stack on one account:

| Codes | Tier | Ad accounts | API calls |
|-------|------|-------------|-----------|
| 1 | Lifetime Tier 1 | 1 | 2,500/mo |
| 2 | Lifetime Tier 2 | 3 | 10,000/mo |
| 3 | Lifetime Tier 3 | 10 | 30,000/mo |

Redeem straight from your agent with the `zuckerbot_redeem_license` tool ("redeem my ZuckerBot code ZB-...") or in the browser at [zuckerbot.ai/start.html](https://zuckerbot.ai/start.html). Redeeming upgrades every API key on your account — and if you don't have a key yet, one is minted for you (shown once, so save it).

## Example conversation

> **You:** How are my Meta campaigns doing this week?
>
> **Agent** calls `get_account_insights` + `creative_analysis`
>
> **Agent:** You spent $2,340 across 4 campaigns this week. Your LAL campaign is crushing it at $28 CPL — that's 40% below your account average. But your broad targeting campaign is at $95 CPL and burning budget. The "customer testimonial" creative has a 3.2% CTR vs 1.1% for your product shots. I'd recommend pausing the broad campaign and shifting that budget to the LAL.
>
> **You:** Do it.
>
> **Agent** calls `pause_campaign` + (budget adjustment)

## Development

```bash
git clone https://github.com/DatalisHQ/zuckerbot.git
cd zuckerbot
npm install
npm run build
npm start
```

## License

MIT
