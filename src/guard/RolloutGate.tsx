/**
 * ROLLOUT GATE - Blocks direct URL access to unreleased public routes
 * 
 * Wraps public routes that have `minRollout` in the registry.
 * If the current rollout phase hasn't reached the required phase,
 * redirects to home page — unless the user is an admin.
 */

import { isRolloutActive, type RolloutPhase } from '@/domain/rollout';
import { useSession } from '@/contexts/SessionContext';
import { lazy, Suspense } from 'react';

const ComingSoonPage = lazy(() => import('@/pages/public/ComingSoonPage'));

interface RolloutGateProps {
  min: RolloutPhase;
  children: React.ReactNode;
  /** Fallback copy when gated. If omitted, shows generic message. */
  fallbackTitle?: string;
  fallbackMessage?: string;
}

export function RolloutGate({ min, children, fallbackTitle, fallbackMessage }: RolloutGateProps) {
  const { hasRole, isReady } = useSession();

  // If rollout phase is active, show immediately (no auth needed)
  if (isRolloutActive(min)) {
    return <>{children}</>;
  }

  // Phase not active — wait for session to check admin status
  if (!isReady) {
    return null;
  }

  // Admins can preview gated pages
  if (hasRole('admin')) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={null}>
      <ComingSoonPage
        title={fallbackTitle ?? 'Coming Soon'}
        message={fallbackMessage ?? 'This feature is part of an upcoming release. Check back soon.'}
      />
    </Suspense>
  );
}
