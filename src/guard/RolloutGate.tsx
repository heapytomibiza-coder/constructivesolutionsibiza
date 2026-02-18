/**
 * ROLLOUT GATE - Blocks direct URL access to unreleased public routes
 * 
 * Wraps public routes that have `minRollout` in the registry.
 * If the current rollout phase hasn't reached the required phase,
 * redirects to home page.
 */

import { Navigate } from 'react-router-dom';
import { isRolloutActive, type RolloutPhase } from '@/domain/rollout';

interface RolloutGateProps {
  min: RolloutPhase;
  children: React.ReactNode;
}

export function RolloutGate({ min, children }: RolloutGateProps) {
  if (!isRolloutActive(min)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
