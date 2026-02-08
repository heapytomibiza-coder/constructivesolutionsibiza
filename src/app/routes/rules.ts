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

/**
 * Lane = "clear pathways" + "where they meet"
 * - public: Discovery pages (home, services, professionals)
 * - auth: Auth flow pages
 * - client: Hiring lane (post job, client dashboard)
 * - professional: Working lane (pro dashboard, onboarding)
 * - shared: Where both meet (messages, settings, forum posting)
 * - admin: Platform management
 */
export type RouteLane = 'public' | 'auth' | 'client' | 'professional' | 'shared' | 'admin';

/**
 * Nav sections = how you visually group links in navigation
 */
export type NavSection = 'public' | 'hiring' | 'working' | 'shared' | 'account';

export interface RouteConfig {
  path: string;
  access: AccessRule;
  redirectTo?: string; // Where to redirect if access denied

  /**
   * Visual pathway map
   * - client = Hiring lane
   * - professional = Working lane
   * - shared = where both meet (messages/settings/etc)
   */
  lane?: RouteLane;

  /**
   * Optional nav model - if present, route can be auto-rendered in nav
   */
  nav?: {
    section: NavSection;
    labelKey: string; // i18n key (e.g., 'nav.postJob')
    order?: number; // Sort order within section
    hideWhenAuthed?: boolean; // Hide from nav when user is authenticated
    hideWhenPublic?: boolean; // Hide from nav when user is NOT authenticated
  };

  /**
   * Optional page title key (for headers/breadcrumbs)
   */
  titleKey?: string;
}
