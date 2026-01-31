/**
 * ROUTE MATCHING - Path matching and config lookup
 * 
 * This module handles converting route patterns to regex and finding route configs.
 */

import type { RouteConfig } from './rules';
import { allRoutes } from './registry';

/**
 * Convert a route pattern like "/jobs/:id" into a regex.
 */
function routePatternToRegex(pattern: string): RegExp {
  const routeRegex = pattern
    .replace(/:\w+/g, '[^/]+') // Replace :param with regex
    .replace(/\*/g, '.*'); // Replace * with wildcard

  return new RegExp(`^${routeRegex}$`);
}

/**
 * Get route config by path.
 * Tries exact match first, then pattern matching for dynamic routes.
 */
export function getRouteConfig(path: string): RouteConfig | undefined {
  // Exact match first
  const exactMatch = allRoutes.find((r) => r.path === path);
  if (exactMatch) return exactMatch;

  // Pattern match for dynamic routes
  for (const route of allRoutes) {
    const regex = routePatternToRegex(route.path);
    if (regex.test(path)) return route;
  }

  return undefined;
}
