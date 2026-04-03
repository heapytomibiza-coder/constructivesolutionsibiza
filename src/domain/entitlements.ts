/**
 * SUBSCRIPTION ENTITLEMENTS
 *
 * Feature map per tier. All tier checks use hasFeature() / getLimit().
 * Never use raw `tier === 'gold'` checks.
 *
 * ── ENTITLEMENT ENFORCEMENT PATTERN ──
 *
 * When gating a feature or enforcing a limit:
 *
 *   1. Read the user's current tier from useEntitlements()
 *   2. Call hasFeature(tier, 'feature_name') or getLimit(tier, 'limit_name')
 *   3. If denied, show a fallback/upgrade state — never silently hide
 *   4. Never use ad-hoc inline tier checks (e.g. tier === 'gold')
 *   5. Backend RPCs should join subscriptions to enforce server-side
 *
 * The database subscription record is the authoritative source for:
 *   - commission_rate (not the code constant)
 *   - current tier
 *   - subscription status
 *
 * COMMISSION_RATES below is kept only as a display reference for the
 * pricing page. It is NOT authoritative for billing or platform fees.
 * The DB column subscriptions.commission_rate is the source of truth.
 */

export type SubscriptionTier = 'bronze' | 'silver' | 'gold' | 'elite';

export interface TierEntitlements {
  /** @planned — not yet consumed by ranking/matching logic */
  visibility_boost: number;
  portfolio_limit: number;
  listing_limit: number;
  quote_daily_limit: number;
  insights: boolean;
  /** @planned — not yet consumed by matching logic */
  priority_matching: boolean;
  demand_data: boolean;
  /** @planned — not yet consumed by any UI or backend */
  featured_slots: boolean;
}

/** Internal ceiling representing "unlimited" — UI should display "Unlimited" */
export const UNLIMITED_CEILING = 9999;

/** Check if a numeric limit is effectively unlimited */
export function isEffectivelyUnlimited(limit: number): boolean {
  return limit >= UNLIMITED_CEILING;
}

export const FEATURE_MAP: Record<SubscriptionTier, TierEntitlements> = {
  bronze: {
    visibility_boost: 0,
    portfolio_limit: 5,
    listing_limit: 15,
    quote_daily_limit: 5,
    insights: false,
    priority_matching: false,
    demand_data: false,
    featured_slots: false,
  },
  silver: {
    visibility_boost: 0.05,
    portfolio_limit: 15,
    listing_limit: 30,
    quote_daily_limit: 15,
    insights: true,
    priority_matching: false,
    demand_data: false,
    featured_slots: false,
  },
  gold: {
    visibility_boost: 0.1,
    portfolio_limit: 50,
    listing_limit: UNLIMITED_CEILING,
    quote_daily_limit: 30,
    insights: true,
    priority_matching: true,
    demand_data: true,
    featured_slots: false,
  },
  elite: {
    visibility_boost: 0.2,
    portfolio_limit: 100,
    listing_limit: UNLIMITED_CEILING,
    quote_daily_limit: 50,
    insights: true,
    priority_matching: true,
    demand_data: true,
    featured_slots: true,
  },
};

/**
 * Commission rates per tier — DISPLAY REFERENCE ONLY.
 *
 * The authoritative commission rate lives in subscriptions.commission_rate (DB).
 * Use useSubscription().commissionRate for any billing/platform-fee logic.
 */
export const COMMISSION_RATES_DISPLAY: Record<SubscriptionTier, number> = {
  bronze: 18,
  silver: 12,
  gold: 9,
  elite: 6,
};

/**
 * @deprecated Use COMMISSION_RATES_DISPLAY for display or useSubscription().commissionRate for logic.
 */
export const COMMISSION_RATES = COMMISSION_RATES_DISPLAY;

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
