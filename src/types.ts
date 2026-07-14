// ── ZuckerBot API Types ──────────────────────────────────────────────

/** Standard API error envelope */
export interface ApiError {
  error: {
    code: string;
    message: string;
    retry_after?: number;
  };
}

// ── Campaign types ───────────────────────────────────────────────────

export interface PreviewRequest {
  url: string;
  ad_count?: number;
}

export interface AdVariant {
  headline: string;
  copy: string;
  rationale: string;
  image_url?: string;
  image_base64?: string;
  cta?: string;
  angle?: string;
  image_prompt?: string | null;
}

export interface PreviewResponse {
  id: string;
  business_name: string;
  description?: string;
  ads: AdVariant[];
  enrichment?: Record<string, unknown>;
  created_at: string;
}

export interface LocationInput {
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export interface CampaignGoalsInput {
  target_monthly_leads?: number;
  target_cpl?: number;
  target_monthly_budget?: number;
  growth_multiplier?: number;
  markets_to_target?: string[];
  exclude_markets?: string[];
}

export interface CreativeHandoffInput {
  webhook_url?: string;
  callback_url?: string;
  product_focus?: string;
  font_preset?: string;
  market?: string;
  notes?: string;
  reference_urls?: string[];
  [key: string]: unknown;
}

export interface CreateCampaignRequest {
  url: string;
  business_id?: string;
  business_name?: string;
  business_type?: string;
  location?: LocationInput;
  budget_daily_cents?: number;
  objective?: "leads" | "traffic" | "conversions" | "awareness";
  mode?: "auto" | "legacy" | "intelligence";
  goals?: CampaignGoalsInput;
  creative_handoff?: CreativeHandoffInput;
}

export interface CampaignStrategy {
  objective: string;
  summary: string;
  strengths?: string[];
  opportunities?: string[];
  recommended_daily_budget_cents?: number | null;
  projected_cpl_cents?: number | null;
  projected_monthly_leads?: number | null;
}

export interface CampaignTargeting {
  age_min?: number;
  age_max?: number;
  radius_km?: number;
  interests?: string[];
  geo_locations?: Record<string, unknown>;
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
  custom_audiences?: Array<{ id: string }>;
}

export interface IntelligenceAudienceTier {
  tier_name: string;
  tier_type: "prospecting_broad" | "prospecting_lal" | "retargeting" | "reactivation";
  geo: string[];
  targeting_type: "broad" | "interest" | "lal" | "custom";
  targeting_details: string;
  age_min: number;
  age_max: number;
  daily_budget_cents: number;
  budget_pct: number;
  expected_cpl: number | null;
  rationale: string;
}

export interface IntelligenceCreativeAngle {
  angle_name: string;
  hook: string;
  message: string;
  cta: string;
  format: "video_ugc" | "video_reel" | "static_image" | "static_audio";
  rationale: string;
  variants_recommended: number;
}

export interface IntelligenceStrategyPayload {
  strategy_summary: string;
  audience_tiers: IntelligenceAudienceTier[];
  creative_angles: IntelligenceCreativeAngle[];
  total_daily_budget_cents: number;
  total_monthly_budget: number;
  projected_monthly_leads?: number | null;
  projected_cpl?: number | null;
  warnings: string[];
  phase_1_actions: string[];
  phase_2_actions: string[];
  phase_3_actions: string[];
}

export interface CampaignContextSummary {
  has_historical_data: boolean;
  has_crm_data: boolean;
  has_market_data: boolean;
  has_portfolio: boolean;
  has_web_context: boolean;
  has_uploaded_context: boolean;
  uploaded_context_count: number;
  web_context_age_days: number | null;
  months_of_data: number;
}

export interface AccountHistorySnapshot {
  business_id: string;
  lookback_days: number;
  is_cold_start: boolean;
  total_spend?: number;
  total_leads?: number;
  avg_cpl?: number;
  campaign_count?: number;
  by_objective?: Record<string, { spend: number; leads: number; cpl: number }>;
  by_audience_type?: Record<string, { spend: number; leads: number; cpl: number }>;
  by_creative_type?: Record<string, { spend: number; leads: number; ctr: number; cpl: number }>;
  comparable_historical_cpl?: {
    low: number;
    high: number;
    median: number;
    source: 'account_history' | 'industry_benchmarks';
    disclaimer: string;
  };
  industry_benchmarks?: {
    industry: string;
    avg_cpl_range: { low: number; high: number };
    avg_ctr_range: { low: number; high: number };
    source: string;
  };
  top_performing_creatives?: Array<{
    ad_id: string;
    ad_name: string;
    cpl: number;
    tags?: string[];
  }>;
}

export interface CreateCampaignResponse {
  id: string;
  status: string;
  campaign_version?: "legacy" | "intelligence";
  creative_status?: string;
  business_name?: string;
  business_type?: string;
  strategy?: CampaignStrategy;
  targeting?: CampaignTargeting;
  variants?: AdVariant[];
  roadmap?: Record<string, string[]>;
  audience_tiers?: IntelligenceAudienceTier[];
  creative_angles?: IntelligenceCreativeAngle[];
  total_daily_budget_cents?: number;
  total_monthly_budget?: number;
  projected_monthly_leads?: number | null;
  projected_cpl?: number | null;
  warnings?: string[];
  context_summary?: CampaignContextSummary;
  goals?: CampaignGoalsInput;
  creative_handoff?: CreativeHandoffInput | null;
  next_steps?: string[];
  created_at: string;
}

export interface CampaignCreativeInput {
  tier_name: string;
  asset_url: string;
  asset_type?: "image" | "video";
  headline: string;
  body: string;
  cta?: string;
  link_url?: string;
  angle_name?: string;
  variant_index?: number;
}

export interface ApiCampaignCreative {
  id: string;
  tier_name?: string | null;
  asset_url: string;
  asset_type?: "image" | "video" | string;
  headline?: string | null;
  body?: string | null;
  cta?: string | null;
  link_url?: string | null;
  angle_name?: string | null;
  variant_index?: number;
  api_campaign_id: string;
  business_id: string | null;
  user_id: string;
  meta_campaign_id?: string | null;
  meta_adset_id?: string | null;
  meta_ad_id?: string | null;
  meta_adcreative_id?: string | null;
  meta_image_hash?: string | null;
  meta_video_id?: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at?: string;
}

export interface AudienceTierCampaignExecution {
  id: string;
  portfolio_id: string;
  campaign_id: string;
  tier: string;
  meta_campaign_id?: string | null;
  meta_adset_id?: string | null;
  meta_audience_id?: string | null;
  daily_budget_cents?: number | null;
  status?: string | null;
  performance_data?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignDetailResponse {
  campaign: Record<string, unknown>;
  creatives: ApiCampaignCreative[];
  tier_campaigns: AudienceTierCampaignExecution[];
  fetched_at: string;
}

export interface LeadFormSummary {
  id: string;
  name: string;
  status?: string | null;
  leads_count: number;
  created_time?: string | null;
  questions?: unknown[] | null;
  selected?: boolean;
  is_selected?: boolean;
}

export interface LeadFormsListResponse {
  selected_page_id?: string | null;
  forms: LeadFormSummary[];
  selected_form_id?: string | null;
  form_count: number;
}

export interface SelectLeadFormResponse {
  selected_page_id?: string | null;
  selected_form_id: string;
  selected_form_name?: string;
  stored: boolean;
}

export interface CampaignInsightsMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  /** @deprecated Inflated surface lead count (action_type `lead`); double-counts the
   * instant-form lead and the MQL CAPI echo. Use `meta_leads` or `conversion_leads`. */
  leads: number;
  spend: number;
  /** @deprecated cost per inflated `leads`; use cost_per_meta_lead / cost_per_conversion_lead. */
  cpl: number | null;
  /** Deduped on-Meta leads (action_type `onsite_conversion.lead_grouped`) = Ads Manager "Meta Leads". */
  meta_leads?: number;
  cost_per_meta_lead?: number | null;
  /** CRM-qualified conversion leads (Meta `results` -> conversion_leads:conversion_lead) = "Conversion leads". */
  conversion_leads?: number;
  cost_per_conversion_lead?: number | null;
  /** Meta's authoritative per-campaign Result = the Ads Manager "Results" column, for
   * ANY objective (conversion_lead for lead campaigns; complete_registration / purchase
   * for sales/PLG). Deduped, view-through included. The engine's truth metric. */
  meta_result?: number;
  /** The result action_type behind `meta_result` (e.g. "conversion_lead",
   * "offsite_conversion.fb_pixel_complete_registration"). */
  meta_result_type?: string | null;
  cost_per_meta_result?: number | null;
  /** Full labelled Meta actions array, intact: counts per action_type. */
  actions?: Array<{ action_type: string; value: number }>;
  /** Cost per action type (spend / value per action_type, in dollars), labelled. */
  cost_per_action_type?: Array<{ action_type: string; value: number }>;
  /** @deprecated Resolved from the actions array by highest-intent ordering; mis-ranks
   * mixed campaigns and equals the inflated `lead` for lead campaigns. Use meta_result. */
  results?: number;
  /** @deprecated use cost_per_meta_result. */
  cost_per_result?: number | null;
  /** @deprecated use meta_result_type. */
  result_type?: string | null;
  /** @deprecated */
  result_label?: string | null;
  ctr: number;
  cpc: number | null;
  cpm: number | null;
  frequency: number | null;
}

export interface CampaignInsightsBreakdownRow {
  date_start: string | null;
  date_stop: string | null;
  metrics: CampaignInsightsMetrics;
}

export interface CampaignInsightsAd {
  id: string;
  name: string | null;
  metrics: CampaignInsightsMetrics;
  video_metrics?: {
    avg_time_watched: number | null;
    p25_watched: number;
    p50_watched: number;
    p75_watched: number;
    p100_watched: number;
  } | null;
  daily_breakdown?: CampaignInsightsBreakdownRow[];
}

export interface CampaignInsightsAdset {
  id: string;
  name: string | null;
  metrics: CampaignInsightsMetrics;
  daily_breakdown?: CampaignInsightsBreakdownRow[];
  ads?: CampaignInsightsAd[];
}

export interface CampaignInsightsCampaign {
  id: string;
  name: string | null;
  status: string | null;
  effective_status: string | null;
  objective: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  created_time: string | null;
  is_zuckerbot: boolean;
  zb_campaign_id: string | null;
  metrics: CampaignInsightsMetrics;
  daily_breakdown?: CampaignInsightsBreakdownRow[];
  adsets?: CampaignInsightsAdset[];
}

export interface CampaignInsightsResult {
  id: string;
  name: string | null;
  status: string | null;
  effective_status: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  is_zuckerbot: boolean;
  zb_campaign_id: string | null;
  campaign_id?: string;
  campaign_name?: string | null;
  adset_id?: string;
  adset_name?: string | null;
  insights: CampaignInsightsMetrics;
  video_metrics?: {
    avg_time_watched: number | null;
    p25_watched: number;
    p50_watched: number;
    p75_watched: number;
    p100_watched: number;
  } | null;
}

export interface CampaignInsightsResponse {
  business_id: string;
  ad_account_id: string;
  date_from: string;
  date_to: string;
  level: "campaign" | "adset" | "ad";
  time_increment: "daily" | "monthly" | null;
  results: CampaignInsightsResult[];
  total_results: number;
  summary: {
    total_campaigns: number;
    total_spend: number;
    /** @deprecated blended over the inflated `leads`; prefer total_meta_leads / total_conversion_leads. */
    total_leads: number;
    /** @deprecated cost per inflated `leads`. */
    blended_cpl: number | null;
    total_meta_leads?: number;
    blended_cost_per_meta_lead?: number | null;
    total_conversion_leads?: number;
    blended_cost_per_conversion_lead?: number | null;
    total_meta_result?: number;
    blended_cost_per_meta_result?: number | null;
    meta_result_type?: string | null;
    /** @deprecated use total_meta_result. */
    total_results?: number;
    blended_cost_per_result?: number | null;
    result_type?: string | null;
    result_label?: string | null;
    blended_ctr: number;
  };
  campaigns: CampaignInsightsCampaign[];
  fetched_at: string;
}

export interface ApproveCampaignStrategyRequest {
  campaign_id: string;
  tier_names?: string[];
  angle_names?: string[];
}

export interface RequestCreativeRequest {
  campaign_id: string;
  creative_handoff?: CreativeHandoffInput;
}

export interface UploadCampaignCreativeRequest {
  campaign_id: string;
  creatives: CampaignCreativeInput[];
  meta_access_token?: string;
  meta_ad_account_id?: string;
  meta_page_id?: string;
}

export interface ActivateCampaignRequest {
  campaign_id: string;
  tier_names?: string[];
  meta_access_token?: string;
  meta_ad_account_id?: string;
  meta_page_id?: string;
}

export interface LaunchCampaignRequest {
  campaign_id: string;
  meta_access_token?: string;
  meta_ad_account_id?: string;
  meta_page_id?: string;
  variant_index?: number;
  daily_budget_cents?: number;
  radius_km?: number;
  launch_all_variants?: boolean;
}

export interface LaunchCampaignResponse {
  id: string;
  status: string;
  meta_campaign_id: string;
  meta_adset_id: string;
  meta_ad_id: string;
  meta_leadform_id?: string;
  daily_budget_cents: number;
  launched_at: string;
}

export interface PauseCampaignRequest {
  campaign_id: string;
  action?: "pause" | "resume";
}

export interface PerformanceMetrics {
  impressions: number;
  clicks: number;
  spend_cents: number;
  leads_count: number;
  cpl_cents: number | null;
  // Objective-aware canonical result (equals leads for lead campaigns).
  results_count?: number;
  cost_per_result_cents?: number | null;
  result_type?: string | null;
  result_label?: string | null;
  ctr_pct: number;
}

export interface PerformanceDailyBreakdown extends PerformanceMetrics {
  date: string;
  reach: number;
  frequency: number | null;
}

export interface PerformanceAdBreakdown {
  creative_id: string;
  meta_ad_id: string;
  tier_name: string | null;
  headline: string | null;
  asset_type: string | null;
  status: string;
  effective_status: string | null;
  performance_status: string;
  metrics: PerformanceMetrics & {
    reach: number;
    frequency: number | null;
    cpc_cents: number | null;
  };
  raw_actions: Array<{
    action_type: string;
    value: number;
  }>;
  video_metrics?: {
    avg_time_watched: number | null;
    p25_watched: number;
    p50_watched: number;
    p75_watched: number;
    p100_watched: number;
  } | null;
  daily_breakdown: PerformanceDailyBreakdown[];
  fetch_error?: {
    code: string;
    message: string;
    retry_after?: number | null;
  };
}

export interface PerformanceTierBreakdown {
  tier_campaign_id: string;
  tier: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  daily_budget_cents: number;
  status: string;
  effective_status: string | null;
  performance_status: string;
  metrics: PerformanceMetrics & {
    reach: number;
    frequency: number | null;
    cpc_cents: number | null;
  };
  capi_attribution: {
    lead_conversions: number;
    sql_conversions: number;
    customer_conversions: number;
  };
  daily_breakdown: PerformanceDailyBreakdown[];
  ads: PerformanceAdBreakdown[];
}

export interface RecommendedPerformanceAction {
  type: "pause_campaign" | "reduce_budget" | "increase_budget" | "refresh_creative";
  target: string;
  reason: string;
  urgency: "medium" | "high" | "critical";
}

export interface PerformanceResponse {
  campaign_id: string;
  status: string;
  performance_status: string;
  campaign_version?: "legacy" | "intelligence";
  metrics: PerformanceMetrics;
  summary?: PerformanceMetrics & {
    reach: number;
    frequency: number | null;
    cpc_cents: number | null;
    target_cpl_cents: number;
    meta_leads_count: number;
    capi_lead_conversions: number;
    capi_sql_conversions: number;
    capi_customer_conversions: number;
  };
  tiers?: PerformanceTierBreakdown[];
  daily_breakdown?: PerformanceDailyBreakdown[];
  capi_attribution?: {
    lead_conversions: number;
    sql_conversions: number;
    customer_conversions: number;
    by_tier: Array<{
      tier_campaign_id: string;
      tier: string | null;
      campaign_id: string | null;
      lead_conversions: number;
      sql_conversions: number;
      customer_conversions: number;
    }>;
  };
  hours_since_launch: number;
  last_synced_at: string;
  recommended_actions?: RecommendedPerformanceAction[];
  warnings?: string[];
}

export interface PortfolioPerformanceRow {
  tier_campaign_id?: string | null;
  tier: string | null;
  description: string | null;
  budget_pct: number;
  target_cpa_multiplier: number;
  target_cpa_cents: number;
  campaign_id: string | null;
  campaign_name?: string | null;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  daily_budget_cents: number;
  spend_cents: number;
  lead_conversions: number;
  sql_conversions: number;
  customer_conversions: number;
  selected_metric: string;
  selected_conversions: number;
  selected_cpa: number | null;
  status: string;
  performance_data?: Record<string, unknown> | null;
  impressions?: number;
  reach?: number;
  clicks?: number;
  ctr_pct?: number;
  frequency?: number | null;
  cpl_cents?: number | null;
  performance_status?: string;
  effective_status?: string | null;
  capi_attribution?: {
    lead_conversions: number;
    sql_conversions: number;
    customer_conversions: number;
  };
  daily_breakdown?: PerformanceDailyBreakdown[];
  ads?: PerformanceAdBreakdown[];
}

export interface PortfolioPerformanceSnapshot {
  business_id: string;
  optimise_for: string;
  base_target_cpa_cents: number;
  portfolio_budget_cents: number;
  metrics?: PerformanceMetrics;
  performance_status?: string;
  rows: PortfolioPerformanceRow[];
  summary: {
    tiers: number;
    active_tiers: number;
    spend_cents: number;
    lead_conversions: number;
    sql_conversions: number;
    customer_conversions: number;
    impressions?: number;
    reach?: number;
    clicks?: number;
    ctr_pct?: number;
    frequency?: number | null;
    cpl_cents?: number | null;
    capi_attribution?: PerformanceResponse["capi_attribution"];
  };
  daily_breakdown?: PerformanceDailyBreakdown[];
  capi_attribution?: PerformanceResponse["capi_attribution"];
  last_synced_at?: string;
  warnings?: string[];
}

export interface PortfolioPerformanceResponse {
  portfolio_id: string;
  performance: PortfolioPerformanceSnapshot;
  fetched_at: string;
}

export interface CreativeTagRequest {
  business_id: string;
  ads: Array<{
    meta_ad_id: string;
    meta_ad_name?: string;
    meta_campaign_id?: string;
    meta_adset_id?: string;
    creative_type: "video" | "image" | "carousel" | "static";
    thumbnail_url?: string;
    video_url?: string;
    ad_copy?: string;
    headline?: string;
    cta_text?: string;
    frame_urls?: string[];
  }>;
}

export interface CreativeAnalysisResponse {
  business_id: string;
  group_by: "hook_type" | "visual_style" | "product_focus" | "setting" | "cta_type" | "copy_tone" | "opening_element";
  metric: "cpl" | "ctr" | "cpc" | "frequency";
  date_range: { from: string | null; to: string | null };
  results: Array<{
    value: string;
    avg_cpl: number | null;
    avg_ctr: number | null;
    avg_cpc: number | null;
    avg_frequency: number | null;
    total_spend: number;
    total_leads: number;
    total_clicks: number;
    total_impressions: number;
    ad_count: number;
    trend: "improving" | "declining" | "stable" | "insufficient_data";
    trend_delta_pct: number | null;
  }>;
  insight: {
    summary: string;
    recommendations: Array<{
      action: "scale" | "test" | "kill" | "iterate";
      target: string;
      reason: string;
      confidence: "high" | "medium" | "low";
    }>;
    fatigue_warning: string | null;
    sample_size_warning: string | null;
  };
  top_ads?: Array<{
    meta_ad_id: string;
    meta_ad_name: string | null;
    hook_type: string | null;
    visual_style: string | null;
    spend: number;
    leads: number;
    cpl: number | null;
    ctr: number | null;
    cpc: number | null;
    frequency: number | null;
  }>;
  bottom_ads?: Array<{
    meta_ad_id: string;
    meta_ad_name: string | null;
    hook_type: string | null;
    visual_style: string | null;
    spend: number;
    leads: number;
    cpl: number | null;
    ctr: number | null;
    cpc: number | null;
    frequency: number | null;
  }>;
}

export interface CreativeCrossAnalysisResponse {
  business_id: string;
  group_by: "hook_type" | "visual_style" | "product_focus" | "setting" | "cta_type" | "copy_tone" | "opening_element";
  cross_by: "hook_type" | "visual_style" | "product_focus" | "setting" | "cta_type" | "copy_tone" | "opening_element";
  metric: "cpl" | "ctr" | "cpc" | "frequency";
  matrix: Array<{
    group: string;
    cross: string;
    avg_cpl: number | null;
    avg_ctr: number | null;
    avg_cpc: number | null;
    avg_frequency: number | null;
    total_spend: number;
    total_leads: number;
    total_clicks: number;
    total_impressions: number;
    ad_count: number;
  }>;
  best_combination: {
    group: string;
    cross: string;
    metric_value: number | null;
  } | null;
  worst_combination: {
    group: string;
    cross: string;
    metric_value: number | null;
  } | null;
  insight: string;
}

export interface GenerateCreativeBriefsRequest {
  business_id: string;
  count?: number;
  bias?: string;
  exclude_angles?: string[];
  target_market?: string;
  font_preset?: string;
  metric?: "cpl" | "ctr" | "cpc" | "frequency";
}

export interface CreativeQaRequest {
  business_id: string;
  creatives: Array<{
    creative_type: "video" | "image" | "carousel" | "static";
    thumbnail_url?: string;
    video_url?: string;
    asset_url?: string;
    ad_copy?: string;
    headline?: string;
    cta_text?: string;
    frame_urls?: string[];
  }>;
}

// ── Audience types ───────────────────────────────────────────────────

export interface FacebookAudienceRecord {
  id: string;
  business_id: string;
  audience_id: string;
  audience_name: string;
  audience_type: string;
  audience_size?: number | null;
  description?: string | null;
  seed_source_stage?: string | null;
  lookback_days?: number | null;
  lookalike_pct?: number | null;
  seed_audience_id?: string | null;
  delivery_status?: string | null;
  raw_data?: Record<string, unknown> | null;
  last_refreshed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSeedAudienceRequest {
  business_id?: string;
  source_stage: string;
  name?: string;
  lookback_days?: number;
  min_contacts?: number;
}

export interface CreateLookalikeAudienceRequest {
  seed_audience_id: string;
  percentage?: number;
  name?: string;
  country?: string;
}

export interface RefreshAudienceRequest {
  audience_id: string;
}

// ── Conversion types ─────────────────────────────────────────────────

export interface UserData {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}

export interface SyncConversionRequest {
  campaign_id: string;
  lead_id: string;
  quality: "good" | "bad";
  meta_access_token: string;
  user_data?: UserData;
}

export interface SyncConversionResponse {
  success: boolean;
  capi_sent: boolean;
  events_received: number;
  quality: string;
  lead_id: string;
}

// ── Research types ───────────────────────────────────────────────────

export interface ResearchReviewsRequest {
  business_name: string;
  location?: string;
}

export interface ResearchReviewsResponse {
  business_name: string;
  rating: number;
  review_count: number;
  themes: string[];
  best_quotes: string[];
  sentiment_breakdown?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sources: string[];
}

export interface ResearchCompetitorsRequest {
  industry: string;
  location: string;
  country?: string;
}

export interface ResearchCompetitorsResponse {
  competitor_ads: Array<{
    page_name: string;
    ad_body_text: string;
    started_running_date?: string;
    platforms?: string;
  }>;
  insights: {
    summary: string;
    common_hooks: string[];
    gaps: string[];
    opportunity: string;
  };
  ad_count: number;
}

export interface ResearchMarketRequest {
  industry: string;
  location: string;
}

// ── Creatives types ──────────────────────────────────────────────────

export interface GenerateCreativesRequest {
  business_name: string;
  description: string;
  count?: number;
  model?: "auto" | "seedream" | "imagen" | "kling";
  media_type?: "image" | "video";
  quality?: "fast" | "ultra";
  generate_images?: boolean;
}

export interface GenerateCreativesResponse {
  creatives: AdVariant[];
}
