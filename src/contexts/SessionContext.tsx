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

const SessionContext = createContext<SessionSnapshot | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const snapshot = useSessionSnapshot();

  // Capture UTM / referral attribution on landing
  useAttribution();

  // Activate realtime message notifications (toast + browser + sound) for logged-in users
  useMessageNotifications(snapshot.user?.id ?? null);
  useJobAlerts(snapshot.user?.id ?? null, snapshot.activeRole);
  return (
    <SessionContext.Provider value={snapshot}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionSnapshot {
  const context = useContext(SessionContext);
  
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  
  return context;
}
