/**
 * REDIRECT HELPERS - Loop-safe redirect URL building
 * 
 * THIS IS THE SINGLE SOURCE OF TRUTH FOR REDIRECT LOGIC.
 * 
 * Rule:
 * - Only append returnUrl when redirecting to /auth routes
 * - For other redirect targets (like onboarding), redirect directly
 * - This prevents redirect loops
 */

/**
 * Build a return URL from the current location
 */
export function buildReturnUrl(pathname: string, search: string): string {
  return `${pathname}${search || ''}`;
}

/**
 * Build the full redirect URL with optional returnUrl.
 * Only appends returnUrl for /auth routes to prevent loops.
 */
export function buildRedirectUrl(target: string, returnUrl: string): string {
  // Only auth routes should receive returnUrl
  if (target.startsWith('/auth')) {
    return `${target}?returnUrl=${encodeURIComponent(returnUrl)}`;
  }

  // Non-auth redirects go directly (no returnUrl to prevent loops)
  return target;
}

/**
 * Validate a returnUrl / authRedirect value before navigating.
 *
 * Accepts only same-origin internal app paths. Rejects:
 * - empty / non-string values
 * - protocol-relative URLs (`//evil.com`)
 * - backslash tricks (`/\evil.com`)
 * - any value containing a protocol scheme (`http:`, `https:`, `javascript:`, `data:`, etc.)
 * - absolute URLs
 *
 * Use this everywhere a stored or query-string redirect target is consumed
 * by `navigate(...)`. Unsafe values must fall back to a known-safe default.
 */
export function isSafeReturnUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;

  // Must be an app-internal path
  if (!trimmed.startsWith('/')) return false;

  // Reject protocol-relative (`//host`) and backslash tricks (`/\host`, `/\\host`)
  if (trimmed.startsWith('//')) return false;
  if (trimmed.startsWith('/\\')) return false;

  // Reject any embedded scheme — covers `javascript:`, `http:`, `https:`,
  // `data:`, `vbscript:`, etc. A safe internal path never contains a colon
  // before the first `/` segment ends, but the simplest correct check is
  // to forbid `:` entirely in the path portion before `?`/`#`.
  const pathPortion = trimmed.split(/[?#]/, 1)[0];
  if (pathPortion.includes(':')) return false;

  // Reject control characters / whitespace inside the value (newlines, tabs)
  // which can be used to smuggle headers in some downstream contexts.
  if (/[\u0000-\u001F\u007F]/.test(value)) return false;

  return true;
}
