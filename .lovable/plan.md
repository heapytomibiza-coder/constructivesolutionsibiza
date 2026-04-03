

# Listing Publish Flow & Limit Enforcement Audit

## Files Reviewed

| File | Role |
|------|------|
| `src/domain/entitlements.ts` | Tier contract — defines `listing_limit` per tier |
| `src/lib/listingPublishRules.ts` | Client-side readiness evaluator (title, description, pricing, hero) |
| `src/pages/professional/ServiceListingEditor.tsx` | Editor UI — save, publish, error handling |
| `supabase/migrations/20260403102535_...sql` | `validate_service_listing_live` trigger — server-side enforcement |

---

## What's Correct

1. **Server-side listing limit enforcement is in place.** The `validate_service_listing_live` trigger checks subscription tier and counts live listings on every `draft → live` transition. It defaults to bronze (3) when no active subscription exists.

2. **Client-side readiness checks are guidance only.** `evaluateListingReadiness()` gates the Publish button but the DB trigger is authoritative. Correct layering.

3. **Atomic publish pattern.** `handlePublish` does a single `.update()` combining content + `status: 'live'`, so the trigger fires on the correct final state.

4. **LISTING_LIMIT_REACHED error is caught and surfaced** in the editor with a user-friendly toast.

5. **Grandfather clause** correctly exempts pre-2026-03-19 listings from field validation on first publish, while still enforcing listing limits for all listings.

6. **`published_at` is set server-side** only on transition to live — correct, no client drift.

7. **Live listing save guard** prevents blanking required fields on an already-live listing (lines 76-88).

---

## What's Risky

### 1. Drift: Tier-to-limit mapping duplicated (KNOWN, MEDIUM RISK)

The mapping `bronze→3, silver→10, gold→25, elite→50` exists in two places:
- `src/domain/entitlements.ts` (`FEATURE_MAP.listing_limit`)
- SQL trigger (`CASE v_tier WHEN ...`)

If one is updated without the other, the UI will show a limit that the server doesn't enforce, or vice versa. This was noted previously and remains the primary drift risk.

**Recommended fix:** Extract to a `tier_config` database table that both the trigger and a client-facing RPC can read from. Not urgent, but should be done before adding more tier-aware limits.

### 2. No client-side pre-check for listing limit (LOW RISK)

`evaluateListingReadiness()` and `listingPublishRules.ts` do not check the live listing count. A user at their limit sees the Publish button enabled, clicks it, and only then gets a toast error from the server rejection.

This is functionally correct (server is authoritative) but creates a poor UX. The fix would be to add a `liveLimitReached` field to `ListingPublishInput` and surface it in the readiness evaluator.

### 3. `handleSave` on live listings doesn't enforce listing limit (NO RISK)

The trigger only enforces limits on `draft → live` transition (line 40: `IF OLD.status IS NULL OR OLD.status <> 'live'`). Saving edits on an already-live listing correctly skips the limit check. No issue here.

### 4. Pricing flush before publish is not wrapped in the atomic write (LOW RISK)

`handlePublish` first flushes dirty pricing items via individual `upsertPricing.mutateAsync` calls (lines 151-163), then does the atomic status update. If the status update fails (e.g. limit reached), the pricing items are already persisted. This is acceptable because pricing items on a draft are harmless, but it's worth noting.

---

## Summary Verdict

| Area | Status |
|------|--------|
| Server-side enforcement | Correct and complete |
| Client-side guidance | Correct, could add limit pre-check for UX |
| Tier mapping drift risk | Known, documented, manageable short-term |
| Grandfather clause | Correct |
| Atomic publish | Correct |
| Error handling | Correct |
| Overall readiness | Production-safe as-is |

---

## Recommended Next Fix

**Add a client-side listing limit pre-check** to `listingPublishRules.ts` and the editor so the Publish button is disabled with a clear message when the user has already hit their tier limit. This is a UX improvement only — server enforcement is already authoritative.

Implementation would involve:
1. Extend `ListingPublishInput` with `currentLiveCount: number` and `listingLimit: number`
2. Add a `listing_limit` issue with severity `'required'` when count >= limit
3. Pass the values from the editor using `useEntitlements().limit('listing_limit')` and a count query
4. No SQL changes needed

