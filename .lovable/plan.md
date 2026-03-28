

# Subscription System — Phase 1 Build

## Context

The Pricing page (`/pricing`) and ForProfessionals page (`/for-professionals`) are both gated behind the `trust-engine` rollout phase. Current rollout is `service-layer`, so **no users can see the misleading pricing page today**. This means we can build the real system before flipping the gate.

## Build Order (8 tickets)

### Ticket 1 — Enable Stripe + Create Products

Use Lovable's Stripe integration to enable Stripe, then create 3 subscription products with monthly prices:

| Product | Monthly | Commission |
|---------|---------|------------|
| Silver  | €49     | 12%        |
| Gold    | €99     | 9%         |
| Elite   | €199    | 6%         |

Bronze is the default (no Stripe product, 18% commission).

### Ticket 2 — Subscriptions Table

Migration to create:

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','elite')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','cancelled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  commission_rate NUMERIC NOT NULL DEFAULT 18,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

RLS: users can read own row, admins can read all. No direct insert/update from client (webhook-only for Stripe fields).

RPC `get_user_tier(p_user_id UUID)` returns tier + commission_rate + status.

### Ticket 3 — Stripe Webhook Edge Function

`supabase/functions/stripe-webhook/index.ts`

Handles:
- `checkout.session.completed` — upsert subscription row with tier + commission
- `invoice.paid` — set status = active
- `invoice.payment_failed` — set status = past_due
- `customer.subscription.deleted` — set tier = bronze, status = cancelled

Tier-to-commission mapping stored as a constant in the function (not frontend).

### Ticket 4 — Checkout Session Edge Function

`supabase/functions/create-checkout-session/index.ts`

Authenticated endpoint. Accepts `{ tier: 'silver' | 'gold' | 'elite' }`, creates a Stripe Checkout session, returns the URL. Validates user auth via JWT in code.

### Ticket 5 — `useSubscription` Hook

New file: `src/hooks/useSubscription.ts`

Queries `subscriptions` table for current user. Returns:
```ts
{ tier, status, commissionRate, isLoading }
```

Exposed via SessionContext so it's available app-wide without extra queries.

### Ticket 6 — Feature Entitlement System

New file: `src/domain/entitlements.ts`

```ts
const FEATURE_MAP = {
  bronze:  { visibility_boost: 0, portfolio_limit: 5, insights: false, priority_matching: false, demand_data: false, featured_slots: false },
  silver:  { visibility_boost: 0.05, portfolio_limit: 15, insights: true, priority_matching: false, demand_data: false, featured_slots: false },
  gold:    { visibility_boost: 0.1, portfolio_limit: 50, insights: true, priority_matching: true, demand_data: true, featured_slots: false },
  elite:   { visibility_boost: 0.2, portfolio_limit: 100, insights: true, priority_matching: true, demand_data: true, featured_slots: true },
};

function hasFeature(tier, feature): boolean
function getLimit(tier, feature): number
```

All tier checks across the app use `hasFeature()` — never raw `tier === 'gold'`.

### Ticket 7 — Pricing Page Rebuild

Update `Pricing.tsx` and `ForProfessionals.tsx`:

- Replace hardcoded prices with the real tier data
- CTA buttons call `create-checkout-session` edge function and redirect to Stripe Checkout
- For Bronze: CTA remains "Get Started" → `/auth`
- For Gold (earned): show "Earned by reputation" with no purchase button
- Add "Launching Soon" badge if Stripe isn't ready yet (feature flag)

### Ticket 8 — Light Ranking Boost

Update the `professional_matching_scores` view to include a small subscription weight:

```
final_score = trust_score + (visibility_boost * 10)
```

Where `visibility_boost` comes from the subscriptions table joined via provider_id. Trust score (rating, preferences, completions) remains 80%+ of the total. Subscription boost is capped so a Bronze pro with great trust always outranks an Elite pro with poor trust.

## Files Involved

| File | Action |
|---|---|
| Migration (new) | subscriptions table + RPC |
| `supabase/functions/stripe-webhook/index.ts` | New edge function |
| `supabase/functions/create-checkout-session/index.ts` | New edge function |
| `supabase/config.toml` | Add function config blocks |
| `src/hooks/useSubscription.ts` | New hook |
| `src/domain/entitlements.ts` | New entitlement system |
| `src/contexts/SessionContext.tsx` | Expose subscription data |
| `src/pages/public/Pricing.tsx` | Rebuild with real checkout |
| `src/pages/public/ForProfessionals.tsx` | Update tier section |
| `professional_matching_scores` view (migration) | Add visibility_boost column |

## Rollout Safety

- Current rollout phase is `service-layer` — pricing pages are hidden until `trust-engine` is activated
- Build everything behind the gate, test, then flip to `trust-engine`
- Bronze is the default for all existing users (no migration of user data needed)
- Webhook is idempotent (uses `stripe_subscription_id` as dedup key)
- Commission rate lives in DB, never in frontend state

## Strategic Alignment Check

- Trust signals (ratings, repeat hires, verification) remain free for all tiers
- Subscriptions sell visibility, speed, and insights — never trust
- Ranking formula ensures trust always dominates over subscription boost
- Gold tier is earned by reputation, reinforcing the "trust first" philosophy

