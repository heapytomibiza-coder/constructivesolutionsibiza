/**
 * useEntitlements — single ergonomic API for tier-based feature gating.
 *
 * Combines subscription state with the entitlement contract so consumers
 * never need to import hasFeature/getLimit separately.
 *
 * Usage:
 *   const { tier, can, limit, commissionRate, isLoading } = useEntitlements();
 *   if (can('demand_data')) { ... }
 *   const max = limit('portfolio_limit');
 */

import { useSession } from '@/contexts/SessionContext';
import {
  hasFeature,
  getLimit,
  type SubscriptionTier,
  type TierEntitlements,
} from '@/domain/entitlements';

export interface EntitlementsAPI {
  /** Current subscription tier */
  tier: SubscriptionTier;
  /** Subscription status */
  status: 'active' | 'past_due' | 'cancelled';
  /** Authoritative commission rate from DB */
  commissionRate: number;
  /** Whether subscription data is still loading */
  isLoading: boolean;
  /** Check if a boolean feature is enabled for the current tier */
  can: (feature: keyof TierEntitlements) => boolean;
  /** Get a numeric limit for the current tier */
  limit: (feature: keyof TierEntitlements) => number;
}

export function useEntitlements(): EntitlementsAPI {
  const { subscription } = useSession();

  return {
    tier: subscription.tier,
    status: subscription.status,
    commissionRate: subscription.commissionRate,
    isLoading: subscription.isLoading,
    can: (feature) => hasFeature(subscription.tier, feature),
    limit: (feature) => getLimit(subscription.tier, feature),
  };
}
