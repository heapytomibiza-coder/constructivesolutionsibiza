/**
 * SESSION CONTEXT
 * 
 * Provides session state to the entire app via context.
 * Uses useSessionSnapshot internally.
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useSessionSnapshot, type SessionSnapshot } from '@/hooks/useSessionSnapshot';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import { useJobAlerts } from '@/hooks/useJobAlerts';
import { useAttribution } from '@/hooks/useAttribution';
import { useSubscription, type SubscriptionState } from '@/hooks/useSubscription';

interface SessionWithSubscription extends SessionSnapshot {
  subscription: SubscriptionState;
}

const SessionContext = createContext<SessionWithSubscription | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const snapshot = useSessionSnapshot();
  const subscription = useSubscription(snapshot.user?.id ?? null);

  // Capture UTM / referral attribution on landing
  useAttribution();

  // Activate realtime message notifications (toast + browser + sound) for logged-in users
  useMessageNotifications(snapshot.user?.id ?? null);
  useJobAlerts(snapshot.user?.id ?? null, snapshot.activeRole);
  return (
    <SessionContext.Provider value={{ ...snapshot, subscription }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionWithSubscription {
  const context = useContext(SessionContext);
  
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  
  return context;
}
