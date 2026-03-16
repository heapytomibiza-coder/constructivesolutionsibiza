/**
 * URL Step Sync Hook
 * V3: Gates URL writes behind isInitialized to prevent overwriting deep-link params
 * 
 * FIX: Reads searchParams inside the effect via window.location.search to avoid
 * including the searchParams object in the dependency array, which caused an
 * infinite re-render loop (setSearchParams → new searchParams ref → effect fires again).
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WizardStep } from '../types';

export function useWizardUrlStep(
  currentStep: WizardStep,
  _setCurrentStep: (step: WizardStep) => void,
  isInitialized = true
) {
  const [, setSearchParams] = useSearchParams();

  // NOTE: We intentionally do NOT read step from URL on mount.
  // Mode resolution (resolveWizardMode) handles initial step determination
  // to prevent race conditions between URL parsing and draft restoration.

  // Write step to URL on change (keeps URL in sync as user progresses)
  // CRITICAL: Only write AFTER initialization to avoid overwriting deep-link params
  useEffect(() => {
    if (!isInitialized) return;

    // Read current params from window.location to avoid dependency on searchParams object
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('step', currentStep);
    setSearchParams(newParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isInitialized]);
}
