
# Professional Journey Hardening — Implementation Status

## ✅ All 5 Tasks Completed

**Two service layers exist today:**
- `professional_services` — service tags (micro_id selections). Used by `professional_matching_scores` view for matching. Has `status`, `notify`, `searchable` columns.
- `service_listings` — public marketplace pages (display_title, pricing, hero image). Used by `service_listings_browse` view for public browsing. Status: draft/live.

**Current matching flow** (`professional_matching_scores` view): Scores professionals based on `professional_services` rows only. Factors: preference (love/like/neutral/avoid), completed_jobs_count, avg_rating, verification_level. Does NOT check if the pro has a live `service_listing` for that micro.

**Current browse flow** (`service_listings_browse` view): Shows live listings with provider info, pricing, ratings. Completely separate from matching.

**Current limits** (SQL `get_tier_limit()` + `entitlements.ts`):
- Bronze: 3 listings / Silver: 10 / Gold: 25 / Elite: 50

---

## Task Execution Order

### Task 1: Recalibrate Live Listing Limits

**What changes:**
- Bronze: 3 → 15
- Silver: 10 → 30
- Gold: 25 → unlimited (use 9999 internally)
- Elite: 50 → unlimited (use 9999 internally)

**Files to modify:**
1. `src/domain/entitlements.ts` — Update `FEATURE_MAP.listing_limit` values
2. SQL migration — Update `get_tier_limit()` function's `listing_limit` CASE block
3. `public/locales/en/common.json` — Update pricing copy (Silver: "30 live listings", Gold/Elite: "Unlimited listings")
4. `public/locales/es/common.json` — Same for Spanish
5. `src/pages/public/Pricing.tsx` — Update comparison row to reflect unlimited for Gold/Elite

**Unlimited representation:** Use 9999 as the internal ceiling. Add a helper `isEffectivelyUnlimited(limit: number): boolean` in `entitlements.ts` that returns `true` for values >= 9999. UI uses this to display "Unlimited" instead of a number.

**Drift risk:** SQL `get_tier_limit()` and `entitlements.ts` must both be updated.

---

### Task 2: Separate Live Service Pages from Profile Service Tags

**What this means in code terms:**
The separation already exists structurally (`professional_services` vs `service_listings`). The gap is that the UI and matching logic don't distinguish between "pro has a live listing for X" vs "pro has selected X as a capability tag."

**What changes:**
1. Add a `has_live_listing` boolean column to `professional_matching_scores` view — joins `service_listings` to check if a live listing exists for that user_id + micro_id pair
2. In `getRankedProfessionals()` — expose `has_live_listing` in the aggregation so it can be used for sorting
3. In public profile drawer (`ProProfileDrawer.tsx`) — visually distinguish services that have live pages (clickable, with preview) from tag-only services (badge/chip only)

**Files to modify:**
1. SQL migration — Recreate `professional_matching_scores` view with LEFT JOIN on `service_listings`
2. `src/pages/public/queries/rankedProfessionals.query.ts` — Include `has_live_listing` in score aggregation
3. `src/pages/dashboard/client/components/ProProfileDrawer.tsx` — Visual distinction

---

### Task 3: Weight Live Pages Above Tag-Only Matches

**What changes:**
Add a scoring bonus in the `professional_matching_scores` view for professionals who have a live listing for the matched micro.

**Scoring addition (in SQL view):**
```
+ CASE WHEN EXISTS (
    SELECT 1 FROM service_listings sl
    WHERE sl.provider_id = ps.user_id
      AND sl.micro_id = ps.micro_id
      AND sl.status = 'live'
  ) THEN 25 ELSE 0 END
```

This gives a 25-point bonus (comparable to "love" preference at 30) to pros with live listings, making them rank above tag-only matches while keeping the merit-based foundation intact.

**Files to modify:**
1. SQL migration — Update `professional_matching_scores` view (combined with Task 2 migration)
2. No client-side changes needed — the view feeds existing sorting logic

---

### Task 4: Add Live-Listing Add-On Architecture (Schema Only)

**What changes:**
Create a `listing_addons` table and extend `get_tier_limit()` to account for purchased add-ons.

**New table:**
```sql
CREATE TABLE public.listing_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  extra_listings INTEGER NOT NULL DEFAULT 10,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- NULL = permanent
  stripe_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled'))
);
```

**Update `get_tier_limit()`:** For `listing_limit`, add the sum of active add-on `extra_listings` to the base tier limit.

**Files to modify:**
1. SQL migration — New table + RLS + updated `get_tier_limit()`
2. `src/domain/entitlements.ts` — Add note about add-on architecture
3. No UI for purchasing add-ons yet (schema preparation only)

---

### Task 5: Audit Verification (No Code Changes)

Document the full professional journey as verified against real code. This is already provided in the user's message and confirmed by the audit. No additional code changes needed — the documentation lives in `.lovable/plan.md`.

---

## Implementation Sequence

1. **Task 1** (listing limit recalibration) — standalone, no dependencies
2. **Tasks 2 + 3** (combined into one migration) — rebuild `professional_matching_scores` with live-listing awareness and scoring bonus
3. **Task 4** (add-on schema) — depends on Task 1's updated `get_tier_limit()`

**Total migrations:** 3
**Total TS files modified:** ~6
**Total locale files modified:** 2

## What Is NOT Changed
- Ranking engine remains merit-first (live listing bonus is additive, not multiplicative)
- Trust score remains earned, not purchasable
- `visibility_boost`, `priority_matching`, `featured_slots` remain `@planned` — not activated
- Onboarding flow unchanged
- Quote daily limits unchanged
- Portfolio limits unchanged
