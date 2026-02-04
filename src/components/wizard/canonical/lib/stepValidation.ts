/**
 * Step Validation - Single Source of Truth
 * 
 * All step completion rules, submission rules, and error messages
 * are derived from one config to prevent mismatches.
 */

import type { WizardState } from '../types';

// === FIELD REQUIREMENTS CONFIG (single source of truth) ===
const LOGISTICS_FIELDS = {
  location: { required: true, label: 'Location', errorMsg: 'Please provide a location' },
  startDate: { required: true, label: 'Timing', errorMsg: 'Please select when you need this done' },
  consultationType: { required: true, label: 'Consultation type', errorMsg: 'Please select a consultation type' },
  budgetRange: { required: true, label: 'Budget', errorMsg: 'Please choose a budget range' },
} as const;

// === STEP 5 (LOGISTICS) VALIDATION ===
export type Step5Check = {
  ok: boolean;
  missing: {
    location: boolean;
    startDate: boolean;
    consultationType: boolean;
    budgetRange: boolean;
  };
  errors: string[];
};

export function isStep5Complete(logistics: WizardState['logistics']): Step5Check {
  const locationOk = Boolean(logistics?.location && String(logistics.location).trim());
  const presetOk = Boolean(logistics?.startDatePreset && String(logistics.startDatePreset).trim());
  const dateOk = Boolean(logistics?.startDate);
  const startOk = presetOk || dateOk;
  const consultationOk = Boolean(logistics?.consultationType && String(logistics.consultationType).trim());
  const budgetOk = Boolean(logistics?.budgetRange && String(logistics.budgetRange).trim());

  const missing = {
    location: !locationOk,
    startDate: !startOk,
    consultationType: !consultationOk,
    budgetRange: !budgetOk,
  };

  const errors: string[] = [];
  if (missing.location && LOGISTICS_FIELDS.location.required) {
    errors.push(LOGISTICS_FIELDS.location.errorMsg);
  }
  if (missing.startDate && LOGISTICS_FIELDS.startDate.required) {
    errors.push(LOGISTICS_FIELDS.startDate.errorMsg);
  }
  if (missing.consultationType && LOGISTICS_FIELDS.consultationType.required) {
    errors.push(LOGISTICS_FIELDS.consultationType.errorMsg);
  }
  if (missing.budgetRange && LOGISTICS_FIELDS.budgetRange.required) {
    errors.push(LOGISTICS_FIELDS.budgetRange.errorMsg);
  }

  return {
    ok: errors.length === 0,
    missing,
    errors,
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

// === STEP 4 (QUESTIONS) VALIDATION ===

interface QuestionDefForValidation {
  id: string;
  type: string;
  required?: boolean;
  min?: number;
  max?: number;
  show_if?: { questionId: string; value: string | string[] };
  dependsOn?: { questionId: string; value: string | string[] };
}

interface QuestionPackForValidation {
  micro_slug: string;
  questions: QuestionDefForValidation[];
}

export type ValidationErrorMap = Record<string, string>;

const isEmpty = (v: unknown): boolean => {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
};

// Check if question should be visible (respect show_if/dependsOn)
const isQuestionVisible = (
  question: QuestionDefForValidation,
  getAnswer: (qid: string) => unknown
): boolean => {
  const dep = question.show_if || question.dependsOn;
  if (!dep?.questionId) return true;
  
  const depValue = getAnswer(dep.questionId);
  const depValueArr = Array.isArray(depValue)
    ? depValue.map(String)
    : depValue != null ? [String(depValue)] : [];
  
  const requiredArr = Array.isArray(dep.value)
    ? dep.value.map(String)
    : [String(dep.value)];
  
  return requiredArr.some(v => depValueArr.includes(v));
};

export function validateQuestionPack(
  pack: QuestionPackForValidation,
  microAnswers: Record<string, Record<string, unknown>>
): ValidationErrorMap {
  const errors: ValidationErrorMap = {};
  const answers = microAnswers[pack.micro_slug] || {};
  const getAnswer = (qid: string) => answers[qid];
  
  for (const q of pack.questions) {
    // Skip hidden questions
    if (!isQuestionVisible(q, getAnswer)) continue;
    
    const v = answers[q.id];
    
    // Required check
    if (q.required && isEmpty(v)) {
      errors[q.id] = 'Required';
      continue;
    }
    
    // Number min/max validation (only if value is present)
    if (q.type === 'number' && v != null && v !== '') {
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isNaN(n)) {
        errors[q.id] = 'Enter a valid number';
        continue;
      }
      if (typeof q.min === 'number' && n < q.min) {
        errors[q.id] = `Must be ≥ ${q.min}`;
      }
      if (typeof q.max === 'number' && n > q.max) {
        errors[q.id] = `Must be ≤ ${q.max}`;
      }
    }
  }
  
  return errors;
}

export type PackValidationResult = {
  valid: boolean;
  errors: Record<string, ValidationErrorMap>;
  firstErrorId: string | null;
};

export function validateAllPacks(
  packs: QuestionPackForValidation[],
  microAnswers: Record<string, Record<string, unknown>>
): PackValidationResult {
  const allErrors: Record<string, ValidationErrorMap> = {};
  let firstErrorId: string | null = null;
  
  for (const pack of packs) {
    const packErrors = validateQuestionPack(pack, microAnswers);
    if (Object.keys(packErrors).length > 0) {
      allErrors[pack.micro_slug] = packErrors;
      if (!firstErrorId) {
        firstErrorId = `${pack.micro_slug}-${Object.keys(packErrors)[0]}`;
      }
    }
  }
  
  return {
    valid: Object.keys(allErrors).length === 0,
    errors: allErrors,
    firstErrorId,
  };
}

// === FULL WIZARD VALIDATION (for submission) ===
export type WizardValidation = {
  canSubmit: boolean;
  errors: string[];
};

export function validateWizardForSubmission(state: WizardState): WizardValidation {
  const errors: string[] = [];

  // Category selection
  if (!isCategoryComplete(state)) errors.push("Please select a category");
  if (!isSubcategoryComplete(state)) errors.push("Please select a service type");
  if (!isMicroComplete(state)) errors.push("Please select at least one task");

  // Logistics (Step 5) - all required fields
  const step5 = isStep5Complete(state.logistics);
  errors.push(...step5.errors);

  // Custom location validation
  if (state.logistics.location === "other" && !state.logistics.customLocation?.trim()) {
    errors.push("Please specify your location");
  }

  return { canSubmit: errors.length === 0, errors };
}

// === STEP NAVIGATION GUARDS ===
export function canLeaveStep(step: string, state: WizardState): { allowed: boolean; errors: string[] } {
  switch (step) {
    case 'category':
      return isCategoryComplete(state) 
        ? { allowed: true, errors: [] }
        : { allowed: false, errors: ['Please select a category'] };
    case 'subcategory':
      return isSubcategoryComplete(state)
        ? { allowed: true, errors: [] }
        : { allowed: false, errors: ['Please select a service type'] };
    case 'micro':
      return isMicroComplete(state)
        ? { allowed: true, errors: [] }
        : { allowed: false, errors: ['Please select at least one task'] };
    case 'questions':
      return { allowed: true, errors: [] }; // Always allowed
    case 'logistics': {
      const step5 = isStep5Complete(state.logistics);
      return { allowed: step5.ok, errors: step5.errors };
    }
    case 'extras':
      return { allowed: true, errors: [] }; // Always allowed
    default:
      return { allowed: true, errors: [] };
  }
}
