/**
 * ENSURE USER ROLES
 *
 * Queries user_roles with a single retry to handle replication lag.
 * Throws if the row is missing after retry — callers must handle the error.
 *
 * Why: The handle_new_user() trigger creates this row on signup,
 * but a short replication delay after email confirmation can cause
 * a momentary miss. One retry with a brief delay covers this.
 */

import { supabase } from '@/integrations/supabase/client';

interface UserRolesResult {
  activeRole: string;
  roles: string[];
}

const RETRY_DELAY_MS = 1500;

/**
 * Custom error class for aborted requests. Callers can detect this and
 * silently ignore — an abort means the request was cancelled (usually by
 * navigation away), not that role loading actually failed.
 */
export class RoleLoadAbortedError extends Error {
  constructor() {
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

/** Safely parse a user_roles row, guarding against null/malformed roles */
function parseRolesRow(row: { active_role: string; roles: unknown }): UserRolesResult {
  const roles = Array.isArray(row.roles) ? (row.roles as string[]) : [];
  const activeRole = row.active_role || (roles[0] ?? 'client');
  if (roles.length === 0) {
    throw new Error('Your account roles are missing. Please contact support.');
  }
  return { activeRole, roles };
}

export async function ensureUserRoles(userId: string): Promise<UserRolesResult> {
  const query = () =>
    supabase
      .from('user_roles')
      .select('roles, active_role')
      .eq('user_id', userId)
      .maybeSingle();

  const { data, error } = await query();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to load account roles: ${error.message}`);
  }

  if (data) {
    return parseRolesRow(data);
  }

  // Retry once after a brief delay (covers replication lag)
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));

  const { data: retryData, error: retryError } = await query();

  if (retryError && retryError.code !== 'PGRST116') {
    throw new Error(`Failed to load account roles: ${retryError.message}`);
  }

  if (retryData) {
    return parseRolesRow(retryData);
  }

  // Still missing — this is a real problem, not a race condition
  throw new Error(
    'Your account was created but role setup did not complete. Please sign out and back in, or contact support.'
  );
}
