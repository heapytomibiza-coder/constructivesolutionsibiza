/**
 * Canonical Job Wizard Types
 * V2: string enum steps (URL-safe, debuggable)
 */

export type ConsultationType = "site_visit" | "phone_call" | "video_call";

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

  // === QUESTIONS (future-safe) ===
  answers: Record<string, unknown>;

  // === LOGISTICS ===
  logistics: {
    location: string; // "ibiza_town" | "other" etc
    customLocation?: string;

    startDatePreset?: string; // "asap" | "this_week" etc
    startDate?: Date;
    completionDate?: Date;

    consultationType?: ConsultationType;
    consultationDate?: Date;
    consultationTime?: string;

    budgetRange?: string; // "€500-1000"
    accessDetails?: string[];
  };

  // === EXTRAS ===
  extras: {
    photos: string[]; // base64 for now (later: storage URLs)
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
    accessDetails: [],
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
  return index >= 0 ? STEP_ORDER[index + 1] : undefined;
}

export function getPrevStep(current: WizardStep): WizardStep | undefined {
  const index = getStepIndex(current);
  return index > 0 ? STEP_ORDER[index - 1] : undefined;
}

export function isValidStep(value: string): value is WizardStep {
  return (Object.values(WizardStep) as string[]).includes(value);
}
