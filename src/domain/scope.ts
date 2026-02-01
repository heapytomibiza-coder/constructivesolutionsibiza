/**
 * PLATFORM SCOPE - SINGLE SOURCE OF TRUTH
 * Constructive Solutions Ibiza is construction-only.
 */

export const PLATFORM = {
  name: 'Constructive Solutions Ibiza',
  shortName: 'Constructive',
  tagline: 'Construction & Trade Services in Ibiza',
  description: 'Find trusted builders, electricians, plumbers, carpenters and trades for your projects in Ibiza.',
  mark: 'CS',
  industry: 'construction',
  scope: 'construction-only',
} as const;

// Domain guardrail: construction + property services ONLY
// This platform is NOT a marketplace. Do not expand beyond these trades.
export const DOMAIN_CONSTRAINT = {
  vertical: 'construction',
  scope: 'construction-only',
} as const;

export const MAIN_CATEGORIES = [
  'Construction',
  'Carpentry',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Painting & Decorating',
  'Cleaning',
  'Gardening & Landscaping',
  'Pool & Spa',
  'Architects & Design',
  'Transport & Logistics',
  'Kitchen & Bathroom',
  'Floors, Doors & Windows',
  'Handyman & General',
  'Commercial & Industrial',
  'Legal & Regulatory',
] as const;

export type MainCategory = typeof MAIN_CATEGORIES[number];
