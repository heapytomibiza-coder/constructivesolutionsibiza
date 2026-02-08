/**
 * URL Step Sync Hook
 * V2: Uses string enum for URL-safe step persistence
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WizardStep } from '../types';

export function useWizardUrlStep(
  currentStep: WizardStep,
  _setCurrentStep: (step: WizardStep) => void
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // NOTE: We intentionally do NOT read step from URL on mount.
  // Mode resolution (resolveWizardMode) handles initial step determination
  // to prevent race conditions between URL parsing and draft restoration.

  // Write step to URL on change (keeps URL in sync as user progresses)
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('step', currentStep);
    setSearchParams(newParams, { replace: true });
  }, [currentStep, searchParams, setSearchParams]);
}
