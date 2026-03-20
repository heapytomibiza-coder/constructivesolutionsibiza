/**
 * ROUTES - Single public entry point
 * 
 * THIS IS THE SINGLE SOURCE OF TRUTH FOR ROUTE IMPORTS.
 * Developers should import routes helpers/types from here:
 *   import { allRoutes, getRouteConfig, isPublicPath, type AccessRule } from '@/app/routes';
 * 
 * Do not import from submodules directly in application code.
 */

// Route registry
export { 
  allRoutes,
  publicRoutes,
  authRoutes,
  clientRoutes,
  proOnboardingRoutes,
  proDashboardRoutes,
  disputeRoutes,
} from './registry';

// Route matching
export { getRouteConfig, getLaneForPath, getNavRoutes, getNavBySection } from './match';

// Route types
export type { AccessRule, RouteConfig, RouteLane, NavSection } from './rules';

// Nav helpers
export {
  SECTION_ORDER,
  SECTION_LABELS,
  getActiveLaneSection,
  getVisibleSections,
  canSeeRoute,
  getRoutesForSection,
  getVisibleNavModel,
  getDashboardPath,
} from './nav';

import { getRouteConfig } from './match';

/**
 * Check if a path is public (no auth required)
 */
export function isPublicPath(path: string): boolean {
  const config = getRouteConfig(path);
  return config?.access === 'public';
}
