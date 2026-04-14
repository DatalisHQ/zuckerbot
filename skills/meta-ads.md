# ZuckerBot — Meta Ads Skill

You have access to ZuckerBot, a 50-tool Meta Ads MCP server. This skill teaches you how to use it effectively.

## Before Anything Else

Always call `meta_status` first to verify the user's Meta connection is active. If disconnected, guide them to reconnect. Never attempt campaign operations on a disconnected account.

## Tool Decision Tree

**User asks about performance/metrics:**
→ `get_performance` (campaign-level) + `creative_analysis` (creative-level)

**User wants to launch ads:**
→ Follow the full workflow below (Research → Preview → Create → Approve → Creative → Activate)

**User asks about audiences:**
→ `list_audiences` to see what exists, then `create_seed_audience` or `create_lookalike_audience`

**User wants to research before spending:**
→ `research_reviews` + `research_competitors` + `research_market` (run in parallel)

**User asks about tracking/conversions:**
→ `capi_status` to check health, `capi_config` to update, `capi_test` to verify

**User mentions a website/URL:**
→ `enrich_business` first (caches business context), then `preview_campaign` to show what ads would look like

**User is new or says "get started":**
→ `quickstart` — it walks through everything

## The Recommended Workflow

### 1. Research (parallel)
Run these simultaneously to build context:
- `research_reviews` — what customers say about the business
- `research_competitors` — what competitors are running
- `research_market` — industry benchmarks and CPL/CPA expectations

Share findings with the user before proceeding. This sets realistic expectations.

### 2. Preview
- `preview_campaign` with the business URL
- Show the user what their ads would look like — no Meta account needed
- This builds confidence before committing budget

### 3. Create
- `create_campaign` with strategy, targeting, budget, and objective
- This creates a **draft** — nothing goes live yet
- The tool returns tiered targeting and creative angles

### 4. Approve
- Show the user the strategy tiers and angles from the draft
- `approve_campaign_strategy` once they confirm
- If they want changes, modify and re-present

### 5. Creative
- `generate_creatives` for AI-generated copy and images
- OR `request_creative` to create a handoff package for designers
- OR `upload_creative` if the user has their own assets
- Check progress with `get_creative_status`
- Run `creative_qa` to check Meta ad policy compliance before launch

### 6. Activate
- `activate_campaign` to begin ad delivery
- OR `launch_campaign` to launch specific variants
- Confirm budget one more time before activating

### 7. Monitor
- `get_performance` for metrics (spend, leads, CPL, CTR, ROAS)
- `creative_analysis` for AI-powered creative insights
- Check daily for the first week, then adjust cadence

### 8. Optimise
- `sync_conversion` to feed lead quality data back to Meta
- `pause_campaign` to stop underperformers
- `rebalance_portfolio` to shift budget to winners
- `create_lookalike_audience` from your best converters

## Common Patterns

### "How are my ads doing?"
```
1. get_performance (all campaigns, last 7 days)
2. creative_analysis (top and bottom performers)
3. Summarise: what's working, what's not, what to do next
```

### "I want to run ads for [URL]"
```
1. enrich_business (crawl the URL)
2. research_reviews + research_competitors (parallel)
3. preview_campaign (show them the preview)
4. Discuss strategy, then create_campaign
```

### "Create a lookalike audience"
```
1. list_audiences (check for existing seed audiences)
2. If no seed: create_seed_audience from CAPI data
3. create_lookalike_audience (1-3% usually works best)
4. get_audience_status to confirm it's ready
```

### "Set up conversion tracking"
```
1. list_pixels (find/select the right pixel)
2. capi_config (configure server-side tracking)
3. capi_test (send a test event)
4. capi_status (verify events are flowing)
```

### Portfolio management
```
1. create_portfolio (from a template)
2. launch_portfolio (activate all campaigns)
3. portfolio_performance (check tier-by-tier results)
4. rebalance_portfolio (dry-run first, then apply)
```

## Important Tips

1. **Always research first.** Users get better results when you show them competitor data and benchmarks before creating campaigns. It takes 30 seconds and sets the right expectations.

2. **Follow the hints.** Every tool response includes a `_hint` field suggesting the logical next step. Use it — it's context-aware.

3. **Check `meta_status` before Meta operations.** If the connection is stale or expired, nothing will work. Verify early.

4. **Draft before launch.** Always create campaigns as drafts. Show the user the strategy and get approval before spending their money.

5. **Run `creative_qa` before launch.** Meta rejects ads that violate policies. Catching issues before submission saves time and frustration.

6. **Use parallel calls.** Research tools (`research_reviews`, `research_competitors`, `research_market`) are independent — run them simultaneously.

7. **Portfolio thinking.** For serious advertisers, use portfolios to manage multiple campaigns as a unit. `rebalance_portfolio` with dry-run shows what would change before committing.

8. **CAPI improves over time.** Conversion tracking gets smarter as more events flow through. Encourage users to set it up even if they're just testing.

9. **Budget safety.** Always confirm budget amounts with the user before `activate_campaign` or `launch_campaign`. Never assume.

10. **Creative iteration.** Use `creative_analysis` to identify winning patterns, then `generate_briefs` to create briefs based on what's actually working.

## Tool Categories Quick Reference

| Category | Tools | When to use |
|----------|-------|-------------|
| Setup | `quickstart`, `meta_status`, `list_ad_accounts`, `select_ad_account`, `list_meta_pages`, `select_meta_page`, `get_launch_credentials` | First-time setup, connection issues |
| Campaigns | `preview_campaign`, `create_campaign`, `get_campaign`, `approve_campaign_strategy`, `suggest_angles`, `activate_campaign`, `launch_campaign`, `pause_campaign`, `get_performance` | Core campaign lifecycle |
| Audiences | `create_seed_audience`, `create_lookalike_audience`, `list_audiences`, `refresh_audience`, `get_audience_status`, `delete_audience` | Targeting and audience building |
| Creatives | `generate_creatives`, `request_creative`, `upload_creative`, `get_creative_status`, `creative_analysis`, `creative_qa`, `generate_briefs` | Ad content and creative management |
| CAPI | `capi_config`, `capi_status`, `capi_test`, `sync_conversion`, `list_pixels` | Conversion tracking |
| Portfolios | `create_portfolio`, `launch_portfolio`, `portfolio_performance`, `rebalance_portfolio` | Multi-campaign management |
| Research | `research_reviews`, `research_competitors`, `research_market` | Pre-campaign intelligence |
| Business | `enrich_business`, `upload_business_context`, `list_business_context`, `select_lead_form` | Business context and lead forms |
