# zuckerbot-mcp

**CLI + MCP server for ZuckerBot — run Facebook ad campaigns from your terminal or AI agent.**

Install one package and get both:

- `zuckerbot` for humans running campaigns from the terminal
- `zuckerbot-mcp` for MCP-compatible AI agents
- `zuckerbot serve` as an alternative way to start MCP server mode

The CLI and MCP server both use the same ZuckerBot API client, authentication, and endpoints.

## Quick Start

### Human CLI

```bash
npm install -g zuckerbot-mcp
export ZUCKERBOT_API_KEY=zb_live_your_key_here

zuckerbot preview https://example.com
zuckerbot create https://example.com --budget 2000 --objective leads
zuckerbot meta status
```

### Global install

```bash
npm install -g zuckerbot-mcp
```

After global install, these commands are available:

- `zuckerbot`
- `zuckerbot-mcp`
- `zuckerbot serve`

### MCP Server: Claude Desktop

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

### MCP Server: OpenClaw

```
/skill install zuckerbot
```

Or add to your OpenClaw config:

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

### MCP Server: npx (standalone)

```bash
ZUCKERBOT_API_KEY=zb_live_your_key_here npx zuckerbot-mcp
```

### MCP Server: global install

```bash
npm install -g zuckerbot-mcp
ZUCKERBOT_API_KEY=zb_live_your_key_here zuckerbot-mcp
ZUCKERBOT_API_KEY=zb_live_your_key_here zuckerbot serve
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ZUCKERBOT_API_KEY` | ✅ | — | Your ZuckerBot API key. Get one at [zuckerbot.ai/dashboard](https://zuckerbot.ai/dashboard). |
| `ZUCKERBOT_API_URL` | — | `https://zuckerbot.ai/api/v1` | API base URL (override for self-hosted or staging). |

## CLI Commands

| Command | Description |
|---------|-------------|
| `zuckerbot preview <url>` | Generate an ad preview from a business URL |
| `zuckerbot create <url>` | Create a full campaign with strategy, targeting, and creatives |
| `zuckerbot launch <campaign_id>` | Launch a draft campaign on Meta |
| `zuckerbot status <campaign_id>` | Get real-time campaign performance metrics |
| `zuckerbot pause <campaign_id>` | Pause a running campaign |
| `zuckerbot resume <campaign_id>` | Resume a paused campaign |
| `zuckerbot creatives <business_name> <description>` | Generate ad creatives |
| `zuckerbot conversion <campaign_id> <lead_id> <quality>` | Sync lead quality feedback to Meta |
| `zuckerbot research reviews <url>` | Review intelligence |
| `zuckerbot research competitors <category> <location>` | Competitor analysis |
| `zuckerbot research market <industry> <location>` | Market intelligence |
| `zuckerbot meta status` | Check Meta connection status |
| `zuckerbot meta accounts` | List Meta ad accounts |
| `zuckerbot meta select-account <ad_account_id>` | Select a Meta ad account |
| `zuckerbot meta pages` | List Facebook pages |
| `zuckerbot meta select-page <page_id>` | Select a Facebook page |
| `zuckerbot meta credentials` | Check stored launch credentials |
| `zuckerbot serve` | Start MCP server mode from the unified CLI |

## MCP Tools

| Tool | Description | Required Inputs |
|------|-------------|-----------------|
| `zuckerbot_quickstart` | Show demo/full mode status, setup steps, and the recommended tool flow | none |
| `zuckerbot_preview_campaign` | Generate ad preview from a URL (no Meta account needed) | `url` |
| `zuckerbot_create_campaign` | Create a legacy or intelligence campaign draft with strategy, targeting, and creatives | `url` |
| `zuckerbot_enrich_business` | Crawl a business website and cache structured context for intelligence planning | `business_id` |
| `zuckerbot_upload_business_context` | Upload text business context and extract structured insights | `business_id`, `filename`, `content` |
| `zuckerbot_list_business_context` | List uploaded business-context files and extracted summaries | `business_id` |
| `zuckerbot_get_campaign` | Get campaign detail, workflow state, stored creatives, and linked tier executions | `campaign_id` |
| `zuckerbot_approve_campaign_strategy` | Approve the generated tiers and creative angles for an intelligence campaign | `campaign_id` |
| `zuckerbot_request_creative` | Create or dispatch a creative handoff package for an intelligence campaign | `campaign_id` |
| `zuckerbot_upload_creative` | Upload finished creative assets and provision paused Meta executions | `campaign_id`, `creatives` |
| `zuckerbot_activate_campaign` | Activate the ready tiers for an intelligence campaign | `campaign_id` |
| `zuckerbot_suggest_angles` | Read a campaign draft and return the proposed creative angles and audience tiers | `campaign_id` |
| `zuckerbot_launch_campaign` | Launch one variant from a draft campaign on Meta (uses stored credentials when available) | `campaign_id` |
| `zuckerbot_launch_all_variants` | Launch all variants for A/B testing in one call | `campaign_id` |
| `zuckerbot_pause_campaign` | Pause or resume a live campaign | `campaign_id` |
| `zuckerbot_get_performance` | Get real-time campaign metrics | `campaign_id` |
| `zuckerbot_create_seed_audience` | Build a Meta custom audience from hashed CAPI users | `source_stage` |
| `zuckerbot_create_lookalike_audience` | Create a Meta lookalike from a stored seed audience | `seed_audience_id` |
| `zuckerbot_list_audiences` | List stored audience registry rows for a business | none |
| `zuckerbot_refresh_audience` | Refresh a stored audience or sync its latest state | `audience_id` |
| `zuckerbot_get_audience_status` | Fetch the latest Meta audience status and update the registry row | `audience_id` |
| `zuckerbot_delete_audience` | Delete a stored audience from Meta and ZuckerBot | `audience_id` |
| `zuckerbot_sync_conversion` | Send lead conversion feedback to Meta's algorithm | `campaign_id`, `lead_id`, `quality`, `meta_access_token` |
| `zuckerbot_research_reviews` | Get review intelligence for a business | `business_name` |
| `zuckerbot_research_competitors` | Analyze competitor ads in a category | `industry`, `location` |
| `zuckerbot_research_market` | Get market intelligence and ad benchmarks | `industry`, `location` |
| `zuckerbot_meta_status` | Check whether Meta is connected for this API key/user | none |
| `zuckerbot_list_ad_accounts` | List available Meta ad accounts and the current selection | none |
| `zuckerbot_select_ad_account` | Select/save a Meta ad account ID for future launches | `ad_account_id` |
| `zuckerbot_list_pixels` | List available Meta pixels for the selected ad account and the current selection | none |
| `zuckerbot_select_pixel` | Select/save a Meta pixel ID for future conversion tracking | `pixel_id` |
| `zuckerbot_list_meta_pages` | List available Facebook pages and current selected page | none |
| `zuckerbot_select_meta_page` | Select/save a Facebook page ID for future launches | `page_id` |
| `zuckerbot_get_launch_credentials` | Resolve stored launch credentials and report missing fields | none |
| `zuckerbot_generate_creatives` | Generate ad copy and creatives (images or Kling video) | `business_name`, `description` |
| `zuckerbot_capi_config` | Get or update the per-business CAPI configuration, including Meta `action_source` | none for read; config fields for update |
| `zuckerbot_capi_status` | Get 7-day and 30-day CAPI delivery and attribution status | none |
| `zuckerbot_capi_test` | Send a synthetic CAPI test event through the configured pipeline | none |
| `zuckerbot_create_portfolio` | Create a business-owned audience portfolio from a template | none |
| `zuckerbot_portfolio_performance` | Get tier-by-tier audience portfolio performance | `portfolio_id` |
| `zuckerbot_rebalance_portfolio` | Dry-run or apply a portfolio rebalance | `portfolio_id` |

For intelligence campaigns, the recommended flow is `create -> approve -> request/upload creative -> activate`.

Business context can also be refreshed independently through `zuckerbot_enrich_business`, `zuckerbot_upload_business_context`, and `zuckerbot_list_business_context`.

## Example Conversation

> **User:** Can you set up Facebook ads for my yoga studio? Website is serenity-yoga.com
>
> **Agent:** Let me research your business first…
> *(calls `zuckerbot_research_reviews` + `zuckerbot_research_competitors` in parallel)*
>
> Your studio has a 4.9-star rating with 89 reviews! Customers love the "calming atmosphere" and "expert instructors." Your competitors are running generic discount ads — none mention reviews or instructor credentials. That's your edge.
>
> Let me generate a preview of what your ads would look like…
> *(calls `zuckerbot_preview_campaign`)*
>
> Here are two ad concepts:
> 1. **"4.9 Stars, 89 Reviews"** — Leads with social proof. Your competitors aren't doing this.
> 2. **"First Class Free"** — Low-commitment offer to get people in the door.
>
> Want me to create a full campaign with targeting and budget recommendations?
>
> **User:** Yes. Budget is $15/day. Use the smarter flow if you can.
>
> *(calls `zuckerbot_create_campaign` with `mode: "auto"` and gets an intelligence draft)*
>
> **Agent:** The account has enough business context, so I created an intelligence draft. Best plan is:
> 1. Approve the broad local tier and the customer lookalike tier
> 2. Send two angles to creative production
> 3. Activate only the tiers that have finished assets
>
> *(calls `zuckerbot_approve_campaign_strategy`, then `zuckerbot_request_creative`)*
>
> **User:** Upload these finished assets and launch the ready tier.
>
> *(calls `zuckerbot_upload_creative`, then `zuckerbot_activate_campaign`)*
>
> **Agent:** The approved tier is live. I can monitor performance and sync lead quality back into Meta as conversions arrive.

## Typical Agent Flow

1. **Research** → `research_reviews` + `research_competitors` (parallel)
2. **Preview** → `preview_campaign` (show the user what ads look like)
3. **Create** → `create_campaign` (returns intelligence draft when a business can be resolved)
4. **Approve** → `approve_campaign_strategy`
5. **Creative** → `request_creative` or `upload_creative`
6. **Activate** → `activate_campaign`
7. **Monitor** → `get_performance`
8. **Optimize** → `sync_conversion` and audience tools as downstream signal volume grows

## Development

```bash
git clone https://github.com/DatalisHQ/zuckerbot.git
cd zuckerbot
npm install
npm run build
npm start
```

Human CLI development:

```bash
node dist/cli.js --help
node dist/cli.js preview https://example.com
node dist/cli.js serve
```

## API Documentation

Full API reference: [zuckerbot.ai/docs](https://zuckerbot.ai/docs)

## License

MIT — see [LICENSE](./LICENSE)
