/**
 * PRO READINESS CHECK
 * 
 * Centralized logic for determining if a professional is "ready"
 * to perform marketplace actions (messaging clients, applying to jobs).
 * 
 * Used by both UI (to disable buttons) and action layer (to throw errors).
 */

import type { ProfessionalProfileData } from '@/hooks/useSessionSnapshot';

export interface ProReadinessResult {
  isReady: boolean;
  reasons: ProReadinessReason[];
}

export type ProReadinessReason = 
  | 'NO_PROFILE'
  | 'NOT_VERIFIED'
  | 'ONBOARDING_INCOMPLETE'
  | 'NO_SERVICES';

/**
 * Evaluate professional readiness for marketplace actions.
 * Returns both a boolean and specific reason codes for UI messaging.
 */
export function getProReadiness(
  profile: ProfessionalProfileData | null
): ProReadinessResult {
  const reasons: ProReadinessReason[] = [];

  if (!profile) {
    return { isReady: false, reasons: ['NO_PROFILE'] };
  }

  if (profile.verificationStatus !== 'verified') {
    reasons.push('NOT_VERIFIED');
  }

  // Valid phases that indicate onboarding is sufficiently complete
  const validPhases = ['service_setup', 'complete'];
  if (!validPhases.includes(profile.onboardingPhase)) {
    reasons.push('ONBOARDING_INCOMPLETE');
  }

  if (profile.servicesCount === 0) {
    reasons.push('NO_SERVICES');
  }

  return {
    isReady: reasons.length === 0,
    reasons,
  };
}

/**
 * Get a user-friendly message based on the first blocking reason.
 */
export function getProReadinessMessage(reasons: ProReadinessReason[]): string {
  if (reasons.includes('NO_SERVICES')) {
    return "Complete your service setup to message clients";
  }
  if (reasons.includes('NOT_VERIFIED')) {
    return "Complete verification to message clients";
  }
  if (reasons.includes('ONBOARDING_INCOMPLETE')) {
    return "Complete your professional setup to message clients";
  }
  if (reasons.includes('NO_PROFILE')) {
    return "Set up your professional profile to message clients";
  }
  return "Complete your professional setup to message clients";
}
