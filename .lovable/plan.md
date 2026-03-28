

# Gold = Invite & Earned Only + Checkout Gating

## Summary

Make Gold visibly priced but clearly non-purchasable ("Invite & Earned Only"), remove it from all checkout/webhook flows, add a `STRIPE_CHECKOUT_LIVE` safety flag so Silver/Elite show "Coming Soon" until the webhook secret is configured, and fix the ForProfessionals reputation ladder to include Elite.

## Changes

### 1. `src/domain/entitlements.ts`

- Add `TIER_META` constant:
  ```ts
  export const TIER_META: Record<SubscriptionTier, { earned: boolean; purchasable: boolean }> = {
    bronze: { earned: false, purchasable: false },
    silver: { earned: false, purchasable: true },
    gold:   { earned: true,  purchasable: false },
    elite:  { earned: false, purchasable: true },
  };
  ```
- Add safety flag: `export const STRIPE_CHECKOUT_LIVE = false;`
- Remove `gold` from `STRIPE_PRICE_IDS` (type becomes `Record<'silver' | 'elite', string>`)
- Keep Gold in `TIER_PRICES` (€99) and `COMMISSION_RATES` (9%) — display only

### 2. `src/pages/public/Pricing.tsx`

- Set `earned: true` on Gold in the `PLANS` array
- Gold card rendering:
  - Show "Invite & Earned Only" badge (amber styled, like "Most Popular" badge on Silver)
  - Price displays as `€99` with subtext `/mo value` instead of `/mo`
  - CTA button: disabled with text "Earned by reputation" (no click handler)
- Silver/Elite cards: when `STRIPE_CHECKOUT_LIVE === false`, CTA shows "Coming Soon" (disabled) instead of "Subscribe"
- `handleSubscribe`: early return if `TIER_META[tier].purchasable === false`

### 3. `src/pages/public/ForProfessionals.tsx`

- Update `TIERS` array: Gold gets `earned: true`, add label distinction
- Gold tier card: show "Invite & Earned" tag instead of plain price, still display `€99/mo value`
- Fix reputation ladder (line 192): add Elite to the array `['Bronze', 'Silver', 'Gold', 'Elite']` with appropriate styling (dark/black for Elite)
- Gold step in ladder gets a subtle "earned" label

### 4. `supabase/functions/create-checkout-session/index.ts`

- Remove `gold` from `PRICE_IDS` map (only `silver` and `elite` remain)
- Update error message: `'Invalid tier. Must be silver or elite.'`

### 5. `supabase/functions/stripe-webhook/index.ts`

- Remove gold price ID mapping from `TIER_COMMISSION` (only silver and elite remain)
- If an unknown price ID comes through, it defaults to bronze/18% (already handled by fallback)

### 6. `.lovable/plan.md`

- Update to reflect Gold = earned/invite only, not purchasable
- Note `STRIPE_CHECKOUT_LIVE` flag for gating

## What stays unchanged

- Gold's entitlements in `FEATURE_MAP` — full feature set remains
- Gold's commission rate (9%) and price (€99) — visible as value anchors
- All pages remain behind `trust-engine` rollout gate — safe to publish
- `useSubscription` hook and `SessionContext` — no changes needed

## Gating summary

| Element | Gated by |
|---|---|
| `/pricing`, `/for-professionals` pages | `trust-engine` rollout phase (not yet active) |
| Silver/Elite checkout buttons | `STRIPE_CHECKOUT_LIVE` flag (set to `false`) |
| Gold checkout | Removed entirely from Stripe flow |

