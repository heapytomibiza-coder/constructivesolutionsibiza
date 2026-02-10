/**
 * ACCESS CONTROL - Pure access checking function
 * 
 * This is the single source of truth for access rule evaluation.
 * All access decisions are made here based on the rule and context.
 */

import type { AccessRule } from '@/app/routes';

export type Role = 'client' | 'professional' | 'admin';

export interface AccessContext {
  isAuthenticated: boolean;
  hasRole: (role: Role) => boolean;
  isProReady: boolean;
}

/**
 * Check if access is granted based on the rule and context.
 * Returns true if access is allowed, false otherwise.
 */
export function checkAccess(rule: AccessRule, ctx: AccessContext): boolean {
  switch (rule) {
    case 'public':
      return true;

    case 'auth':
      return ctx.isAuthenticated;

    case 'role:client':
      return ctx.isAuthenticated && ctx.hasRole('client');

    case 'role:professional':
      return ctx.isAuthenticated && ctx.hasRole('professional');

    case 'proReady':
      return ctx.isAuthenticated && ctx.hasRole('professional') && ctx.isProReady;

    case 'admin2FA':
      // For now, just check admin role. 2FA can be added later.
      return ctx.isAuthenticated && ctx.hasRole('admin');

    default:
      // Unknown access rule - deny by default
      return false;
  }
}
