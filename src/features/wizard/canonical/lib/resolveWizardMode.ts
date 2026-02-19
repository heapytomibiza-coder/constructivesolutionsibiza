/**
 * Wizard Mode Resolver
 * 
 * SINGLE SOURCE OF TRUTH for determining wizard initialization behavior.
 * Eliminates the race between URL params, draft restoration, and search intent.
 * 
 * Priority Order:
 * 1. Explicit search selection → mode=search (never restore draft)
 * 2. Deep-link params (?category, ?subcategory, ?micro) → mode=deep-link (never restore draft)
 * 3. Resume flag (?resume=true) → mode=resume (always restore draft)
 * 4. Saved draft exists → mode=prompt (ask user)
 * 5. Default → mode=fresh (clean wizard)
 * 
 * URL Param Contract (from search types):
 * - ?category=UUID&step=subcategory → Category selected, go to subcategory step
 * - ?category=UUID&subcategory=UUID&step=micro → Cat+Sub selected, go to micro step
 * - ?category=UUID&subcategory=UUID&micro=SLUG&step=questions → Full hierarchy, go to questions
 */

import type { WizardState } from '../types';
import { WizardStep, EMPTY_WIZARD_STATE, isValidStep, getStepIndex } from '../types';

// === MODE TYPES ===

export type WizardMode = 
  | 'fresh'      // Clean start, no draft
  | 'search'     // Search result selected, bypass draft
  | 'deep-link'  // URL params provided, bypass draft
  | 'resume'     // Explicit resume request (from auth callback)
  | 'prompt';    // Draft exists, ask user

export interface ModeResolution {
  mode: WizardMode;
  initialState: WizardState;
  initialStep: WizardStep;
  shouldPromptDraft: boolean;
  
  // For deep-link mode - lookups needed to populate state
  pendingLookups?: {
    categoryId?: string;
    subcategoryId?: string;
    microSlug?: string;
    targetProfessionalId?: string;
  };
}

// === URL PARSING ===

interface UrlParams {
  step?: string;
  category?: string;
  subcategory?: string;
  micro?: string;        // Can be slug or ID
  pro?: string;
  resume?: boolean;
}

function parseUrlParams(search: string): UrlParams {
  const sp = new URLSearchParams(search);
  return {
    step: sp.get('step') || undefined,
    category: sp.get('category') || undefined,
    subcategory: sp.get('subcategory') || undefined,
    micro: sp.get('micro') || undefined,
    pro: sp.get('pro') || undefined,
    resume: sp.get('resume') === 'true',
  };
}

/**
 * Check if URL has explicit navigation intent (not just step param)
 */
function hasExplicitIntent(params: UrlParams): boolean {
  return !!(params.category || params.subcategory || params.micro || params.pro);
}

/**
 * Determine the target step based on what params are provided.
 * 
 * ENFORCEMENT RULES (prevents wrong-step issues):
 * - step=questions requires micro param
 * - step=micro requires subcategory param
 * - step=subcategory requires category param
 * Falls back to the highest valid step if params are missing.
 * 
 * This follows the contract from search types:
 * - category only → subcategory step
 * - category + subcategory → micro step
 * - category + subcategory + micro → questions step
 */
function deriveTargetStepFromParams(params: UrlParams): WizardStep {
  // If step is explicitly provided, validate param requirements
  if (params.step && isValidStep(params.step)) {
    const requestedStep = params.step as WizardStep;
    
    // ENFORCEMENT: step=questions requires micro
    if (requestedStep === WizardStep.Questions && !params.micro) {
      // step=questions requested but micro missing - falling back
      return params.subcategory 
        ? WizardStep.Micro 
        : params.category 
          ? WizardStep.Subcategory 
          : WizardStep.Category;
    }
    
    // ENFORCEMENT: step=micro requires subcategory OR micro param (microOnly pattern)
    if (requestedStep === WizardStep.Micro && !params.subcategory && !params.micro) {
      // step=micro requested but no context - falling back
      return params.category ? WizardStep.Subcategory : WizardStep.Category;
    }
    
    // ENFORCEMENT: step=subcategory requires category
    if (requestedStep === WizardStep.Subcategory && !params.category) {
      // step=subcategory requested but category missing - falling back
      return WizardStep.Category;
    }
    
    // Validation passed - use requested step
    return requestedStep;
  }
  
  // No explicit step - derive from param completeness
  // ENFORCEMENT: Only go to Questions if we have FULL hierarchy
  // (the deep-link processor will hydrate parents from micro if needed)
  if (params.category && params.subcategory && params.micro) {
    return WizardStep.Questions;
  }
  
  // Micro-only: Start at Micro step as a safe interim
  // Deep-link processor will attempt hydration and may upgrade to Questions
  if (params.micro) {
    return WizardStep.Micro;
  }
  
  if (params.subcategory) {
    return WizardStep.Micro;
  }
  if (params.category) {
    return WizardStep.Subcategory;
  }

  return WizardStep.Category;
}

// === DRAFT DETECTION ===

const STORAGE_KEY = 'wizardState';
const DRAFT_CHECKED_KEY = 'wizardDraftChecked';

function getDraft(): WizardState | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as WizardState;

    // Validate draft has meaningful data
    const hasMicros = Array.isArray(parsed.microIds) && parsed.microIds.length > 0;
    if (!parsed.mainCategoryId && !hasMicros) return null;

    return parsed;
  } catch {
    return null;
  }
}

function hasDraftBeenChecked(): boolean {
  return sessionStorage.getItem(DRAFT_CHECKED_KEY) === '1';
}

export function markDraftChecked(): void {
  sessionStorage.setItem(DRAFT_CHECKED_KEY, '1');
}

export function clearDraftChecked(): void {
  sessionStorage.removeItem(DRAFT_CHECKED_KEY);
}

// === STEP DERIVATION (key insight from user feedback) ===

/**
 * Derive the appropriate step from state completeness.
 * This replaces mutable step state with computed values.
 */
export function deriveStepFromState(state: WizardState): WizardStep {
  // Step 1: Category
  if (!state.mainCategoryId) return WizardStep.Category;

  // Step 2: Subcategory
  if (!state.subcategoryId) return WizardStep.Subcategory;

  // Step 3: Micro
  if (!state.microIds || state.microIds.length === 0) return WizardStep.Micro;

  // Step 4: Questions
  // Check if microAnswers has any actual answered content (not just empty pack containers)
  const microAnswersObj = state.answers?.microAnswers;
  const hasAnyAnswers = microAnswersObj && Object.values(microAnswersObj).some(
    pack => pack && typeof pack === 'object' && Object.keys(pack as object).length > 0
  );
  const hasLogisticsStarted = !!state.logistics?.location || !!state.logistics?.budgetRange;
  if (!hasAnyAnswers && !hasLogisticsStarted) return WizardStep.Questions;

  // Step 5: Logistics
  const hasLocation = !!state.logistics?.location;
  const hasBudget = !!state.logistics?.budgetRange;
  if (!hasLocation || !hasBudget) return WizardStep.Logistics;

  // Step 6: Extras / Step 7: Review
  // Once required logistics is complete, Review is reachable
  return WizardStep.Review;
}

// === MAIN RESOLVER ===

export interface ResolverInput {
  urlSearch: string;
  searchResult?: {
    categoryId: string;
    categoryName: string;
    subcategoryId: string;
    subcategoryName: string;
    microId: string;
    microName: string;
    microSlug: string;
  };
}

/**
 * Resolve wizard mode from URL, search selection, and draft state.
 * Call this ONCE on wizard mount (or when search selects).
 * 
 * KEY PRINCIPLE: The wizard is the ONLY place that resolves URL → state.
 * All entry points (search, category pages, dashboard) just navigate to URLs.
 */
export function resolveWizardMode(input: ResolverInput): ModeResolution {
  const params = parseUrlParams(input.urlSearch);
  
  // === PRIORITY 1: Search selection (explicit user action) ===
  if (input.searchResult) {
    const result = input.searchResult;
    const state: WizardState = {
      ...EMPTY_WIZARD_STATE,
      mainCategory: result.categoryName,
      mainCategoryId: result.categoryId,
      subcategory: result.subcategoryName,
      subcategoryId: result.subcategoryId,
      microNames: [result.microName],
      microIds: [result.microId],
      microSlugs: [result.microSlug],
    };
    
    return {
      mode: 'search',
      initialState: state,
      initialStep: WizardStep.Questions, // Search always goes to questions
      shouldPromptDraft: false,
    };
  }
  
  // === PRIORITY 2: Explicit resume (from auth callback) ===
  if (params.resume) {
    const draft = getDraft();
    if (draft) {
      return {
        mode: 'resume',
        initialState: draft,
        initialStep: deriveStepFromState(draft),
        shouldPromptDraft: false,
      };
    }
    // No draft to resume, fall through to fresh
  }
  
  // === PRIORITY 3: Deep-link with explicit params ===
  // This handles search result navigation via URL
  if (hasExplicitIntent(params)) {
    const targetStep = deriveTargetStepFromParams(params);
    
    return {
      mode: 'deep-link',
      initialState: EMPTY_WIZARD_STATE,
      initialStep: targetStep,
      shouldPromptDraft: false,
      pendingLookups: {
        categoryId: params.category,
        subcategoryId: params.subcategory,
        microSlug: params.micro,
        targetProfessionalId: params.pro,
      },
    };
  }
  
  // === PRIORITY 3.5: Step-only navigation (restore draft to reach step) ===
  if (params.step && isValidStep(params.step)) {
    const draft = getDraft();
    if (draft) {
      // Draft exists - restore it and navigate to requested step
      // But only if the step is reachable given the draft's state
      const maxReachableStep = deriveStepFromState(draft);
      const requestedStepIndex = getStepIndex(params.step as WizardStep);
      const maxStepIndex = getStepIndex(maxReachableStep);
      
      // Allow navigation to any step up to the max reachable
      const targetStep = requestedStepIndex <= maxStepIndex 
        ? params.step as WizardStep 
        : maxReachableStep;
      
      return {
        mode: 'resume',
        initialState: draft,
        initialStep: targetStep,
        shouldPromptDraft: false,
      };
    }
    // No draft - can't navigate to step, fall through to fresh
  }
  
  // === PRIORITY 4: Check for existing draft (only if not already checked) ===
  if (!hasDraftBeenChecked()) {
    const draft = getDraft();
    if (draft) {
      return {
        mode: 'prompt',
        initialState: EMPTY_WIZARD_STATE, // Will be set if user chooses resume
        initialStep: WizardStep.Category,
        shouldPromptDraft: true,
      };
    }
  }
  
  // === PRIORITY 5: Fresh start ===
  return {
    mode: 'fresh',
    initialState: EMPTY_WIZARD_STATE,
    initialStep: WizardStep.Category,
    shouldPromptDraft: false,
  };
}

// === HELPER: Apply search result to existing state ===

/**
 * When user selects a search result mid-wizard, apply it and jump to questions.
 * Returns the new state and step.
 */
export function applySearchResult(
  currentState: WizardState,
  result: {
    categoryId: string;
    categoryName: string;
    subcategoryId: string;
    subcategoryName: string;
    microId: string;
    microName: string;
    microSlug: string;
    extracted?: {
      urgency?: string;
      locationText?: string;
    };
  }
): { state: WizardState; step: WizardStep } {
  return {
    state: {
      ...currentState,
      mainCategory: result.categoryName,
      mainCategoryId: result.categoryId,
      subcategory: result.subcategoryName,
      subcategoryId: result.subcategoryId,
      microNames: [result.microName],
      microIds: [result.microId],
      microSlugs: [result.microSlug],
      answers: { microAnswers: {} }, // Reset answers for new selection
      logistics: result.extracted?.urgency
        ? { ...currentState.logistics, startDatePreset: result.extracted.urgency }
        : currentState.logistics,
    },
    step: WizardStep.Questions,
  };
}

// === VALIDATION HELPERS ===

/**
 * Validate that lookup results match expectations.
 * If invalid, fall back to earlier step.
 */
export function validateLookupResult(
  lookups: ModeResolution['pendingLookups'],
  result: {
    categoryId?: string;
    subcategoryId?: string;
    microId?: string;
  }
): { isValid: boolean; fallbackStep: WizardStep } {
  // If micro was requested but not found, fall back to micro step
  if (lookups?.microSlug && !result.microId) {
    return { isValid: false, fallbackStep: WizardStep.Micro };
  }
  
  // If subcategory was requested but not found, fall back to subcategory step
  if (lookups?.subcategoryId && !result.subcategoryId) {
    return { isValid: false, fallbackStep: WizardStep.Subcategory };
  }
  
  // If category was requested but not found, fall back to category step
  if (lookups?.categoryId && !result.categoryId) {
    return { isValid: false, fallbackStep: WizardStep.Category };
  }
  
  return { isValid: true, fallbackStep: WizardStep.Category };
}
