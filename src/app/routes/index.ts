/**
 * ROUTES - Single public entry point
 * 
 * THIS IS THE SINGLE SOURCE OF TRUTH FOR ROUTE IMPORTS.
 * Developers should import routes helpers/types from here:
 *   import { allRoutes, getRouteConfig, isPublicPath, type AccessRule } from '@/app/routes';
 * 
 * Do not import from submodules directly in application code.
 */

export { allRoutes } from './registry';
export { getRouteConfig } from './match';
export type { AccessRule, RouteConfig } from './rules';

import { getRouteConfig } from './match';

/**
 * Check if a path is public (no auth required)
 */
export function isPublicPath(path: string): boolean {
  const config = getRouteConfig(path);
  return config?.access === 'public';
}
