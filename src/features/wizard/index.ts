/**
 * Wizard Feature Module
 * 
 * DOMAIN: Job creation wizard
 * Contains the canonical wizard, DB-powered selectors, and wizard-specific lib functions.
 */

// Main component
export { CanonicalJobWizard } from './canonical/CanonicalJobWizard';

// Types
export * from './canonical/types';

// Hooks
export { useWizardUrlStep, useWizardDraft } from './canonical/hooks';

// Lib
export { 
  buildJobInsert, 
  buildIdempotencyKey, 
  validateWizardState 
} from './canonical/lib';

export {
  buildWizardLink,
  type WizardLinkParams,
} from './lib/wizardLink';

export {
  evaluateRules,
  mergeRuleEvaluations,
  requiresInspection,
  isEmergency,
  type PackRule,
  type RuleEvaluation,
} from './lib/evaluatePackRules';

// Steps
export * from './canonical/steps';

// DB-powered selectors
export { default as CategorySelector } from './db-powered/CategorySelector';
export { default as SubcategorySelector } from './db-powered/SubcategorySelector';
export { default as MicroStep } from './db-powered/MicroStep';
export { ServiceSearchBar, type SearchResult, type SearchDepth } from './db-powered/ServiceSearchBar';
