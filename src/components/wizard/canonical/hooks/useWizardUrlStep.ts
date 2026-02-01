/**
 * URL Step Sync Hook
 * V2: Uses string enum for URL-safe step persistence
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WizardStep, isValidStep } from '../types';

export function useWizardUrlStep(
  currentStep: WizardStep,
  setCurrentStep: (step: WizardStep) => void
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read step from URL on mount
  useEffect(() => {
    const stepFromUrl = searchParams.get('step');
    if (stepFromUrl && isValidStep(stepFromUrl)) {
      setCurrentStep(stepFromUrl);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write step to URL on change
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('step', currentStep);
    setSearchParams(newParams, { replace: true });
  }, [currentStep, searchParams, setSearchParams]);
}
