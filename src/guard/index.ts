/**
 * GUARD - Single public entry point for guard components
 * 
 * Import guards from here:
 *   import { RouteGuard, PublicOnlyGuard } from '@/guard';
 */

export { RouteGuard, PublicOnlyGuard } from './RouteGuard';
export { checkAccess, type AccessContext, type Role } from './access';
export { buildRedirectUrl, buildReturnUrl } from './redirects';
