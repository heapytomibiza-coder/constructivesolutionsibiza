/**
 * Wizard Mode Resolver
 * 
 * SINGLE SOURCE OF TRUTH for determining wizard initialization behavior.
 * Eliminates the race between URL params, draft restoration, and search intent.
 * 
 * Priority Order:
 * 1. Explicit search selection → mode=search (never restore draft)
 * 2. Deep-link params (?category, ?pro) → mode=deep-link (never restore draft)
 * 3. Resume flag (?resume=true) → mode=resume (always restore draft)
 * 4. Saved draft exists → mode=prompt (ask user)
 * 5. Default → mode=fresh (clean wizard)
 */

import type { WizardState } from '../types';
import { WizardStep, EMPTY_WIZARD_STATE } from '../types';

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
  
  // For deep-link mode
  pendingLookups?: {
    categoryId?: string;
    subcategoryId?: string;
    targetProfessionalId?: string;
  };
}

// === URL PARSING ===

interface UrlParams {
  step?: string;
  category?: string;
  subcategory?: string;
  pro?: string;
  resume?: boolean;
}

function parseUrlParams(search: string): UrlParams {
  const sp = new URLSearchParams(search);
  return {
    step: sp.get('step') || undefined,
    category: sp.get('category') || undefined,
    subcategory: sp.get('subcategory') || undefined,
    pro: sp.get('pro') || undefined,
    resume: sp.get('resume') === 'true',
  };
}

function hasExplicitIntent(params: UrlParams): boolean {
  return !!(params.category || params.subcategory || params.pro);
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
    if (!parsed.mainCategoryId && parsed.microIds?.length === 0) {
      return null;
    }
    
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
  // Step 7: Review - all required fields present
  if (
    state.mainCategoryId &&
    state.subcategoryId &&
    state.microIds.length > 0 &&
    state.logistics.location &&
    state.logistics.budgetRange
  ) {
    return WizardStep.Review;
  }
  
  // Step 6: Extras - logistics complete
  if (
    state.mainCategoryId &&
    state.subcategoryId &&
    state.microIds.length > 0 &&
    state.logistics.location &&
    state.logistics.budgetRange
  ) {
    return WizardStep.Extras;
  }
  
  // Step 5: Logistics - questions answered or skipped
  if (
    state.mainCategoryId &&
    state.subcategoryId &&
    state.microIds.length > 0
  ) {
    // If user has already filled logistics, go there
    if (state.logistics.location) {
      return WizardStep.Logistics;
    }
    // Otherwise, continue to questions if micros are selected
    return WizardStep.Questions;
  }
  
  // Step 4: Questions - micros selected
  if (
    state.mainCategoryId &&
    state.subcategoryId &&
    state.microIds.length > 0
  ) {
    return WizardStep.Questions;
  }
  
  // Step 3: Micro - subcategory selected
  if (state.mainCategoryId && state.subcategoryId) {
    return WizardStep.Micro;
  }
  
  // Step 2: Subcategory - category selected
  if (state.mainCategoryId) {
    return WizardStep.Subcategory;
  }
  
  // Step 1: Category - start
  return WizardStep.Category;
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
  if (hasExplicitIntent(params)) {
    return {
      mode: 'deep-link',
      initialState: EMPTY_WIZARD_STATE,
      initialStep: WizardStep.Category, // Will be updated after lookup
      shouldPromptDraft: false,
      pendingLookups: {
        categoryId: params.category,
        subcategoryId: params.subcategory,
        targetProfessionalId: params.pro,
      },
    };
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
      answers: {}, // Reset answers for new selection
      logistics: result.extracted?.urgency
        ? { ...currentState.logistics, startDatePreset: result.extracted.urgency }
        : currentState.logistics,
    },
    step: WizardStep.Questions,
  };
}
