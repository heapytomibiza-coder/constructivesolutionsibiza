/**
 * PLATFORM SCOPE - SINGLE SOURCE OF TRUTH
 * Constructive Solutions Ibiza is construction-only.
 */

export const PLATFORM = {
  name: 'Constructive Solutions Ibiza',
  shortName: 'Constructive',
  tagline: 'Construction & Trade Services in Ibiza',
  description: 'Create clear construction and property requests for local professionals in Ibiza.',
  mark: 'CS',
  industry: 'construction',
  scope: 'construction-only',
} as const;

/**
 * LOCKED TERMINOLOGY
 * 
 * These are the canonical terms used throughout the platform.
 * Internal and user-facing copy should use client/professional.
 * 
 * Core Narrative: Client request → Constructive Solutions → Professional response → Completed work
 */
export const TERMINOLOGY = {
  // User-facing terms (use these in UI copy via i18n lexicon)
  asker: 'Client',          // The person with a request
  tasker: 'Professional',   // The professional who responds
  problem: 'Request',       // What the client needs help with
  solution: 'Solution',     // The completed work
  
  // Lane names
  askerLane: 'Client Mode',  // Hiring journey
  taskerLane: 'Professional Mode', // Working journey
  
  // Product features
  problemBuilder: 'Request Builder', // The wizard
  matching: 'Finding the right professional',
  
  // Internal to external mapping
  internalToExternal: {
    client: 'Client',
    professional: 'Professional',
    job: 'Request',
    hiring: 'Client Mode',
    working: 'Professional Mode',
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
  'Architects, Design & Management',
  'Transport & Logistics',
  'Kitchen & Bathroom',
  'Floors, Doors & Windows',
  'Handyman & General',
  'Commercial & Industrial',
  'Legal & Regulatory',
] as const;

export type MainCategory = typeof MAIN_CATEGORIES[number];
