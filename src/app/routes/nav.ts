/**
 * NAV HELPERS - Centralized navigation logic
 * 
 * Derives all nav state from the route registry.
 * Components should use these helpers instead of hardcoded nav arrays.
 */

import type { NavSection, RouteConfig, AccessRule } from './rules';
import { getNavBySection } from './match';
import type { UserRole } from '@/hooks/useSessionSnapshot';
import { isRolloutActive } from '@/domain/rollout';


/**
 * Section render order for nav menus
 */
export const SECTION_ORDER: NavSection[] = ['public', 'hiring', 'working', 'shared', 'account'];

/**
 * Section labels (i18n keys)
 */
export const SECTION_LABELS: Record<NavSection, string> = {
  public: 'lanes.discover',
  hiring: 'lanes.hiring',
  working: 'lanes.working',
  shared: 'lanes.shared',
  account: 'lanes.account',
};

/**
 * Get the lane section that corresponds to a role
 */
export function getActiveLaneSection(activeRole?: UserRole): NavSection | null {
  if (activeRole === 'client') return 'hiring';
  if (activeRole === 'professional') return 'working';
  return null;
}

/**
 * Determine which sections should be visible based on auth state and roles
 */
export function getVisibleSections(opts: {
  isAuthenticated: boolean;
  roles: UserRole[];
  activeRole?: UserRole;
}): NavSection[] {
  const { isAuthenticated, roles, activeRole } = opts;

  // Always show public discovery
  const sections: NavSection[] = ['public'];

  if (!isAuthenticated) {
    // Public visitor: no lane sections, but shared (forum) is public
    return sections;
  }

  // Authenticated user:
  // Show their active lane (or both if they have both roles for dual-mode)
  const hasClient = roles.includes('client');
  const hasPro = roles.includes('professional');

  // For single-role or dual-role with active role set, show only the active lane
  if (activeRole === 'client' && hasClient) {
    sections.push('hiring');
  } else if (activeRole === 'professional' && hasPro) {
    sections.push('working');
  } else {
    // Fallback: show both if dual-role
    if (hasClient) sections.push('hiring');
    if (hasPro) sections.push('working');
  }

  sections.push('shared', 'account');
  return sections;
}

/**
 * Check if a specific route should be visible in nav based on auth context
 */
export function canSeeRoute(route: RouteConfig, ctx: {
  isAuthenticated: boolean;
  roles: UserRole[];
  activeRole?: UserRole;
  userEmail?: string | null;
}): boolean {
  // Rollout gating: hide unreleased routes from nav
  if (route.minRollout && !isRolloutActive(route.minRollout)) return false;

  const { isAuthenticated, roles, userEmail } = ctx;

  // Check nav visibility flags
  if (isAuthenticated && route.nav?.hideWhenAuthed) return false;
  if (!isAuthenticated && route.nav?.hideWhenPublic) return false;

  // Check access rules
  return checkAccess(route.access, { ...ctx, userEmail });
}

/**
 * Check if access rule passes for context
 */
function checkAccess(access: AccessRule, ctx: {
  isAuthenticated: boolean;
  roles: UserRole[];
  userEmail?: string | null;
}): boolean {
  const { isAuthenticated, roles, userEmail } = ctx;

  switch (access) {
    case 'public':
      return true;
    case 'auth':
      return isAuthenticated;
    case 'role:client':
      return isAuthenticated && roles.includes('client');
    case 'role:professional':
      return isAuthenticated && roles.includes('professional');
    case 'proReady':
      return isAuthenticated && roles.includes('professional');
    case 'admin':
      return isAuthenticated && roles.includes('admin');
    default:
      return false;
  }
}

/**
 * Get routes for a specific section, filtered by visibility
 */
export function getRoutesForSection(
  section: NavSection,
  ctx: {
    isAuthenticated: boolean;
    roles: UserRole[];
    activeRole?: UserRole;
    userEmail?: string | null;
  }
): RouteConfig[] {
  const navModel = getNavBySection();
  const routes = navModel[section] ?? [];
  
  return routes.filter((route) => canSeeRoute(route, ctx));
}

/**
 * Get the full nav model with visibility applied
 */
export function getVisibleNavModel(ctx: {
  isAuthenticated: boolean;
  roles: UserRole[];
  activeRole?: UserRole;
  userEmail?: string | null;
}): Record<NavSection, RouteConfig[]> {
  const sections = getVisibleSections(ctx);
  const result: Partial<Record<NavSection, RouteConfig[]>> = {};

  for (const section of sections) {
    const routes = getRoutesForSection(section, ctx);
    if (routes.length > 0) {
      result[section] = routes;
    }
  }

  return result as Record<NavSection, RouteConfig[]>;
}

/**
 * Get dashboard path based on active role
 */
export function getDashboardPath(activeRole?: UserRole): string {
  return activeRole === 'professional' ? '/dashboard/pro' : '/dashboard/client';
}
