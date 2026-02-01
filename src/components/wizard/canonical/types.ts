/**
 * Canonical Job Wizard Types
 * V2 clean architecture - matches V1 behaviour
 */

export type ConsultationType = 'site_visit' | 'phone_call' | 'video_call';

export interface WizardState {
  mainCategory: string;
  mainCategoryId: string;

  subcategory: string;
  subcategoryId: string;

  microNames: string[];
  microIds: string[];
  microSlugs: string[];

  answers: Record<string, unknown>;

  logistics: {
    location: string;
    customLocation?: string;

    startDate?: Date;
    startDatePreset?: string;
    completionDate?: Date;

    consultationType?: ConsultationType;
    consultationDate?: Date;
    consultationTime?: string;

    accessDetails?: string[];
    budgetRange?: string;
  };

  extras: {
    photos: string[]; // base64
    notes?: string;
    permitsConcern?: boolean;
  };
}

export const EMPTY_WIZARD_STATE: WizardState = {
  mainCategory: '',
  mainCategoryId: '',
  subcategory: '',
  subcategoryId: '',
  microNames: [],
  microIds: [],
  microSlugs: [],
  answers: {},
  logistics: {
    location: '',
    accessDetails: [],
  },
  extras: {
    photos: [],
  },
};

export enum WizardStep {
  Category = 1,
  Subcategory = 2,
  Micro = 3,
  Questions = 4,
  Logistics = 5,
  Extras = 6,
  Review = 7,
}

export const STEP_TITLES: Record<WizardStep, string> = {
  [WizardStep.Category]: 'Category',
  [WizardStep.Subcategory]: 'Service Type',
  [WizardStep.Micro]: 'Specific Tasks',
  [WizardStep.Questions]: 'Details',
  [WizardStep.Logistics]: 'Location & Timing',
  [WizardStep.Extras]: 'Photos & Notes',
  [WizardStep.Review]: 'Review & Submit',
};
