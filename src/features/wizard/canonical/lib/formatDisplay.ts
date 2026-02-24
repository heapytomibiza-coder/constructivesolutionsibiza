/**
 * Display formatting helpers for the Review step
 * Converts raw database values into human-readable text
 * Uses i18n when a `t` function is provided, otherwise falls back to English defaults.
 */

import { getZoneByIdSafe } from '@/shared/components/professional/zones';
import type { TFunction } from 'i18next';

const BUDGET_KEYS: Record<string, string> = {
  'under_500': 'under500',
  '500_1000': '500to1k',
  '1000_2500': '1kto2_5k',
  '2500_5000': '2_5kto5k',
  'over_5000': 'over5k',
  'need_quote': 'needQuote',
};

const TIMING_KEYS: Record<string, string> = {
  'asap': 'asap',
  'this_week': 'thisWeek',
  'this_month': 'thisMonth',
  'flexible': 'flexible',
  'specific': 'specific',
};

// English fallbacks (used when no t function is provided)
const BUDGET_FALLBACK: Record<string, string> = {
  'under_500': 'Under 500 €',
  '500_1000': '500–1,000 €',
  '1000_2500': '1,000–2,500 €',
  '2500_5000': '2,500–5,000 €',
  'over_5000': 'Over 5,000 €',
  'need_quote': 'Quote needed',
};

const TIMING_FALLBACK: Record<string, string> = {
  'asap': 'As soon as possible',
  'this_week': 'This week',
  'this_month': 'This month',
  'flexible': 'Flexible',
  'specific': 'Specific date',
};

/**
 * Format budget range for display
 */
export function formatBudgetRange(raw: string | undefined, t?: TFunction): string {
  if (!raw) return t ? t('wizard:review.toBeDiscussed', 'To be discussed') : 'To be discussed';

  const i18nKey = BUDGET_KEYS[raw];
  if (i18nKey && t) {
    return t(`wizard:logistics.budget.${i18nKey}`);
  }

  const fallback = BUDGET_FALLBACK[raw];
  if (fallback) return fallback;

  return raw.replace(/_/g, ' ').trim().charAt(0).toUpperCase() + raw.replace(/_/g, ' ').trim().slice(1);
}

/**
 * Format location for display
 */
export function formatLocationDisplay(
  location: string | undefined,
  customLocation?: string,
  t?: TFunction
): string {
  if (!location) return t ? t('wizard:review.notSpecified', 'Not specified') : 'Not specified';
  if (location === 'other') return customLocation || (t ? t('wizard:review.customLocation', 'Custom location') : 'Custom location');
  const zone = getZoneByIdSafe(location);
  if (zone) return zone.label;
  return location
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format timing preset for display
 */
export function formatTiming(preset: string | undefined, date?: Date, t?: TFunction): string {
  if (!preset) return t ? t('wizard:logistics.timing.flexible') : 'Flexible';
  if (preset === 'specific' && date) {
    return t
      ? t('wizard:review.startingDate', 'Starting {{date}}', { date: date.toLocaleDateString() })
      : `Starting ${date.toLocaleDateString()}`;
  }

  const i18nKey = TIMING_KEYS[preset];
  if (i18nKey && t) {
    return t(`wizard:logistics.timing.${i18nKey}`);
  }

  const fallback = TIMING_FALLBACK[preset];
  if (fallback) return fallback;

  return preset
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}
