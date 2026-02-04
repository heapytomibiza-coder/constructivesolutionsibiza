/**
 * PRO READINESS CHECK
 * 
 * Centralized logic for determining if a professional is "ready"
 * to perform marketplace actions (messaging clients, applying to jobs).
 * 
 * Used by both UI (to disable buttons) and action layer (to throw errors).
 * 
 * NOTE: This is UX gating only. Real enforcement should be added to the RPC in V2.
 * An authenticated user could technically bypass this by calling RPCs directly.
 */

import { UserError } from "@/shared/lib/userError";
import type { ProfessionalProfileData } from '@/hooks/useSessionSnapshot';

export type ProReadinessReason = 
  | 'NO_PROFILE'
  | 'NOT_VERIFIED'
  | 'ONBOARDING_INCOMPLETE'
  | 'NO_SERVICES';

export interface ProReadinessResult {
  isReady: boolean;
  reasons: ProReadinessReason[];
}

/** 
 * Valid onboarding phases that indicate sufficient setup progress.
 * Must match canonical phases from onboarding flow.
 */
const VALID_PHASES = new Set(['service_configured', 'complete']);

/**
 * Evaluate professional readiness for marketplace actions.
 * Returns both a boolean and specific reason codes for UI messaging.
 */
export function getProReadiness(
  profile: ProfessionalProfileData | null
): ProReadinessResult {
  if (!profile) {
    return { isReady: false, reasons: ['NO_PROFILE'] };
  }

  const reasons: ProReadinessReason[] = [];

  if (profile.verificationStatus !== 'verified') {
    reasons.push('NOT_VERIFIED');
  }

  if (!VALID_PHASES.has(profile.onboardingPhase)) {
    reasons.push('ONBOARDING_INCOMPLETE');
  }

  // Only block when servicesCount is definitively zero, not when unknown/loading
  if (typeof profile.servicesCount === 'number' && profile.servicesCount <= 0) {
    reasons.push('NO_SERVICES');
  }

  return {
    isReady: reasons.length === 0,
    reasons,
  };
}

/**
 * Get a user-friendly message based on the blocking reasons.
 */
export function getProReadinessMessage(reasons: ProReadinessReason[]): string {
  if (reasons.includes('NO_SERVICES')) {
    return "Complete your service setup to message clients";
  }
  if (reasons.includes('NOT_VERIFIED')) {
    return "Complete verification to message clients";
  }
  if (reasons.includes('NO_PROFILE')) {
    return "Set up your professional profile to message clients";
  }
  return "Complete your professional setup to message clients";
}

/**
 * Guard function that throws UserError if professional is not ready.
 * Use in action layer before performing marketplace operations.
 */
export function requireProReady(
  profile: ProfessionalProfileData | null
): void {
  const { isReady, reasons } = getProReadiness(profile);
  
  if (!isReady) {
    throw new UserError(getProReadinessMessage(reasons), "PRO_NOT_READY");
  }
}
