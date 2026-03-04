/**
 * URL Step Sync Hook
 * V3: Gates URL writes behind isInitialized to prevent overwriting deep-link params
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WizardStep } from '../types';

export function useWizardUrlStep(
  currentStep: WizardStep,
  _setCurrentStep: (step: WizardStep) => void,
  isInitialized = true
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // NOTE: We intentionally do NOT read step from URL on mount.
  // Mode resolution (resolveWizardMode) handles initial step determination
  // to prevent race conditions between URL parsing and draft restoration.

  // Write step to URL on change (keeps URL in sync as user progresses)
  // CRITICAL: Only write AFTER initialization to avoid overwriting deep-link params
  useEffect(() => {
    if (!isInitialized) return;

    const newParams = new URLSearchParams(searchParams);
    newParams.set('step', currentStep);
    setSearchParams(newParams, { replace: true });
  }, [currentStep, isInitialized, searchParams, setSearchParams]);
}
