/**
 * URL Step Sync Hook
 * Matches V1 behaviour: step is persisted in URL query param
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useWizardUrlStep(
  currentStep: number,
  setCurrentStep: (step: number) => void
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read step from URL on mount
  useEffect(() => {
    const stepFromUrl = parseInt(searchParams.get('step') || '1', 10);
    if (!Number.isNaN(stepFromUrl) && stepFromUrl >= 1 && stepFromUrl <= 7) {
      setCurrentStep(stepFromUrl);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write step to URL on change
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('step', String(currentStep));
    setSearchParams(newParams, { replace: true });
  }, [currentStep, searchParams, setSearchParams]);
}
