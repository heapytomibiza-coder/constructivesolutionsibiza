/**
 * Logistics Step Constants
 * Location taxonomy, timing, budget, and contact options
 */

import type { ConsultationType } from '../../types';

// Ibiza location taxonomy with proper Spanish orthography
export type LocationOption = { 
  value: string; 
  label: string; 
  group: 'main' | 'popular' | 'other';
};

// Top 5 main towns shown by default
export const MAIN_LOCATIONS: LocationOption[] = [
  { value: 'ibiza_town', label: 'Ibiza Town (Eivissa)', group: 'main' },
  { value: 'san_antonio', label: 'San Antonio (Sant Antoni)', group: 'main' },
  { value: 'santa_eulalia', label: 'Santa Eulalia', group: 'main' },
  { value: 'san_jose', label: 'San José (Sant Josep)', group: 'main' },
  { value: 'san_juan', label: 'San Juan (Sant Joan)', group: 'main' },
];

// Popular areas shown in expanded view
export const POPULAR_LOCATIONS: LocationOption[] = [
  { value: 'playa_den_bossa', label: "Playa d'en Bossa", group: 'popular' },
  { value: 'talamanca', label: 'Talamanca', group: 'popular' },
  { value: 'jesus', label: 'Jesús', group: 'popular' },
  { value: 'cala_llonga', label: 'Cala Llonga', group: 'popular' },
  { value: 'es_cana', label: 'Es Caná', group: 'popular' },
  { value: 'portinatx', label: 'Portinatx', group: 'popular' },
  { value: 'san_carlos', label: 'San Carlos', group: 'popular' },
  { value: 'cala_vadella', label: 'Cala Vadella', group: 'popular' },
  { value: 'cala_tarida', label: 'Cala Tarida', group: 'popular' },
  { value: 'cala_conta', label: 'Cala Conta', group: 'popular' },
  { value: 'es_cubells', label: 'Es Cubells', group: 'popular' },
  { value: 'sant_jordi', label: 'Sant Jordi', group: 'popular' },
  { value: 'san_rafael', label: 'San Rafael', group: 'popular' },
  { value: 'sant_mateu', label: 'Sant Mateu', group: 'popular' },
  { value: 'san_miguel', label: 'San Miguel', group: 'popular' },
  { value: 'santa_gertrudis', label: 'Santa Gertrudis', group: 'popular' },
];

// Other fallback
export const OTHER_LOCATION: LocationOption = { 
  value: 'other', 
  label: 'Other area', 
  group: 'other' 
};

// All locations combined
export const ALL_LOCATIONS = [...MAIN_LOCATIONS, ...POPULAR_LOCATIONS, OTHER_LOCATION];

// Timing options
export const TIMING_OPTIONS = [
  { value: 'asap', labelKey: 'logistics.timing.asap' },
  { value: 'this_week', labelKey: 'logistics.timing.thisWeek' },
  { value: 'this_month', labelKey: 'logistics.timing.thisMonth' },
  { value: 'flexible', labelKey: 'logistics.timing.flexible' },
  { value: 'specific', labelKey: 'logistics.timing.specific' },
] as const;

// Budget options - compact labels for tiles
export const BUDGET_OPTIONS = [
  { value: 'under_500', labelKey: 'logistics.budget.under500' },
  { value: '500_1000', labelKey: 'logistics.budget.500to1k' },
  { value: '1000_2500', labelKey: 'logistics.budget.1kto2_5k' },
  { value: '2500_5000', labelKey: 'logistics.budget.2_5kto5k' },
  { value: 'over_5000', labelKey: 'logistics.budget.over5k' },
  { value: 'need_quote', labelKey: 'logistics.budget.needQuote' },
] as const;

// Contact preference options
export const CONTACT_OPTIONS: { value: ConsultationType; labelKey: string }[] = [
  { value: 'site_visit', labelKey: 'logistics.contact.siteVisit' },
  { value: 'phone_call', labelKey: 'logistics.contact.phoneCall' },
  { value: 'message', labelKey: 'logistics.contact.message' },
];
