/**
 * Wizard Draft Save/Restore Hook
 * V1 behaviour: server-first with sessionStorage fallback
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { WizardState, } from '../types';
import { EMPTY_WIZARD_STATE } from '../types';

type DraftResult =
  | { status: 'none' }
  | { status: 'found'; payload: WizardState; updated_at?: string };

const STORAGE_KEY = 'wizardState';
const DRAFT_MODAL_KEY = 'draftModalShown';
const PENDING_DRAFT_KEY = 'pendingDraft';

function isWizardEmpty(state: WizardState): boolean {
  return (
    state.mainCategoryId === '' &&
    state.subcategoryId === '' &&
    state.microIds.length === 0
  );
}

export function useWizardDraft(wizardState: WizardState) {
  const [isDirty, setIsDirty] = useState(false);
  const initialStateRef = useRef<string>('');
  const [draftFound, setDraftFound] = useState<DraftResult>({ status: 'none' });

  const wizardJson = useMemo(
    () => JSON.stringify(wizardState),
    [wizardState]
  );

  // Dirty detection
  useEffect(() => {
    if (initialStateRef.current === '') {
      initialStateRef.current = wizardJson;
      return;
    }
    setIsDirty(wizardJson !== initialStateRef.current);
  }, [wizardJson]);

  // Debounced save to sessionStorage (600ms)
  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, wizardJson);
      } catch (e) {
        console.warn('Failed to save wizard draft:', e);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [wizardJson, isDirty]);

  // Check for existing draft (call once on mount)
  const checkForDraft = (): DraftResult => {
    // Only show modal once per session
    if (sessionStorage.getItem(DRAFT_MODAL_KEY) === '1') {
      return { status: 'none' };
    }

    // Only check if current state is empty
    if (!isWizardEmpty(wizardState)) {
      return { status: 'none' };
    }

    sessionStorage.setItem(DRAFT_MODAL_KEY, '1');

    // Check sessionStorage for draft
    const local = sessionStorage.getItem(STORAGE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local) as WizardState;
        
        // Validate it has meaningful data
        if (parsed.mainCategoryId || parsed.microIds?.length > 0) {
          const result: DraftResult = { status: 'found', payload: parsed };
          setDraftFound(result);
          sessionStorage.setItem(PENDING_DRAFT_KEY, JSON.stringify(parsed));
          return result;
        }
      } catch {
        // Invalid JSON, ignore
      }
    }

    return { status: 'none' };
  };

  // Get pending draft for restore
  const getPendingDraft = (): WizardState | null => {
    const pending = sessionStorage.getItem(PENDING_DRAFT_KEY);
    if (pending) {
      try {
        return JSON.parse(pending) as WizardState;
      } catch {
        return null;
      }
    }
    return null;
  };

  // Clear all draft data
  const clearDraft = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(PENDING_DRAFT_KEY);
    setDraftFound({ status: 'none' });
  };

  // Reset for fresh start
  const resetSession = () => {
    sessionStorage.removeItem(DRAFT_MODAL_KEY);
    clearDraft();
  };

  return {
    isDirty,
    draftFound,
    checkForDraft,
    getPendingDraft,
    clearDraft,
    resetSession,
  };
}
