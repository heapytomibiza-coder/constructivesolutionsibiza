export type JobLocation = {
  preset: string | null;
  area: string;
  town: string | null;
  custom: string | null;
  zone: string | null;
  notes: string | null;
};

export type JobAnswers = {
  selected: {
    mainCategory: string;
    subcategory: string | null;
    microNames: string[];
    microIds: string[];
    microSlugs: string[];
  };
  microAnswers: Record<string, unknown>;
  logistics: {
    location: string;
    customLocation: string | null;
    startDatePreset: string | null;
    startDate: string | null;
    completionDate: string | null;
    consultationType: "site_visit" | "phone_call" | "video_call" | string | null;
    consultationDate: string | null;
    consultationTime: string | null;
    budgetRange: string | null;
    accessDetails: string[];
  };
  extras: {
    photos: string[];
    notes: string | null;
    permitsConcern: boolean;
  };
  // Pack tracking metadata (optional, for analytics)
  _pack_source?: 'strong' | 'generic' | 'fallback';
  _pack_slug?: string | null;
  _pack_missing?: boolean;
};

export type JobsBoardRow = {
  id: string;
  title: string;
  teaser: string | null;
  category: string | null;
  subcategory: string | null;
  micro_slug: string | null;
  area: string | null;
  location: JobLocation | null;
  budget_type: "fixed" | "range" | "tbd" | string | null;
  budget_value: number | null;
  budget_min: number | null;
  budget_max: number | null;
  start_timing: "asap" | "this_week" | "this_month" | "flexible" | "date" | string | null;
  start_date: string | null;
  has_photos: boolean | null;
  highlights: string[];
  created_at: string;
  updated_at: string | null;
  status: string | null;
  is_publicly_listed: boolean | null;
  // Rules engine computed fields
  flags: string[] | null;
  computed_inspection_bias: string | null;
  computed_safety: string | null;
  // i18n columns
  source_lang: string | null;
  title_i18n: Record<string, string> | null;
  teaser_i18n: Record<string, string> | null;
};

export type JobDetailsRow = JobsBoardRow & {
  description: string | null;
  answers: JobAnswers | null;
  is_owner: boolean | null;
  description_i18n: Record<string, string> | null;
};

/* ── Quotes ────────────────────────────────── */

export type QuotePriceType = 'fixed' | 'estimate' | 'hourly';
export type QuoteStatus = 'submitted' | 'revised' | 'accepted' | 'rejected' | 'withdrawn';

export type QuoteLineItem = {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
};

export type Quote = {
  id: string;
  job_id: string;
  professional_id: string;
  price_type: QuotePriceType;
  price_fixed: number | null;
  price_min: number | null;
  price_max: number | null;
  hourly_rate: number | null;
  time_estimate_days: number | null;
  start_date_estimate: string | null;
  scope_text: string;
  exclusions_text: string | null;
  status: QuoteStatus;
  revision_number: number;
  vat_percent: number | null;
  subtotal: number | null;
  total: number | null;
  valid_until: string | null;
  notes: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  line_items?: QuoteLineItem[];
};
