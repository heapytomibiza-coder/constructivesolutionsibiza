/**
 * GUARD - Single public entry point for guard components
 * 
 * Import guards from here:
 *   import { RouteGuard, PublicOnlyGuard } from '@/guard';
 */

export { RouteGuard, PublicOnlyGuard } from './RouteGuard';
export { RolloutGate } from './RolloutGate';
export { checkAccess, type AccessContext, type Role } from './access';
export { buildRedirectUrl, buildReturnUrl } from './redirects';
export { 
  getProReadiness, 
  getProReadinessMessage,
  type ProReadinessResult, 
  type ProReadinessReason 
} from './proReadiness';
