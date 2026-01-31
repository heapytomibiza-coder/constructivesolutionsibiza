/**
 * ROUTE REGISTRY - Types and helpers
 * 
 * THIS FILE IS THE SINGLE SOURCE OF TRUTH FOR ACCESS RULE TYPES.
 * Do not duplicate these types elsewhere.
 *
 * Access Rules:
 * - public: No auth required, anyone can access
 * - auth: Requires authenticated user
 * - role:client: Requires client role
 * - role:professional: Requires professional role
 * - proReady: Professional with verified + onboarding complete + active service
 * - admin2FA: Admin role with 2FA verified
 */

export type AccessRule =
  | 'public'
  | 'auth'
  | 'role:client'
  | 'role:professional'
  | 'proReady'
  | 'admin2FA';

export interface RouteConfig {
  path: string;
  access: AccessRule;
  redirectTo?: string; // Where to redirect if access denied
}
