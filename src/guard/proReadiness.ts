/**
 * PRO READINESS CHECK
 * 
 * Centralized logic for determining if a professional is "ready"
 * to perform marketplace actions (messaging clients, applying to jobs).
 * 
 * Used by both UI (to disable buttons) and action layer (to throw errors).
 * 
 * KEY DESIGN DECISIONS:
 * - Normalizes legacy phase names so old DB values don't brick users
 * - Action-based gating: messaging/applying ≠ booking/payout
 * - Returns `nextAction` with deep-link so UI can route to the exact missing step
 * - Verification is a trust badge, NOT a marketplace gate (for MESSAGE/APPLY)
 */

import { UserError } from "@/shared/lib/userError";
import type { ProfessionalProfileData } from '@/hooks/useSessionSnapshot';
import { isPhaseReady } from '@/pages/onboarding/lib/phaseProgression';

export type ProReadinessReason = 
  | 'NO_PROFILE'
  | 'NOT_VERIFIED'
  | 'ONBOARDING_INCOMPLETE'
  | 'NO_SERVICES';

export type ProAction = 'MESSAGE' | 'APPLY' | 'BOOK' | 'PAYOUT';

export interface ProReadinessResult {
  isReady: boolean;
  reasons: ProReadinessReason[];
  /** Where the UI should send the user to fix the primary issue */
  nextAction?: {
    label: string;
    href: string;
  };
}

/**
 * Per-action policy. Keeps verification decoupled from basic marketplace actions.
 */
const ACTION_POLICY: Record<ProAction, {
  requireVerified: boolean;
  requireReadyPhase: boolean;
  requireServices: boolean;
}> = {
  MESSAGE: { requireVerified: false, requireReadyPhase: true, requireServices: true },
  APPLY:   { requireVerified: false, requireReadyPhase: true, requireServices: true },
  BOOK:    { requireVerified: true,  requireReadyPhase: true, requireServices: true },
  PAYOUT:  { requireVerified: true,  requireReadyPhase: true, requireServices: true },
};

function buildNextAction(reasons: ProReadinessReason[]): ProReadinessResult['nextAction'] {
  if (reasons.includes('NO_PROFILE')) {
    return { label: "Set up profile", href: "/onboarding/professional?step=basic_info" };
  }
  if (reasons.includes('ONBOARDING_INCOMPLETE')) {
    return { label: "Complete setup", href: "/onboarding/professional" };
  }
  if (reasons.includes('NO_SERVICES')) {
    return { label: "Set up services", href: "/onboarding/professional?step=services" };
  }
  if (reasons.includes('NOT_VERIFIED')) {
    return { label: "Verify account", href: "/onboarding/professional" };
  }
  return undefined;
}

/**
 * Evaluate professional readiness for a given marketplace action.
 * Returns both a boolean and specific reason codes for UI messaging.
 */
export function getProReadiness(
  profile: ProfessionalProfileData | null,
  action: ProAction = 'MESSAGE',
): ProReadinessResult {
  if (!profile) {
    const reasons: ProReadinessReason[] = ['NO_PROFILE'];
    return { isReady: false, reasons, nextAction: buildNextAction(reasons) };
  }

  const reasons: ProReadinessReason[] = [];
  const policy = ACTION_POLICY[action];

  if (policy.requireVerified && profile.verificationStatus !== 'verified') {
    reasons.push('NOT_VERIFIED');
  }

  if (policy.requireReadyPhase && !isPhaseReady(profile.onboardingPhase)) {
    reasons.push('ONBOARDING_INCOMPLETE');
  }

  // Only block when servicesCount is definitively zero, not when unknown/loading
  if (policy.requireServices) {
    if (typeof profile.servicesCount === 'number' && profile.servicesCount <= 0) {
      reasons.push('NO_SERVICES');
    }
  }

  return {
    isReady: reasons.length === 0,
    reasons,
    nextAction: reasons.length ? buildNextAction(reasons) : undefined,
  };
}

/**
 * Get a user-friendly message based on the blocking reasons.
 */
export function getProReadinessMessage(reasons: ProReadinessReason[]): string {
  if (reasons.includes('NO_PROFILE')) {
    return "Set up your professional profile to continue";
  }
  if (reasons.includes('ONBOARDING_INCOMPLETE')) {
    return "Complete your setup to continue";
  }
  if (reasons.includes('NO_SERVICES')) {
    return "Add at least one service to continue";
  }
  if (reasons.includes('NOT_VERIFIED')) {
    return "Complete verification to continue";
  }
  return "Complete your professional setup to continue";
}

/**
 * Guard function that throws UserError if professional is not ready.
 * Use in action layer before performing marketplace operations.
 */
export function requireProReady(
  profile: ProfessionalProfileData | null,
  action: ProAction = 'MESSAGE',
): void {
  const { isReady, reasons } = getProReadiness(profile, action);
  
  if (!isReady) {
    throw new UserError(getProReadinessMessage(reasons), "PRO_NOT_READY");
  }
}
