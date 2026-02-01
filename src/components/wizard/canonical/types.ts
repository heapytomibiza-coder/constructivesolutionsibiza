/**
 * Canonical Job Wizard Types
 * V2 clean architecture - string enums for URL-safe, debuggable steps
 */

// === STEP ENUM (string-based for URL sync + debugging) ===
export enum WizardStep {
  Category = "category",
  Subcategory = "subcategory",
  Micro = "micro",
  Logistics = "logistics",
  Extras = "extras",
  Review = "review",
}

export const STEP_ORDER: WizardStep[] = [
  WizardStep.Category,
  WizardStep.Subcategory,
  WizardStep.Micro,
  WizardStep.Logistics,
  WizardStep.Extras,
  WizardStep.Review,
];

export const STEP_TITLES: Record<WizardStep, string> = {
  [WizardStep.Category]: "Category",
  [WizardStep.Subcategory]: "Service Type",
  [WizardStep.Micro]: "Specific Tasks",
  [WizardStep.Logistics]: "Location & Timing",
  [WizardStep.Extras]: "Photos & Notes",
  [WizardStep.Review]: "Review & Submit",
};

// === WIZARD STATE (single source of truth) ===
export interface WizardState {
  // === CATEGORY SELECTION ===
  mainCategory: string;
  mainCategoryId: string;

  subcategory: string;
  subcategoryId: string;

  // === MICRO SERVICES ===
  microNames: string[];
  microIds: string[];
  microSlugs: string[];

  // === QUESTIONS (future-safe, optional for now) ===
  answers: Record<string, unknown>;

  // === LOGISTICS ===
  logistics: {
    location: string;
    customLocation?: string;
    startDatePreset?: string;
    startDate?: Date;
    completionDate?: Date;
    budgetRange?: string;
    accessDetails?: string[];
  };

  // === EXTRAS ===
  extras: {
    photos: string[]; // base64 for now, URLs later
    notes?: string;
    permitsConcern?: boolean;
  };
}

// === EMPTY STATE (canonical default) ===
export const EMPTY_WIZARD_STATE: WizardState = {
  mainCategory: "",
  mainCategoryId: "",

  subcategory: "",
  subcategoryId: "",

  microNames: [],
  microIds: [],
  microSlugs: [],

  answers: {},

  logistics: {
    location: "",
  },

  extras: {
    photos: [],
  },
};

// === STEP UTILITIES ===
export function getStepIndex(step: WizardStep): number {
  return STEP_ORDER.indexOf(step);
}

export function getStepByIndex(index: number): WizardStep | undefined {
  return STEP_ORDER[index];
}

export function getNextStep(current: WizardStep): WizardStep | undefined {
  const index = getStepIndex(current);
  return STEP_ORDER[index + 1];
}

export function getPrevStep(current: WizardStep): WizardStep | undefined {
  const index = getStepIndex(current);
  return index > 0 ? STEP_ORDER[index - 1] : undefined;
}

export function isValidStep(value: string): value is WizardStep {
  return Object.values(WizardStep).includes(value as WizardStep);
}
