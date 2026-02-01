/**
 * PLATFORM SCOPE - SINGLE SOURCE OF TRUTH
 * 
 * Constructive Solutions Ibiza is STRICTLY for:
 * - Construction
 * - Building & Renovation
 * - Property Maintenance
 * - Trades (electrical, plumbing, carpentry, etc.)
 * - Related professional services (architecture, design, compliance)
 * 
 * This platform is NOT for:
 * - Concierge services
 * - Lifestyle services
 * - Hospitality
 * - Personal services
 * - Creative services (photography, etc.)
 * - General "professionals" marketplace
 * 
 * DO NOT introduce generic marketplace copy or categories.
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

// Domain guardrail: we are construction + property services only
export const DOMAIN_CONSTRAINT = {
  vertical: 'construction',
  bannedExamples: ['concierge', 'yacht', 'villa manager', 'chef', 'Mediterranean experience'],
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
