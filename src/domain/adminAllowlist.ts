/**
 * ADMIN EMAIL ALLOWLIST - Frontend guard (UX layer)
 * 
 * Real security is enforced at the database level via is_admin_email().
 * This is a convenience check to hide admin UI from non-allowlisted users.
 */

export const ADMIN_EMAIL_ALLOWLIST = new Set(
  [
    'heapytomibiza@gmail.com',
    'constructivesolutionsibiza@gmail.com',
    'heapymagic@googlemail.com',
  ].map((e) => e.trim().toLowerCase())
);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAIL_ALLOWLIST.has(email.trim().toLowerCase());
}
