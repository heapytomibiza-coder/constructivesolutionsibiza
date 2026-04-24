/**
 * ENSURE USER ROLES
 *
 * Queries user_roles with a single retry to handle replication lag.
 * Throws if the row is missing after retry — callers must handle the error.
 *
 * Why: The handle_new_user() trigger creates this row on signup,
 * but a short replication delay after email confirmation can cause
 * a momentary miss. One retry with a brief delay covers this.
 *
 * Telemetry: every call emits a structured `[role-load]` console log with
 * source, duration_ms, attempts, and outcome — useful for diagnosing slow
 * role lookups or AbortError attribution under load.
 */

import { supabase } from '@/integrations/supabase/client';

interface UserRolesResult {
  activeRole: string;
  roles: string[];
}

const RETRY_DELAY_MS = 1500;

/** Identifies which UI component initiated a role load — helps attribute aborts under load. */
export type RoleLoadSource = 'auth_signin' | 'auth_callback' | 'session_snapshot' | 'unknown';

/**
 * Custom error class for aborted requests. Callers can detect this and
 * silently ignore — an abort means the request was cancelled (usually by
 * navigation away), not that role loading actually failed.
 */
export class RoleLoadAbortedError extends Error {
  constructor(public readonly source: RoleLoadSource = 'unknown') {
    super('Role load aborted');
    this.name = 'RoleLoadAbortedError';
  }
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; message?: string; code?: string };
  return (
    e.name === 'AbortError' ||
    e.code === '20' ||
    /aborted|abortError|signal is aborted/i.test(e.message ?? '')
  );
}

interface RoleLoadTelemetry {
  source: RoleLoadSource;
  outcome: 'success' | 'aborted' | 'missing' | 'error';
  duration_ms: number;
  attempts: 1 | 2;
  error_message?: string;
}

/** Emits a structured log for role-load attempts. Cheap, observable in console capture. */
function emitTelemetry(t: RoleLoadTelemetry) {
  const payload = { ...t, ts: new Date().toISOString() };
  // Warn-level for anything that's not a clean success so it stands out
  // in production console capture and error_events ingestion.
  if (t.outcome === 'success') {
    console.info('[role-load]', JSON.stringify(payload));
  } else {
    console.warn('[role-load]', JSON.stringify(payload));
  }
}

/** Safely parse a user_roles row, guarding against null/malformed roles */
function parseRolesRow(row: { active_role: string; roles: unknown }): UserRolesResult {
  const roles = Array.isArray(row.roles) ? (row.roles as string[]) : [];
  const activeRole = row.active_role || (roles[0] ?? 'client');
  if (roles.length === 0) {
    throw new Error('Your account roles are missing. Please contact support.');
  }
  return { activeRole, roles };
}

export async function ensureUserRoles(
  userId: string,
  source: RoleLoadSource = 'unknown'
): Promise<UserRolesResult> {
  const start = performance.now();
  const query = () =>
    supabase
      .from('user_roles')
      .select('roles, active_role')
      .eq('user_id', userId)
      .maybeSingle();

  let firstResult;
  try {
    firstResult = await query();
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    if (isAbortError(err)) {
      emitTelemetry({ source, outcome: 'aborted', duration_ms: duration, attempts: 1 });
      throw new RoleLoadAbortedError(source);
    }
    emitTelemetry({
      source,
      outcome: 'error',
      duration_ms: duration,
      attempts: 1,
      error_message: (err as Error)?.message,
    });
    throw err;
  }

  const { data, error } = firstResult;

  if (error && error.code !== 'PGRST116') {
    const duration = Math.round(performance.now() - start);
    if (isAbortError(error)) {
      emitTelemetry({ source, outcome: 'aborted', duration_ms: duration, attempts: 1 });
      throw new RoleLoadAbortedError(source);
    }
    emitTelemetry({
      source,
      outcome: 'error',
      duration_ms: duration,
      attempts: 1,
      error_message: error.message,
    });
    throw new Error(`Failed to load account roles: ${error.message}`);
  }

  if (data) {
    emitTelemetry({
      source,
      outcome: 'success',
      duration_ms: Math.round(performance.now() - start),
      attempts: 1,
    });
    return parseRolesRow(data);
  }

  // Retry once after a brief delay (covers replication lag)
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));

  let retryResult;
  try {
    retryResult = await query();
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    if (isAbortError(err)) {
      emitTelemetry({ source, outcome: 'aborted', duration_ms: duration, attempts: 2 });
      throw new RoleLoadAbortedError(source);
    }
    emitTelemetry({
      source,
      outcome: 'error',
      duration_ms: duration,
      attempts: 2,
      error_message: (err as Error)?.message,
    });
    throw err;
  }

  const { data: retryData, error: retryError } = retryResult;

  if (retryError && retryError.code !== 'PGRST116') {
    const duration = Math.round(performance.now() - start);
    if (isAbortError(retryError)) {
      emitTelemetry({ source, outcome: 'aborted', duration_ms: duration, attempts: 2 });
      throw new RoleLoadAbortedError(source);
    }
    emitTelemetry({
      source,
      outcome: 'error',
      duration_ms: duration,
      attempts: 2,
      error_message: retryError.message,
    });
    throw new Error(`Failed to load account roles: ${retryError.message}`);
  }

  if (retryData) {
    emitTelemetry({
      source,
      outcome: 'success',
      duration_ms: Math.round(performance.now() - start),
      attempts: 2,
    });
    return parseRolesRow(retryData);
  }

  emitTelemetry({
    source,
    outcome: 'missing',
    duration_ms: Math.round(performance.now() - start),
    attempts: 2,
  });

  // Still missing — this is a real problem, not a race condition
  throw new Error(
    'Your account was created but role setup did not complete. Please sign out and back in, or contact support.'
  );
}
