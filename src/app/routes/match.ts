/**
 * ROUTE MATCHING - Path matching and config lookup
 * 
 * This module handles converting route patterns to regex and finding route configs.
 */

import type { RouteConfig, RouteLane } from './rules';
import { allRoutes } from './registry';

// Cache for compiled regexes (performance optimization)
const regexCache = new Map<string, RegExp>();

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert a route pattern like "/jobs/:id" into a regex.
 */
function routePatternToRegex(pattern: string): RegExp {
  const cached = regexCache.get(pattern);
  if (cached) return cached;

  // Escape regex chars, then re-enable our route syntax
  const escaped = escapeRegex(pattern)
    .replace(/\\:\w+/g, '[^/]+') // Replace :param with regex
    .replace(/\\\*/g, '.*'); // Replace * with wildcard

  const regex = new RegExp(`^${escaped}$`);
  regexCache.set(pattern, regex);
  return regex;
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

/**
 * Get lane for the current path (used for "pathways + convergence")
 */
export function getLaneForPath(path: string): RouteLane {
  return getRouteConfig(path)?.lane ?? 'public';
}

/**
 * Get nav-enabled routes (for auto-building menus)
 */
export function getNavRoutes(): RouteConfig[] {
  return allRoutes
    .filter((r) => r.nav)
    .sort((a, b) => (a.nav!.order ?? 999) - (b.nav!.order ?? 999));
}
