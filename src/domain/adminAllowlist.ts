/**
 * ADMIN CHECK - Frontend guard (UX layer only)
 * 
 * Real security is enforced at the database level via is_admin_email() + has_role().
 * Frontend uses hasRole('admin') from session context — no emails needed client-side.
 * 
 * This file is kept as a thin re-export for backward compatibility.
 * All consumers should migrate to using hasRole('admin') from useSession().
 */

/**
 * @deprecated Use hasRole('admin') from useSession() instead.
 * Kept for backward compatibility — always returns false now.
 * Real admin gating is DB-level via is_admin_email().
 */
export function isAdminEmail(_email?: string | null): boolean {
  // No-op: admin status is determined by the 'admin' role in session context.
  // DB-level is_admin_email() handles real security.
  return false;
}
