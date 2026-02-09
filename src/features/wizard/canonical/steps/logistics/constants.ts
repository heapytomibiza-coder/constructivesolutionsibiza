/**
 * Logistics Step Constants
 * Timing, budget, and contact options
 * 
 * NOTE: Location taxonomy is now centralized in zones.ts
 * Import from '@/shared/components/professional/zones' for location data
 */

import type { ConsultationType } from '../../types';

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
