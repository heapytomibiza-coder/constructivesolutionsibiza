/**
 * Job Payload Builder
 * Transforms wizard state into database insert format
 */

import type { WizardState } from '../types';

/**
 * Parse budget string to number
 */
export function parseBudgetValue(input?: string): number | null {
  if (!input) return null;
  const cleaned = input.replace(/[^0-9.,]/g, '').replace(',', '.');
  const match = cleaned.match(/^\d+(\.\d+)?$/);
  return match ? Number(match[0]) : null;
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

  return {
    user_id: userId,
    
    title: combinedTitle,
    
    description: extras.notes || `${combinedTitle} - ${mainCategory} / ${subcategory}`,
    
    category: mainCategory,
    
    answers: {
      microAnswers: answers,
      selectedMicros: microNames,
      selectedMicroIds: microIds,
      logistics: {
        ...logistics,
        startDate: formatDate(logistics.startDate),
        completionDate: formatDate(logistics.completionDate),
        consultationDate: formatDate(logistics.consultationDate),
      },
      extras: {
        photos: extras.photos,
        permitsConcern: extras.permitsConcern,
      },
    },

    budget_min: parseBudgetValue(logistics.budgetRange),
    budget_max: parseBudgetValue(logistics.budgetRange),

    location: {
      address: logistics.location,
      customLocation: logistics.customLocation,
      startDate: formatDate(logistics.startDate),
      completionDate: formatDate(logistics.completionDate),
    },

    status: 'draft',
    is_publicly_listed: false,
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

  return {
    valid: errors.length === 0,
    errors,
  };
}
