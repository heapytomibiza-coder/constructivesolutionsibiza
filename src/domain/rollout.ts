/**
 * ROLLOUT PHASE SYSTEM
 *
 * Controls which parts of the site are visible and accessible.
 * Change CURRENT_ROLLOUT to reveal features progressively.
 *
 * Phases (in order):
 *  pipe-control      → Wizard + Jobs + Forum + Messaging
 *  founding-members  → + Professional directory + Pro onboarding
 *  service-layer     → + Services marketplace + Listings
 *  trust-engine      → + Reviews + Ratings + Badges
 *  escrow-beta       → + Payment protection + Escrow
 *  scale-ready       → + Full automation
 */

export type RolloutPhase =
  | 'pipe-control'
  | 'founding-members'
  | 'service-layer'
  | 'trust-engine'
  | 'escrow-beta'
  | 'scale-ready';

const ORDER: RolloutPhase[] = [
  'pipe-control',
  'founding-members',
  'service-layer',
  'trust-engine',
  'escrow-beta',
  'scale-ready',
];

// ✅ Change ONE value to drip-feed features
export const CURRENT_ROLLOUT: RolloutPhase = 'pipe-control';

export function isRolloutActive(
  min: RolloutPhase,
  current: RolloutPhase = CURRENT_ROLLOUT,
): boolean {
  return ORDER.indexOf(current) >= ORDER.indexOf(min);
}
