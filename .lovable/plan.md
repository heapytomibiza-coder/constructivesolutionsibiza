
# Next Hardening Pass

Three targeted changes in priority order. No ranking/matching changes. No billing changes.

---

## 1. Strip Unenforced Premium Claims from Pricing UI

**Problem:** `visibility_boost`, `priority_matching`, and `featured_slots` appear in the entitlement contract but are not consumed by any ranking, matching, or UI logic. If these are shown on a pricing page, they are false promises.

**Action:**
- Audit the pricing/plan comparison UI for references to these three features
- Remove or hide them from customer-facing plan presentation
- Keep them in `entitlements.ts` as future placeholders (with a clear `@planned` comment)
- No SQL changes

**Files to check:** pricing page components, any tier comparison table

---

## 2. Enforce `portfolio_limit` at Creation Time

**Problem:** `portfolio_limit` is defined per tier (bronze=5, silver=15, gold=50, elite=100) but not enforced anywhere.

**Action:**
- Add a DB trigger on `portfolio_projects` that checks count against tier limit on INSERT (same pattern as listing limit trigger)
- Default to bronze (5) when no subscription row exists
- Add client-side pre-check in the portfolio creation flow (same pattern as listing limit pre-check)
- Surface a clear error message when limit is reached

**Files involved:**
- New migration (portfolio limit trigger)
- Portfolio creation component (client-side guard)
- `src/lib/` or existing portfolio hook (pre-check logic)

---

## 3. Harden Listing-Limit Toast Copy

Two small refinements to the previous listing-limit work:

**3a. Centralize issue message resolution**
- Move the special-case `listing_limit` message out of the inline toast path in `ServiceListingEditor.tsx`
- Add a small presenter helper or extend `listingPublishRules.ts` with a `resolveIssueMessage(issue, t)` function so the editor just renders resolved text

**3b. Document advisory nature of pre-check**
- Add a code comment in the live-count query making explicit that if the query fails (returns 0), the server trigger remains authoritative — this is intentional, not a bug

---

## Not Touched
- Ranking engine (merit-based, stays tier-blind)
- Matching view (stays tier-blind)
- Visibility boost implementation (deferred until product decision)
- Billing / checkout
