/**
 * Job Payload Builder
 * Transforms wizard state into database insert format
 */

import type { WizardState } from '../types';
import type { Json } from '@/integrations/supabase/types';

/**
 * Parse budget range string to min/max values
 * Handles formats like "€500-1000", "500 to 1000", "1000"
 */
export function parseBudgetRange(input?: string | null): { min: number | null; max: number | null } {
  if (!input) return { min: null, max: null };

  const cleaned = input.replace(/[€,\s]/g, "").replace(/to/i, "-");
  const parts = cleaned.split("-").map(p => p.trim()).filter(Boolean);

  const a = parts[0] ? Number(parts[0]) : NaN;
  const b = parts[1] ? Number(parts[1]) : NaN;

  if (!Number.isFinite(a)) return { min: null, max: null };
  if (!Number.isFinite(b)) return { min: a, max: null };

  return { min: Math.min(a, b), max: Math.max(a, b) };
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
 */
export function buildJobInsert(userId: string, wizardState: WizardState) {
  const { mainCategory, subcategory, microNames, microIds, logistics, extras, answers } = wizardState;

  // Combine micro names for title
  const combinedTitle = microNames.length > 0 
    ? microNames.join(' + ')
    : `${subcategory} - ${mainCategory}`;

  // Format dates safely
  const formatDate = (date?: Date) => date?.toISOString() ?? null;

  // Parse budget range
  const { min: budgetMin, max: budgetMax } = parseBudgetRange(logistics.budgetRange);

  // Resolve location - use custom if "other" selected
  const resolvedLocation = logistics.location === 'other' 
    ? logistics.customLocation ?? ''
    : logistics.location;

  // Build answers as JSON-compatible object (ensure all values are JSON-safe)
  const answersPayload: Json = {
    microAnswers: JSON.parse(JSON.stringify(answers ?? {})),
    selectedMicros: microNames,
    selectedMicroIds: microIds,
    logistics: {
      location: resolvedLocation,
      customLocation: logistics.customLocation ?? null,
      startDatePreset: logistics.startDatePreset ?? null,
      budgetRange: logistics.budgetRange ?? null,
      accessDetails: logistics.accessDetails ?? [],
      startDate: formatDate(logistics.startDate),
      completionDate: formatDate(logistics.completionDate),
      consultationType: logistics.consultationType ?? null,
      consultationDate: formatDate(logistics.consultationDate),
      consultationTime: logistics.consultationTime ?? null,
    },
    extras: {
      photos: extras.photos,
      notes: extras.notes ?? null,
      permitsConcern: extras.permitsConcern ?? false,
    },
  };

  // Build location as JSON-compatible object
  const locationPayload: Json = {
    address: resolvedLocation,
    customLocation: logistics.customLocation ?? null,
    startDate: formatDate(logistics.startDate),
    completionDate: formatDate(logistics.completionDate),
  };

  return {
    user_id: userId,
    title: combinedTitle,
    description: extras.notes || `${combinedTitle} - ${mainCategory} / ${subcategory}`,
    category: mainCategory,
    answers: answersPayload,
    budget_min: budgetMin,
    budget_max: budgetMax,
    location: locationPayload,
    status: 'open',
    is_publicly_listed: true,
  };
}

/**
 * Validate wizard state before submission
 */
export function validateWizardState(state: WizardState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!state.mainCategoryId) {
    errors.push('Please select a category');
  }

  if (!state.subcategoryId) {
    errors.push('Please select a service type');
  }

  if (state.microIds.length === 0) {
    errors.push('Please select at least one task');
  }

  if (!state.logistics.location) {
    errors.push('Please provide a location');
  }

  // If "other" location selected, require custom location
  if (state.logistics.location === 'other' && !state.logistics.customLocation?.trim()) {
    errors.push('Please specify the location');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
