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

/**
 * LOCKED TERMINOLOGY
 * 
 * These are the canonical terms used throughout the platform.
 * Internal code uses client/professional, but user-facing copy uses Asker/Tasker.
 * 
 * Core Narrative: Problem → Asker → Constructive Solutions → Tasker → Solution
 */
export const TERMINOLOGY = {
  // User-facing terms (use these in UI copy via i18n lexicon)
  asker: 'Asker',           // The person with a problem (internal: client)
  tasker: 'Tasker',         // The professional who solves it (internal: professional)
  problem: 'Problem',       // What the Asker needs help with (internal: job)
  solution: 'Solution',     // The completed work
  
  // Lane names
  askerLane: 'Asker Lane',  // Hiring journey
  taskerLane: 'Tasker Lane', // Working journey
  
  // Product features
  problemBuilder: 'Problem Builder', // The wizard
  matching: 'Finding the right Tasker',
  
  // Internal to external mapping
  internalToExternal: {
    client: 'Asker',
    professional: 'Tasker',
    job: 'Problem',
    hiring: 'Asker Lane',
    working: 'Tasker Lane',
  },
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
