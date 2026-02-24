/**
 * DEBUG CONTEXT STORE
 *
 * Lightweight in-memory store (no React) that captures the last
 * Supabase error so the "Report a problem" button can include it.
 */

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
  ctx.lastSupabaseError = {
    message: (e.message as string) ?? String(err),
    code: e.code as string | undefined,
    details: e.details as string | undefined,
    hint: e.hint as string | undefined,
    capturedAt: new Date().toISOString(),
  };
}

export function getDebugContext(): Readonly<DebugContext> {
  return { ...ctx };
}
