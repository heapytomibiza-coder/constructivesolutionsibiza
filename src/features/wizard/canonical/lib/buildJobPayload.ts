/**
 * Job Payload Builder
 * Transforms wizard state into database insert format
 * V2: Fully type-safe using TablesInsert<"jobs">
 */

import type { TablesInsert, Json } from '@/integrations/supabase/types';
import type { WizardState } from '../types';
import { getZoneByIdSafe } from '@/shared/components/professional/zones';

type JobInsert = TablesInsert<"jobs">;

/**
 * Location preset to area/town mapping
 * Area-safe: no addresses, just broad location info
 */
const LOCATION_MAP: Record<string, { area: string; town?: string }> = {
  ibiza_town: { area: "Ibiza Town", town: "Eivissa" },
  san_antonio: { area: "San Antonio", town: "Sant Antoni de Portmany" },
  santa_eulalia: { area: "Santa Eulalia", town: "Santa Eulària des Riu" },
  san_jose: { area: "San José", town: "Sant Josep de sa Talaia" },
};

/**
 * Build area-safe location JSON
 * Never includes exact addresses - only broad area info
 */
function buildLocationJson(logistics: WizardState['logistics']): Json {
  const preset = logistics.location ?? null;

  if (!preset) {
    return {
      preset: null,
      area: "Ibiza",
      town: null,
      custom: null,
      zone: null,
      notes: null,
    };
  }

  if (preset === "other") {
    const custom = (logistics.customLocation ?? "").trim();
    const area = custom || "Ibiza";
    return {
      preset,
      area,
      town: null,
      custom: custom || null,
      zone: null,
      notes: null,
    };
  }

  // Try centralized zones first, fall back to legacy map
  const zone = getZoneByIdSafe(preset);
  const mapped = LOCATION_MAP[preset];
  const area = zone?.label ?? mapped?.area ?? "Ibiza";
  const town = mapped?.town ?? null;
  return {
    preset,
    area,
    town,
    custom: null,
    zone: null,
    notes: null,
  };
}

/**
 * Build highlights array from wizard state
 * These appear on job cards for quick scanning
 */
function buildHighlights(state: WizardState): string[] {
  const { logistics, extras, answers } = state;
  const highlights: string[] = [];

  // Timing highlight
  if (logistics.startDatePreset === "asap") {
    highlights.push("⚡ ASAP");
  } else if (logistics.startDatePreset === "this_week") {
    highlights.push("📅 This week");
  } else if (logistics.startDatePreset === "this_month") {
    highlights.push("📅 This month");
  } else if (logistics.startDate) {
    highlights.push(`📅 ${logistics.startDate.toLocaleDateString()}`);
  }

  // Budget highlight - format human-readable
  if (logistics.budgetRange) {
    const BUDGET_LABELS: Record<string, string> = {
      'under_500': 'Under 500 €',
      '500_1000': '500–1,000 €',
      '1000_2500': '1,000–2,500 €',
      '2500_5000': '2,500–5,000 €',
      'over_5000': 'Over 5,000 €',
      'need_quote': 'Quote needed',
    };
    const budgetLabel = BUDGET_LABELS[logistics.budgetRange] || logistics.budgetRange.replace(/_/g, ' ');
    highlights.push(`💰 ${budgetLabel}`);
  }

  // Consultation highlight
  if (logistics.consultationType === "site_visit") {
    highlights.push("🏠 Site visit needed");
  } else if (logistics.consultationType === "video_call") {
    highlights.push("📹 Video call available");
  }

  // Access details
  if (Array.isArray(logistics.accessDetails) && logistics.accessDetails.length > 0) {
    const accessLabels: Record<string, string> = {
      parking: "🅿️ Parking available",
      stairs_only: "🪜 Stairs only",
      elevator: "🛗 Elevator access",
      gated: "🚪 Gated property",
      key_pickup: "🔑 Key pickup required",
    };
    logistics.accessDetails.slice(0, 2).forEach(detail => {
      if (accessLabels[detail]) {
        highlights.push(accessLabels[detail]);
      }
    });
  }

  // Permits concern
  if (extras.permitsConcern) {
    highlights.push("📋 Permits may be needed");
  }

  // Photos indicator
  if ((extras.photos?.length ?? 0) > 0) {
    highlights.push(`📸 ${extras.photos!.length} photo${extras.photos!.length > 1 ? 's' : ''}`);
  }

  // Extract useful info from answers if available
  if (answers && typeof answers === 'object') {
    // Look for common answer patterns
    const answerObj = answers as Record<string, unknown>;
    
    // Size/quantity from answers
    Object.entries(answerObj).forEach(([key, value]) => {
      if (highlights.length >= 5) return;
      
      if (typeof value === 'object' && value !== null) {
        const v = value as Record<string, unknown>;
        // Check for quantity-like fields
        if (v.quantity && typeof v.quantity === 'number') {
          highlights.push(`📏 Qty: ${v.quantity}`);
        }
        if (v.size && typeof v.size === 'string') {
          highlights.push(`📐 ${v.size}`);
        }
        if (v.area_sqm && typeof v.area_sqm === 'number') {
          highlights.push(`📐 ${v.area_sqm}m²`);
        }
      }
    });
  }

  return highlights.slice(0, 5);
}

/**
 * Parse budget range string to min/max values
 * Handles formats like "€500-1000", "500 to 1000", "1000"
 */
function parseBudgetRange(input?: string | null): { min: number | null; max: number | null } {
  if (!input) return { min: null, max: null };

  // accepts "500-1000", "€500 - €1,000", "500 to 1000"
  const cleaned = input.replace(/[€,\s]/g, "").replace(/to/i, "-");
  const parts = cleaned.split("-").map(p => p.trim()).filter(Boolean);

  const a = parts[0] ? Number(parts[0]) : NaN;
  const b = parts[1] ? Number(parts[1]) : NaN;

  if (!Number.isFinite(a)) return { min: null, max: null };
  if (!Number.isFinite(b)) return { min: a, max: null };

  return { min: Math.min(a, b), max: Math.max(a, b) };
}

/**
 * Format date to ISO string or null
 */
function formatDate(date?: Date): string | null {
  return date ? date.toISOString() : null;
}

/**
 * Generate idempotency key to prevent duplicate submissions
 * Uses time bucket + content hash
 */
export function buildIdempotencyKey(
  uniqueId: string,
  wizardState: WizardState
): string {
  const timeBucket = Math.floor(Date.now() / (1000 * 60 * 60)); // 1-hour bucket
  
  // Unicode-safe base64 encoding to handle non-ASCII characters (e.g., Spanish accents)
  const contentHash = btoa(
    unescape(encodeURIComponent(JSON.stringify({
      id: uniqueId,
      micros: [...wizardState.microIds].sort().join(','),
      location: wizardState.logistics.location,
    })))
  ).slice(0, 32);

  return `job-${uniqueId.slice(0, 8)}-${contentHash}-${timeBucket}`;
}

/**
 * Map location selection to area name for filtering
 */
function mapLocationToArea(location?: string, customLocation?: string): string | null {
  if (!location) return null;
  if (location === 'other') {
    return customLocation?.trim() || null;
  }
  // Use centralized zones lookup (handles both kebab-case and legacy snake_case)
  const zone = getZoneByIdSafe(location);
  return zone?.label || LOCATION_MAP[location]?.area || null;
}

/**
 * Determine budget type from wizard input
 */
function determineBudgetType(budgetRange?: string | null): string {
  if (!budgetRange) return 'tbd';
  const { min, max } = parseBudgetRange(budgetRange);
  if (min !== null && max !== null && min !== max) return 'range';
  if (min !== null || max !== null) return 'fixed';
  return 'tbd';
}

/**
 * Map start date preset to start_timing column
 */
function mapStartTiming(preset?: string | null): string {
  const validTimings = ['asap', 'this_week', 'this_month', 'flexible', 'date'];
  if (preset && validTimings.includes(preset)) return preset;
  if (preset === 'specific') return 'date';
  return 'flexible';
}

/**
 * Build the job insert payload for Supabase
 * Returns a fully typed JobInsert object with all filterable columns populated
 */
export function buildJobInsert(userId: string, state: WizardState): JobInsert {
  const { mainCategory, subcategory, microNames, microIds, microSlugs, answers, logistics, extras } = state;

  // Title: concatenate micro names or fall back to subcategory/category
  const title =
    microNames.length > 0
      ? microNames.join(" + ")
      : subcategory
        ? `${subcategory} - ${mainCategory}`
        : mainCategory;

  // Teaser: short description for cards (first 200 chars of notes or auto-generated)
  const area = mapLocationToArea(logistics.location, logistics.customLocation);
  const teaser = extras.notes?.trim()
    ? extras.notes.trim().slice(0, 200)
    : `${title} in ${area || 'Ibiza'}`;

  // Full description
  const description =
    (extras.notes?.trim() ? extras.notes.trim() : null) ??
    `${title} - ${mainCategory}${subcategory ? ` / ${subcategory}` : ""}`;

  // Budget parsing
  const { min, max } = parseBudgetRange(logistics.budgetRange);
  const budgetType = determineBudgetType(logistics.budgetRange);
  
  // For fixed budget, use min as the value
  const budgetValue = budgetType === 'fixed' ? min : null;

  // Start timing
  const startTiming = mapStartTiming(logistics.startDatePreset);
  const startDate = logistics.startDate ? logistics.startDate.toISOString().split('T')[0] : null;

  // Photos check
  const hasPhotos = (extras.photos?.length ?? 0) > 0;

  // Primary micro slug (first selected)
  const primaryMicroSlug = microSlugs.length > 0 ? microSlugs[0] : null;

  // Build highlights for card display
  const highlights = buildHighlights(state);

  // Build proper location JSON (area-safe, no addresses)
  const locationPayload = buildLocationJson(logistics);

  // Full answers payload for detailed view
  const microAnswers = Object.fromEntries(
    Object.entries(answers ?? {}).map(([k, v]) => [k, v as Json])
  ) as Record<string, Json>;

  // Extract pack tracking metadata if present
  const packTracking = answers as Record<string, unknown> | undefined;
  
  const answersPayload: Json = {
    selected: {
      mainCategory,
      subcategory,
      microNames,
      microIds,
      microSlugs,
    },
    microAnswers,
    logistics: {
      location: logistics.location,
      customLocation: logistics.customLocation ?? null,
      startDatePreset: logistics.startDatePreset ?? null,
      startDate: formatDate(logistics.startDate),
      completionDate: formatDate(logistics.completionDate),
      consultationType: logistics.consultationType ?? null,
      consultationDate: formatDate(logistics.consultationDate),
      consultationTime: logistics.consultationTime ?? null,
      budgetRange: logistics.budgetRange ?? null,
      accessDetails: logistics.accessDetails ?? [],
    },
    extras: {
      photos: extras.photos ?? [],
      notes: extras.notes ?? null,
      permitsConcern: extras.permitsConcern ?? false,
    },
    // Pack tracking metadata for analytics
    _pack_source: (packTracking?._pack_source as string) ?? null,
    _pack_slug: (packTracking?._pack_slug as string) ?? null,
    _pack_missing: (packTracking?._pack_missing as boolean) ?? false,
  };

  // Return with all filterable columns populated directly
  return {
    user_id: userId,
    title,
    description,
    category: mainCategory || null,
    subcategory: subcategory || null,
    micro_slug: primaryMicroSlug,
    area,
    teaser,
    budget_type: budgetType,
    budget_value: budgetValue,
    budget_min: min,
    budget_max: max,
    start_timing: startTiming,
    start_date: startDate,
    has_photos: hasPhotos,
    highlights,
    location: locationPayload,
    answers: answersPayload,
    status: "open",
    is_publicly_listed: true,
  } as JobInsert;
}

/**
 * Validate wizard state before submission
 */
export function validateWizardState(state: WizardState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!state.mainCategoryId) errors.push("Please select a category");
  if (!state.subcategoryId) errors.push("Please select a service type");
  if (!state.microIds.length) errors.push("Please select at least one task");

  if (!state.logistics.location) errors.push("Please provide a location");
  if (state.logistics.location === "other" && !state.logistics.customLocation?.trim()) {
    errors.push("Please specify the location");
  }

  return { valid: errors.length === 0, errors };
}
