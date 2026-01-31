/**
 * SESSION CONTEXT
 * 
 * Provides session state to the entire app via context.
 * Uses useSessionSnapshot internally.
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useSessionSnapshot, type SessionSnapshot } from '@/hooks/useSessionSnapshot';

const SessionContext = createContext<SessionSnapshot | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const snapshot = useSessionSnapshot();

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
