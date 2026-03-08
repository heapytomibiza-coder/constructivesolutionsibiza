/**
 * ROLLOUT GATE - Blocks direct URL access to unreleased public routes
 * 
 * Wraps public routes that have `minRollout` in the registry.
 * If the current rollout phase hasn't reached the required phase,
 * redirects to home page — unless the user is an admin.
 */

import { Navigate } from 'react-router-dom';
import { isRolloutActive, type RolloutPhase } from '@/domain/rollout';
import { useSession } from '@/contexts/SessionContext';

interface RolloutGateProps {
  min: RolloutPhase;
  children: React.ReactNode;
}

export function RolloutGate({ min, children }: RolloutGateProps) {
  const { hasRole } = useSession();

  // Admins can always preview gated pages
  if (hasRole('admin') || isRolloutActive(min)) {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
}
