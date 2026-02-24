import type { JobDetailsRow, JobAnswers, JobLocation } from "../types";
import {
  extractMicroAnswers,
  buildAnswerLookups,
  resolveAnswerValue,
  LOCATION_LABELS,
  type QuestionPack,
} from "./answerResolver";

/**
 * A resolved answer with human-readable label and value.
 * Keeps both raw value (for matching/analytics) and display value (for UI).
 */
export interface ResolvedAnswer {
  questionId: string;
  questionLabel: string;
  rawValue: string | string[];
  displayValue: string;
}

/**
 * A resolved service pack with all answers formatted for display.
 */
export interface ResolvedServicePack {
  slug: string;
  title: string;
  answers: ResolvedAnswer[];
  /** True when using fallback labels (packs not loaded) */
  isFallback?: boolean;
}

/**
 * The canonical display model for a job.
 * UI components should render this, never raw JobDetailsRow.
 */
export interface JobPack {
  id: string;
  title: string;
  teaser: string | null;
  category: string;
  subcategory: string | null;
  microSlug: string | null;
  
  // Resolved service packs with human-readable answers
  services: ResolvedServicePack[];
  
  // Location info
  location: {
    area: string;
    town: string | null;
    display: string;
  };
  
  // Timing info
  timing: {
    preset: string;
    date: string | null;
    display: string;
  };
  
  // Budget info
  budget: {
    type: "fixed" | "range" | "tbd" | string;
    value: number | null;
    min: number | null;
    max: number | null;
    display: string;
  };
  
  // Attachments
  photos: string[];
  hasPhotos: boolean;
  
  // Extras
  notes: string | null;
  permitsConcern: boolean;
  
  // Status & metadata
  status: string;
  highlights: string[];
  isOwner: boolean;
  createdAt: string;
  updatedAt: string | null;
  
  // Rules engine computed flags
  flags: string[];
  inspectionBias: string | null;
  safety: string | null;
  
  // i18n translations
  sourceLang: string | null;
  titleI18n: Record<string, string> | null;
  teaserI18n: Record<string, string> | null;
  descriptionI18n: Record<string, string> | null;
}

/** Optional translation function passed from React callers */
type TFn = (key: string, opts?: Record<string, unknown>) => string;

// Budget range display mapping
const BUDGET_DISPLAY: Record<string, string> = {
  'under_500': 'Under 500 €',
  '500_1000': '500–1,000 €',
  '1000_2500': '1,000–2,500 €',
  '2500_5000': '2,500–5,000 €',
  'over_5000': 'Over 5,000 €',
  'need_quote': 'Quote needed',
};

/**
 * Format budget for display.
 */
function formatBudget(row: JobDetailsRow, answers: JobAnswers | null, t?: TFn): string {
  // First check if we have structured budget data
  if (row.budget_type === "fixed" && row.budget_value != null) {
    return `${row.budget_value.toLocaleString()} €`;
  }
  if (row.budget_type === "range" && row.budget_min != null && row.budget_max != null) {
    return `${row.budget_min.toLocaleString()} – ${row.budget_max.toLocaleString()} €`;
  }
  
  // Check for budget range from wizard answers and humanize it
  if (answers?.logistics?.budgetRange) {
    const raw = answers.logistics.budgetRange;
    const BUDGET_KEYS: Record<string, string> = {
      'under_500': 'card.under500',
      '500_1000': 'card.500_1000',
      '1000_2500': 'card.1000_2500',
      '2500_5000': 'card.2500_5000',
      'over_5000': 'card.over5000',
      'need_quote': 'card.quoteNeeded',
    };
    const key = BUDGET_KEYS[raw];
    if (key && t) return t(key);
    if (key) {
      // Fallback English labels when t is not available
      const BUDGET_FALLBACK: Record<string, string> = {
        'under_500': 'Under 500 €',
        '500_1000': '500–1,000 €',
        '1000_2500': '1,000–2,500 €',
        '2500_5000': '2,500–5,000 €',
        'over_5000': 'Over 5,000 €',
        'need_quote': 'Quote needed',
      };
      return BUDGET_FALLBACK[raw] ?? raw.replace(/_/g, ' ');
    }
    return raw.replace(/_/g, ' ');
  }
  
  return t?.('card.tbd') ?? 'TBD';
}

/**
 * Format timing for display.
 */
function formatTiming(preset: string | null, date: string | null, t?: TFn): string {
  if (preset === "asap") return t?.('board.asap') ?? 'ASAP';
  if (preset === "this_week") return t?.('card.thisWeek') ?? 'This week';
  if (preset === "this_month") return t?.('card.thisMonth') ?? 'This month';
  if (preset === "flexible") return t?.('card.flexible') ?? 'Flexible';
  if ((preset === "specific" || preset === "date") && date) {
    return t?.('card.start', { date }) ?? `Start: ${date}`;
  }
  if (date) return t?.('card.start', { date }) ?? `Start: ${date}`;
  return t?.('card.flexible') ?? 'Flexible';
}

/**
 * Format location for display.
 */
function formatLocationDisplay(
  location: JobLocation | null,
  logistics: JobAnswers["logistics"] | null,
  area: string | null,
  t?: TFn
): string {
  const customLabel = t?.('detail.customLocation') ?? 'Custom location';

  // Try logistics location first (wizard data)
  if (logistics?.location) {
    if (logistics.location === "other") {
      return logistics.customLocation || customLabel;
    }
    return LOCATION_LABELS[logistics.location] || logistics.location;
  }
  
  // Fall back to location object
  if (location?.preset) {
    if (location.preset === "other") {
      return location.custom || customLabel;
    }
    return LOCATION_LABELS[location.preset] || location.preset;
  }
  
  // Fall back to area
  if (location?.area) {
    return LOCATION_LABELS[location.area] || location.area;
  }
  
  return area || "Ibiza";
}

/**
 * Parse answers safely.
 */
function safeAnswers(a: unknown): JobAnswers | null {
  if (!a || typeof a !== "object") return null;
  const obj = a as Record<string, unknown>;
  if (!("selected" in obj) || !("logistics" in obj) || !("extras" in obj)) return null;
  return a as JobAnswers;
}

/**
 * Build fallback service packs when question packs aren't loaded yet.
 * Uses question IDs as labels and raw values as display values.
 */
function buildFallbackServicePacks(
  microAnswers: Record<string, Record<string, unknown>>
): ResolvedServicePack[] {
  return Object.entries(microAnswers).map(([slug, answers]) => ({
    slug,
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    isFallback: true,
    answers: Object.entries(answers)
      .filter(([k]) => !k.startsWith("_"))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([questionId, v]) => {
        const rawValue = Array.isArray(v) ? v.map(String) : String(v);
        const displayValue = Array.isArray(v) ? v.map(String).join(", ") : String(v);
        return {
          questionId,
          questionLabel: questionId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          rawValue,
          displayValue,
        };
      }),
  }));
}

/**
 * Resolve micro answers to service packs using question pack definitions.
 */
export function resolveServicePacks(
  microAnswers: Record<string, Record<string, unknown>>,
  packs: QuestionPack[]
): ResolvedServicePack[] {
  if (!packs.length) {
    return buildFallbackServicePacks(microAnswers);
  }

  const { questionLabels, optionLabels } = buildAnswerLookups(packs);
  
  const result: ResolvedServicePack[] = [];
  
  for (const pack of packs) {
    const answers = microAnswers[pack.micro_slug];
    if (!answers) continue;
    
    const qLabels = questionLabels.get(pack.micro_slug);
    const oLabels = optionLabels.get(pack.micro_slug);
    
    const resolvedAnswers: ResolvedAnswer[] = [];
    
    const entries = Object.entries(answers)
      .filter(([k]) => !k.startsWith("_"))
      .sort(([a], [b]) => a.localeCompare(b));
    
    for (const [questionId, value] of entries) {
      const questionLabel = qLabels?.get(questionId) || questionId;
      const questionOptionLabels = oLabels?.get(questionId);
      const displayValue = resolveAnswerValue(value, questionOptionLabels);
      const rawValue = Array.isArray(value) ? value.map(String) : String(value);
      
      resolvedAnswers.push({
        questionId,
        questionLabel,
        rawValue,
        displayValue,
      });
    }
    
    if (resolvedAnswers.length > 0) {
      result.push({
        slug: pack.micro_slug,
        title: pack.title,
        answers: resolvedAnswers,
      });
    }
  }
  
  return result;
}

/**
 * Build a display-ready JobPack from a JobDetailsRow and question packs.
 * 
 * @param row - The raw job details from the database
 * @param packs - Question pack definitions for resolving answer labels
 * @param t - Optional i18n translation function for localized display strings
 * @returns A fully resolved JobPack ready for UI rendering
 */
export function buildJobPack(row: JobDetailsRow, packs: QuestionPack[] = [], t?: TFn): JobPack {
  const answers = safeAnswers(row.answers);
  const logistics = answers?.logistics ?? null;
  const extras = answers?.extras ?? null;
  const location = row.location as JobLocation | null;
  
  // Extract and resolve micro answers
  const microAnswers = extractMicroAnswers(answers?.microAnswers as Record<string, unknown> | null);
  const services = resolveServicePacks(microAnswers, packs);
  
  // Build timing display
  const timingPreset = logistics?.startDatePreset ?? row.start_timing ?? "flexible";
  const timingDate = logistics?.startDate ?? row.start_date ?? null;
  
  return {
    id: row.id,
    title: row.title ?? "Job Request",
    teaser: row.teaser ?? null,
    category: row.category ?? "General",
    subcategory: row.subcategory ?? null,
    microSlug: row.micro_slug ?? null,
    
    services,
    
    location: {
      area: location?.area ?? row.area ?? "Ibiza",
      town: location?.town ?? null,
      display: formatLocationDisplay(location, logistics, row.area, t),
    },
    
    timing: {
      preset: timingPreset,
      date: timingDate,
      display: formatTiming(timingPreset, timingDate, t),
    },
    
    budget: {
      type: row.budget_type ?? "tbd",
      value: row.budget_value ?? null,
      min: row.budget_min ?? null,
      max: row.budget_max ?? null,
      display: formatBudget(row, answers, t),
    },
    
    photos: extras?.photos ?? [],
    hasPhotos: row.has_photos ?? false,
    
    notes: extras?.notes ?? null,
    permitsConcern: extras?.permitsConcern ?? false,
    
    status: row.status ?? "open",
    highlights: row.highlights ?? [],
    isOwner: row.is_owner ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    
    // Rules engine computed flags
    flags: row.flags ?? [],
    inspectionBias: row.computed_inspection_bias ?? null,
    safety: row.computed_safety ?? null,
    
    // i18n translations
    sourceLang: (row as any).source_lang ?? null,
    titleI18n: (row as any).title_i18n ?? null,
    teaserI18n: (row as any).teaser_i18n ?? null,
    descriptionI18n: (row as any).description_i18n ?? null,
  };
}
