/**
 * PHASE PROGRESSION UTILITY
 * 
 * Single source of truth for the professional onboarding lifecycle.
 * Phase can only advance forward — never regress.
 * 
 * Canonical progression:
 *   not_started → basic_info → service_area → service_setup → complete
 */

export const PHASES = [
  'not_started',
  'basic_info',
  'service_area',
  'service_setup',
  'complete',
] as const;

export type CanonicalPhase = (typeof PHASES)[number];

/**
 * Returns the index of a phase in the canonical order.
 * Unknown/legacy phases are treated as index 0 (earliest).
 */
export function phaseIndex(phase?: string | null): number {
  const normalized = normalizePhase(phase);
  const i = PHASES.indexOf(normalized);
  return i === -1 ? 0 : i;
}

/**
 * Map legacy or mismatched phase names to canonical values.
 * Prevents users from being permanently bricked by old DB values.
 */
export function normalizePhase(phase?: string | null): CanonicalPhase {
  if (!phase) return 'not_started';
  switch (phase) {
    case 'verification':
      return 'service_area'; // legacy: was used where service_area should be
    case 'services':
      return 'service_setup'; // legacy alias
    case 'review':
      return 'complete'; // legacy alias
    default:
      return (PHASES.includes(phase as CanonicalPhase) ? phase : 'not_started') as CanonicalPhase;
  }
}

/**
 * Returns `targetPhase` only if it's ahead of `currentPhase`.
 * Otherwise returns `currentPhase` unchanged — preventing regression.
 */
export function nextPhase(
  currentPhase: string | null | undefined,
  targetPhase: CanonicalPhase,
): string {
  const currentNormalized = normalizePhase(currentPhase);
  if (phaseIndex(currentNormalized) < phaseIndex(targetPhase)) {
    return targetPhase;
  }
  return currentNormalized;
}

/**
 * Check if a phase meets the minimum threshold for marketplace readiness.
 * Ready = service_setup or complete.
 */
export function isPhaseReady(phase?: string | null): boolean {
  return phaseIndex(phase) >= phaseIndex('service_setup');
}
