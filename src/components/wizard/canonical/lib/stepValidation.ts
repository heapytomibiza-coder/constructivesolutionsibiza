/**
 * Step Validation Utilities
 * Typed validators for wizard step completion
 */

import type { WizardState } from '../types';

// === STEP 5 (LOGISTICS) VALIDATION ===
export type Step5Check = {
  ok: boolean;
  missing: {
    location: boolean;
    startDate: boolean;
    consultationType: boolean;
    budgetRange: boolean;
  };
};

export function isStep5Complete(logistics: WizardState['logistics']): Step5Check {
  const locationOk = Boolean(logistics?.location && String(logistics.location).trim());
  const presetOk = Boolean(logistics?.startDatePreset && String(logistics.startDatePreset).trim());
  const dateOk = Boolean(logistics?.startDate);
  const startOk = presetOk || dateOk;
  const consultationOk = Boolean(logistics?.consultationType && String(logistics.consultationType).trim());
  const budgetOk = Boolean(logistics?.budgetRange && String(logistics.budgetRange).trim());

  return {
    ok: locationOk && startOk && consultationOk && budgetOk,
    missing: {
      location: !locationOk,
      startDate: !startOk,
      consultationType: !consultationOk,
      budgetRange: !budgetOk,
    },
  };
}

// === STEP-BY-STEP COMPLETION CHECKS ===
export function isCategoryComplete(state: WizardState): boolean {
  return Boolean(state.mainCategoryId && state.mainCategory);
}

export function isSubcategoryComplete(state: WizardState): boolean {
  return Boolean(state.subcategoryId && state.subcategory);
}

export function isMicroComplete(state: WizardState): boolean {
  return state.microIds.length > 0;
}

// Questions step is always "complete" (optional step)
export function isQuestionsComplete(): boolean {
  return true;
}

export function isLogisticsComplete(state: WizardState): boolean {
  return isStep5Complete(state.logistics).ok;
}

// Extras step is always "complete" (optional step)
export function isExtrasComplete(): boolean {
  return true;
}

// === FULL WIZARD VALIDATION ===
export type WizardValidation = {
  canSubmit: boolean;
  errors: string[];
};

export function validateWizardForSubmission(state: WizardState): WizardValidation {
  const errors: string[] = [];

  if (!isCategoryComplete(state)) errors.push("Please select a category");
  if (!isSubcategoryComplete(state)) errors.push("Please select a service type");
  if (!isMicroComplete(state)) errors.push("Please select at least one task");

  const step5 = isStep5Complete(state.logistics);
  if (step5.missing.location) errors.push("Please provide a location");
  if (step5.missing.startDate) errors.push("Please select when you need this done");
  // consultationType and budgetRange are optional for submission

  if (state.logistics.location === "other" && !state.logistics.customLocation?.trim()) {
    errors.push("Please specify your location");
  }

  return { canSubmit: errors.length === 0, errors };
}
