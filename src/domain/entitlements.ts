/**
 * SUBSCRIPTION ENTITLEMENTS
 *
 * Feature map per tier. All tier checks use hasFeature() / getLimit().
 * Never use raw `tier === 'gold'` checks.
 */

export type SubscriptionTier = 'bronze' | 'silver' | 'gold' | 'elite';

export interface TierEntitlements {
  visibility_boost: number;
  portfolio_limit: number;
  insights: boolean;
  priority_matching: boolean;
  demand_data: boolean;
  featured_slots: boolean;
}

export const FEATURE_MAP: Record<SubscriptionTier, TierEntitlements> = {
  bronze: {
    visibility_boost: 0,
    portfolio_limit: 5,
    insights: false,
    priority_matching: false,
    demand_data: false,
    featured_slots: false,
  },
  silver: {
    visibility_boost: 0.05,
    portfolio_limit: 15,
    insights: true,
    priority_matching: false,
    demand_data: false,
    featured_slots: false,
  },
  gold: {
    visibility_boost: 0.1,
    portfolio_limit: 50,
    insights: true,
    priority_matching: true,
    demand_data: true,
    featured_slots: false,
  },
  elite: {
    visibility_boost: 0.2,
    portfolio_limit: 100,
    insights: true,
    priority_matching: true,
    demand_data: true,
    featured_slots: true,
  },
};

/** Commission rates per tier (percentage) */
export const COMMISSION_RATES: Record<SubscriptionTier, number> = {
  bronze: 18,
  silver: 12,
  gold: 9,
  elite: 6,
};

/** Tier metadata — earned vs purchasable */
export const TIER_META: Record<SubscriptionTier, {
  earned: boolean;
  purchasable: boolean;
  inviteOnly: boolean;
}> = {
  bronze: { earned: false, purchasable: false, inviteOnly: false },
  silver: { earned: false, purchasable: true,  inviteOnly: false },
  gold:   { earned: true,  purchasable: false, inviteOnly: true  },
  elite:  { earned: false, purchasable: true,  inviteOnly: false },
};

/** Safety flag — set to true once Stripe webhook secret is configured */
export const STRIPE_CHECKOUT_LIVE = false;

/** Stripe price IDs mapped to purchasable tiers only */
export const STRIPE_PRICE_IDS: Record<'silver' | 'elite', string> = {
  silver: 'price_1TG3HUAsoYCrHLeBJ0XM4Ks3',
  elite: 'price_1TG3HXAsoYCrHLeBlwitj6fQ',
};

/** Monthly prices in EUR */
export const TIER_PRICES: Record<SubscriptionTier, number | null> = {
  bronze: 0,
  silver: 49,
  gold: 99,
  elite: 199,
};

/** Check if a tier has a boolean feature enabled */
export function hasFeature(
  tier: SubscriptionTier,
  feature: keyof TierEntitlements,
): boolean {
  return !!FEATURE_MAP[tier]?.[feature];
}

/** Get a numeric limit for a tier */
export function getLimit(
  tier: SubscriptionTier,
  feature: keyof TierEntitlements,
): number {
  const value = FEATURE_MAP[tier]?.[feature];
  return typeof value === 'number' ? value : 0;
}
