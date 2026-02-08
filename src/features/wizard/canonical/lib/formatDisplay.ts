/**
 * Display formatting helpers for the Review step
 * Converts raw database values into human-readable text
 */

import { LOCATION_LABELS } from '@/pages/jobs/lib/answerResolver';

const BUDGET_DISPLAY: Record<string, string> = {
  'under_500': 'Under €500',
  '500_1000': '€500 – €1,000',
  '1000_2500': '€1,000 – €2,500',
  '2500_5000': '€2,500 – €5,000',
  'over_5000': 'Over €5,000',
  'need_quote': 'Quote needed',
};

const TIMING_DISPLAY: Record<string, string> = {
  'asap': 'As soon as possible',
  'this_week': 'This week',
  'this_month': 'This month',
  'flexible': 'Flexible',
  'specific': 'Specific date',
};

/**
 * Format budget range for display
 * @example formatBudgetRange('1000_2500') → '€1,000 – €2,500'
 */
export function formatBudgetRange(raw: string | undefined): string {
  if (!raw) return 'To be discussed';
  return BUDGET_DISPLAY[raw] || raw.replace(/_/g, ' ');
}

/**
 * Format location for display
 * @example formatLocation('ibiza_town') → 'Ibiza Town'
 */
export function formatLocationDisplay(
  location: string | undefined,
  customLocation?: string
): string {
  if (!location) return 'Not specified';
  if (location === 'other') return customLocation || 'Custom location';
  return (
    LOCATION_LABELS[location] ||
    location
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Format timing preset for display
 * @example formatTiming('this_week') → 'This week'
 */
export function formatTiming(preset: string | undefined, date?: Date): string {
  if (!preset) return 'Flexible';
  if (preset === 'specific' && date) {
    return `Starting ${date.toLocaleDateString()}`;
  }
  return (
    TIMING_DISPLAY[preset] ||
    preset
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
  );
}
