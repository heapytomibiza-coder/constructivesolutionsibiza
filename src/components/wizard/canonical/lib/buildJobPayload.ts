/**
 * Job Payload Builder
 * Transforms wizard state into database insert format
 * V2: Fully type-safe using TablesInsert<"jobs">
 */

import type { TablesInsert, Json } from '@/integrations/supabase/types';
import type { WizardState } from '../types';

type JobInsert = TablesInsert<"jobs">;

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
  
  const contentHash = btoa(
    JSON.stringify({
      id: uniqueId,
      micros: [...wizardState.microIds].sort().join(','),
      location: wizardState.logistics.location,
    })
  ).slice(0, 32);

  return `job-${uniqueId.slice(0, 8)}-${contentHash}-${timeBucket}`;
}

/**
 * Map location selection to area name for filtering
 */
function mapLocationToArea(location?: string): string | null {
  const areaMap: Record<string, string> = {
    'ibiza_town': 'Ibiza Town',
    'san_antonio': 'San Antonio',
    'santa_eulalia': 'Santa Eulalia',
    'san_jose': 'San José',
  };
  if (!location) return null;
  return areaMap[location] || null;
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
  const teaser = extras.notes?.trim()
    ? extras.notes.trim().slice(0, 200)
    : `${title} in ${mapLocationToArea(logistics.location) || logistics.customLocation || 'Ibiza'}`;

  // Full description
  const description =
    (extras.notes?.trim() ? extras.notes.trim() : null) ??
    `${title} - ${mainCategory}${subcategory ? ` / ${subcategory}` : ""}`;

  // Budget parsing
  const { min, max } = parseBudgetRange(logistics.budgetRange);
  const budgetType = determineBudgetType(logistics.budgetRange);
  
  // For fixed budget, use min as the value
  const budgetValue = budgetType === 'fixed' ? min : null;

  // Area extraction
  const area = logistics.location === 'other' 
    ? logistics.customLocation?.trim() || null
    : mapLocationToArea(logistics.location);

  // Start timing
  const startTiming = mapStartTiming(logistics.startDatePreset);
  const startDate = logistics.startDate ? logistics.startDate.toISOString().split('T')[0] : null;

  // Photos check
  const hasPhotos = (extras.photos?.length ?? 0) > 0;

  // Primary micro slug (first selected)
  const primaryMicroSlug = microSlugs.length > 0 ? microSlugs[0] : null;

  // Full answers payload for detailed view
  const microAnswers = Object.fromEntries(
    Object.entries(answers ?? {}).map(([k, v]) => [k, v as Json])
  ) as Record<string, Json>;

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
  };

  const locationPayload: Json = {
    location: logistics.location,
    customLocation: logistics.customLocation ?? null,
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
    answers: answersPayload,
    location: locationPayload,
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
