<div align="center">

# ZuckerBot

**Give your AI agent Facebook Ads.**

One MCP server to create, launch, and autonomously manage Meta ad campaigns.

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

[Website](https://zuckerbot.ai) · [npm](https://www.npmjs.com/package/zuckerbot-mcp) · [API Docs](https://zuckerbot.ai/docs) · [Get API Key](https://zuckerbot.ai/developer)

</div>

---

## 🧠 Why ZuckerBot

Most Meta Ads MCP tools let you *read* your ad data. ZuckerBot lets your AI agent **run the whole show** — from market research to campaign creation, AI-generated creatives, launch, real-time optimization, and conversion feedback. One API, full lifecycle, no Ads Manager tab.

- **44 MCP tools** covering the entire ad lifecycle
- **AI creative generation** — Seedream/Imagen images and Kling video ads, generated on demand
- **Autonomous optimization** — policy-driven budget scaling, pausing, and rebalancing
- **CAPI pipeline** — map CRM stages to Meta conversion events, ingest webhooks, monitor attribution
- **Audience portfolios** — template-based tier budgeting with auto-rebalancing
- **CLI for humans** — run campaigns from your terminal, not just through an agent
- **Works without a Meta account** — preview campaigns and generate creatives with zero setup

## ⚡ Quick Start

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "zuckerbot": {
      "command": "npx",
      "args": ["-y", "zuckerbot-mcp"],
      "env": {
        "ZUCKERBOT_API_KEY": "zb_live_your_key_here"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "zuckerbot": {
      "command": "npx",
      "args": ["-y", "zuckerbot-mcp"],
      "env": {
        "ZUCKERBOT_API_KEY": "zb_live_your_key_here"
      }
    }
  }
}
```

### OpenClaw

```
/skill install zuckerbot
```

### CLI

```bash
npm install -g zuckerbot-mcp
export ZUCKERBOT_API_KEY=zb_live_your_key_here

zuckerbot preview https://your-business.com
```

Get your API key at [zuckerbot.ai/developer](https://zuckerbot.ai/developer). Try preview and creative generation without a key (5 free/day).

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ZUCKERBOT_API_KEY` | Yes | — | Your API key (`zb_live_` or `zb_test_`) |
| `ZUCKERBOT_API_URL` | No | `https://zuckerbot.ai/api/v1` | Override for self-hosted or staging |

## 📊 How It Compares

| Feature | ZuckerBot | Pipeboard (meta-ads-mcp) | Manual Ads Manager |
|---|---|---|---|
| MCP tools | **44** | ~25 | 0 |
| Full campaign creation from URL | ✅ AI-planned strategy | ❌ Manual campaign struct | ✅ Manual |
| AI creative generation | ✅ Seedream / Imagen / Kling video | ❌ | Manual upload |
| Autonomous optimization | ✅ Policy-driven | ❌ | Manual |
| CAPI pipeline | ✅ Config, ingest, monitor | ❌ | Manual setup |
| Audience portfolios | ✅ Template-based tiers | ❌ | Manual |
| Performance analytics | ✅ | ✅ (core strength) | ✅ |
| Campaign management | ✅ Launch, pause, resume, A/B | ✅ Create, update, pause | ✅ |
| Market research & intel | ✅ Reviews, competitors, benchmarks | ❌ | Third-party |
| CLI for humans | ✅ | ❌ | N/A |
| Language | TypeScript | Python | N/A |
| License | MIT | Source-available + paid cloud | N/A |

> Pipeboard is strong for analytics and reading existing campaign data. ZuckerBot is built for the full autonomous lifecycle — **research → create → generate creatives → launch → optimize → convert**.

## 🛠️ Available Tools (44)

### Campaign Lifecycle

| Tool | Description |
|------|-------------|
| `zuckerbot_quickstart` | Show mode status, setup steps, and recommended flow |
| `zuckerbot_preview_campaign` | Generate ad preview from a URL — no Meta account needed |
| `zuckerbot_create_campaign` | Create an intelligence campaign draft with strategy, tiers, and angles |
| `zuckerbot_get_campaign` | Get campaign detail, workflow state, and linked executions |
| `zuckerbot_approve_campaign_strategy` | Approve audience tiers and creative angles |
| `zuckerbot_suggest_angles` | Read a draft and return proposed creative angles + tiers |
| `zuckerbot_launch_campaign` | Launch a variant on Meta (the money endpoint) |
| `zuckerbot_launch_all_variants` | Launch all variants for A/B testing in one call |
| `zuckerbot_pause_campaign` | Pause or resume a live campaign |
| `zuckerbot_get_performance` | Real-time metrics: impressions, clicks, spend, leads, CPL |
| `zuckerbot_activate_campaign` | Activate ready tiers after creative upload |

### Creative Pipeline

| Tool | Description |
|------|-------------|
| `zuckerbot_generate_creatives` | AI images (Seedream/Imagen) or video (Kling) + ad copy |
| `zuckerbot_suggest_angles` | Proposed creative angles for a campaign draft |
| `zuckerbot_request_creative` | Dispatch a creative handoff package |
| `zuckerbot_upload_creative` | Upload finished assets and provision Meta executions |

### Business Intelligence

| Tool | Description |
|------|-------------|
| `zuckerbot_enrich_business` | Crawl a website and cache structured business context |
| `zuckerbot_upload_business_context` | Upload text context and extract planning insights |
| `zuckerbot_list_business_context` | List uploaded context files and summaries |

### Audience Management

| Tool | Description |
|------|-------------|
| `zuckerbot_create_seed_audience` | Build a Meta custom audience from hashed CAPI users |
| `zuckerbot_create_lookalike_audience` | Create a 1-20% lookalike from a seed audience |
| `zuckerbot_list_audiences` | List stored audiences with sizes and delivery status |
| `zuckerbot_refresh_audience` | Rebuild seed or sync lookalike status |
| `zuckerbot_get_audience_status` | Fetch latest Meta audience status |
| `zuckerbot_delete_audience` | Delete from Meta and ZuckerBot registry |

### CAPI & Conversions

| Tool | Description |
|------|-------------|
| `zuckerbot_capi_config` | Get or update per-business CAPI configuration |
| `zuckerbot_capi_status` | 7-day and 30-day delivery and attribution status |
| `zuckerbot_capi_test` | Send a synthetic test event through the pipeline |
| `zuckerbot_sync_conversion` | Feed lead quality back to Meta's algorithm |

### Portfolio Management

| Tool | Description |
|------|-------------|
| `zuckerbot_create_portfolio` | Create audience portfolio from template |
| `zuckerbot_portfolio_performance` | Tier-by-tier performance with attributed conversions |
| `zuckerbot_rebalance_portfolio` | Dry-run or apply portfolio rebalance |

### Research & Intelligence

| Tool | Description |
|------|-------------|
| `zuckerbot_research_reviews` | Review intelligence: sentiment, proof points for ad copy |
| `zuckerbot_research_competitors` | Competitor ad analysis for a category and location |
| `zuckerbot_research_market` | Market size, audience estimates, and ad benchmarks |
| `zuckerbot_get_account_insights` | Historical Meta account insights over date ranges |

### Meta Account Setup

| Tool | Description |
|------|-------------|
| `zuckerbot_meta_status` | Check Meta connection status |
| `zuckerbot_list_ad_accounts` | List available Meta ad accounts |
| `zuckerbot_select_ad_account` | Select ad account for launches |
| `zuckerbot_list_pixels` | List Meta pixels for the selected account |
| `zuckerbot_select_pixel` | Select pixel for conversion tracking |
| `zuckerbot_list_meta_pages` | List Facebook pages |
| `zuckerbot_select_meta_page` | Select page for launches |
| `zuckerbot_list_lead_forms` | List Meta lead forms (Instant Forms) |
| `zuckerbot_select_lead_form` | Select lead form for lead gen campaigns |
| `zuckerbot_get_launch_credentials` | Resolve stored credentials for autonomous launch |

## 🔌 API Endpoints

Base URL: `https://zuckerbot.ai/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/campaigns/preview` | Generate ad preview from a URL |
| `POST` | `/campaigns/create` | Create campaign with strategy and targeting |
| `POST` | `/campaigns/:id/launch` | Launch a draft on Meta |
| `POST` | `/campaigns/:id/pause` | Pause or resume a live campaign |
| `GET` | `/campaigns/:id/performance` | Real-time metrics with tier breakdowns |
| `POST` | `/campaigns/:id/conversions` | Send lead quality feedback |
| `POST` | `/creatives/generate` | Generate ad copy + AI media |
| `GET` | `/capi/config` | Get CAPI config and webhook URL |
| `PUT` | `/capi/config` | Update CAPI config |
| `POST` | `/capi/config/test` | Send synthetic CAPI test event |
| `POST` | `/capi/events` | Ingest CRM webhook events |
| `GET` | `/capi/status` | CAPI delivery and attribution status |
| `POST` | `/portfolios/create` | Create audience portfolio |
| `GET` | `/portfolios/:id/performance` | Tier-by-tier portfolio performance |
| `POST` | `/portfolios/:id/rebalance` | Dry-run or apply rebalance |
| `POST` | `/research/reviews` | Review intelligence |
| `POST` | `/research/competitors` | Competitor ad analysis |
| `POST` | `/research/market` | Market benchmarks |
| `GET` | `/meta/status` | Meta connection status |
| `GET` | `/meta/ad-accounts` | List ad accounts |
| `GET` | `/meta/pages` | List Facebook pages |

All endpoints require `Authorization: Bearer zb_live_...` except where noted. Full reference at [zuckerbot.ai/docs](https://zuckerbot.ai/docs).

## 💻 CLI Examples

```bash
# Preview what ads would look like for any URL
zuckerbot preview https://serenity-yoga.com

# Create a full campaign with budget and objective
zuckerbot create https://serenity-yoga.com --budget 2000 --objective leads

# Launch it on Meta
zuckerbot launch camp_abc123

# Check real-time performance
zuckerbot status camp_abc123

# Generate standalone creatives
zuckerbot creatives "Sunrise Yoga" "Hot yoga and meditation in Austin, TX"

# Research the competitive landscape
zuckerbot research competitors "yoga studios" "Austin, TX"

# Check your Meta connection
zuckerbot meta status
```

## 🤖 Example Agent Conversation

> **User:** Set up Facebook ads for my yoga studio — serenity-yoga.com, $15/day budget
>
> **Agent:** Let me research your business first…
> *(calls `zuckerbot_research_reviews` + `zuckerbot_research_competitors`)*
>
> You have a 4.9★ rating with 89 reviews. Customers love the "calming atmosphere." Your competitors aren't using social proof in their ads — that's your edge.
>
> *(calls `zuckerbot_create_campaign` with intelligence mode)*
>
> I created a campaign draft with two audience tiers:
> 1. **Broad Local** — yoga-interested women 25-54 within 10mi
> 2. **Customer Lookalike** — 1% lookalike from your existing customers
>
> Two creative angles: "4.9 Stars, 89 Reviews" (social proof) and "First Class Free" (low commitment).
>
> *(calls `zuckerbot_approve_campaign_strategy` → `zuckerbot_request_creative` → `zuckerbot_upload_creative` → `zuckerbot_activate_campaign`)*
>
> **Agent:** Your campaign is live. I'll monitor performance and feed lead quality back to Meta's algorithm as conversions come in.

## 💰 Pricing

| Plan | Price | Requests/mo | Rate Limit |
|------|-------|-------------|------------|
| **Anonymous** | Free | 5/day | — |
| **Free** | $0 | 25 | 10 req/min |
| **Pro** | $49/mo | 500 | 60 req/min |
| **Enterprise** | Custom | Custom | 300 req/min |

[Get your API key →](https://zuckerbot.ai/developer)

## 🔗 Links

- **Website:** [zuckerbot.ai](https://zuckerbot.ai)
- **npm:** [npmjs.com/package/zuckerbot-mcp](https://www.npmjs.com/package/zuckerbot-mcp)
- **API Docs:** [zuckerbot.ai/docs](https://zuckerbot.ai/docs)
- **MCP Registry:** [io.github.Crumbedsausage/zuckerbot](https://github.com/modelcontextprotocol/servers)

## Development

```bash
git clone https://github.com/DatalisHQ/zuckerbot.git
cd zuckerbot
npm install
npm run build
npm start
```

## License

MIT — see [LICENSE](./LICENSE)
