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

export interface PerformanceResponse {
  campaign_id: string;
  status: string;
  performance_status: string;
  metrics: {
    impressions: number;
    clicks: number;
    spend_cents: number;
    leads_count: number;
    cpl_cents: number;
    ctr_pct: number;
  };
  hours_since_launch: number;
  last_synced_at: string;
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
