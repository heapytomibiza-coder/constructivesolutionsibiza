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
 * Build the job insert payload for Supabase
 * Returns a fully typed JobInsert object
 */
export function buildJobInsert(userId: string, state: WizardState): JobInsert {
  const { mainCategory, subcategory, microNames, microIds, microSlugs, answers, logistics, extras } = state;

  const title =
    microNames.length > 0
      ? microNames.join(" + ")
      : subcategory
        ? `${subcategory} - ${mainCategory}`
        : mainCategory;

  const description =
    (extras.notes?.trim() ? extras.notes.trim() : null) ??
    `${title} - ${mainCategory}${subcategory ? ` / ${subcategory}` : ""}`;

  const { min, max } = parseBudgetRange(logistics.budgetRange);

  // Everything inside is JSON-safe (strings, arrays, booleans, nulls)
  // Using Object.fromEntries to ensure type compatibility with Json
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

  return {
    user_id: userId,
    title,
    description,
    category: mainCategory || null,
    answers: answersPayload,
    location: locationPayload,
    budget_min: min,
    budget_max: max,
    status: "open",
    is_publicly_listed: true,
  };
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
