/**
 * DEBUG CONTEXT STORE
 *
 * Lightweight in-memory store (no React) that captures the last
 * Supabase error so the "Report a problem" button can include it.
 * Also fans out to the journey trace system for diagnostic visibility.
 */

import { logJourneyEvent, JOURNEY_EVENTS } from '@/lib/journey';

interface SupabaseErrorSnapshot {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  capturedAt: string;
}

interface DebugContext {
  lastSupabaseError?: SupabaseErrorSnapshot;
}

const ctx: DebugContext = {};

export function setLastSupabaseError(err: unknown) {
  if (!err || typeof err !== 'object') return;
  const e = err as Record<string, unknown>;
  const snapshot: SupabaseErrorSnapshot = {
    message: (e.message as string) ?? String(err),
    code: e.code as string | undefined,
    details: e.details as string | undefined,
    hint: e.hint as string | undefined,
    capturedAt: new Date().toISOString(),
  };
  ctx.lastSupabaseError = snapshot;

  // Diagnostic fan-out (fire-and-forget)
  try {
    logJourneyEvent(JOURNEY_EVENTS.SUPABASE_ERROR, {
      success: false,
      errorMessage: snapshot.message?.slice(0, 500),
      errorCode: snapshot.code,
      payload: { hint: snapshot.hint?.slice(0, 200) },
    });
  } catch { /* swallow */ }
}

export function getDebugContext(): Readonly<DebugContext> {
  return { ...ctx };
}
