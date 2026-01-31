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
