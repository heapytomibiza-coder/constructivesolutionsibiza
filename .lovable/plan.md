
# Current Hardening State

Completed. No active tasks.

---

## What Was Done

1. **Stripped unenforced premium claims** from pricing UI (`visibility_boost`, `priority_matching`, `featured_slots`)
2. **Enforced `portfolio_limit`** via DB trigger using same pattern as listing limit
3. **Consolidated tier-limit logic** into `get_tier_limit(user_id, feature)` — single SQL source of truth
4. **Hardened listing-limit toast copy** — centralized in `publishIssueMessages.ts`
5. **Full journey audit** completed and delivered

---

## Current Source of Truth

| Layer | File | Role |
|-------|------|------|
| SQL (authoritative) | `get_tier_limit(user_id, feature)` | Enforcement for listing, portfolio, quote limits |
| Code (advisory) | `src/domain/entitlements.ts` | UX guidance, feature gates, display values |
| DB table | `subscriptions` | Authoritative tier, status, commission_rate |

**Drift risk:** SQL and `entitlements.ts` both define limit values. SQL wins. Both must be updated on plan changes.

---

## Recommended Next Hardening (Not Started)

### 1. Server-Derived Entitlements Payload

Feed client-side advisory UI from backend-defined limits so SQL and code share a single source.
- Add an RPC like `get_my_entitlements()` that returns limits + features for the current user
- `useEntitlements()` reads from this instead of hardcoded `FEATURE_MAP`
- Eliminates dual-definition drift entirely

### 2. Verify Quote RPC Uses `get_tier_limit()`

Audit `submit_quote_with_items` to confirm it uses `get_tier_limit()` rather than a hardcoded daily cap.

### 3. Tier-Based RLS on `demand_snapshots`

Currently insights gate is client-side only. Add RLS that joins subscriptions to check tier.

### 4. Gold Tier Award Mechanism

No mechanism to grant gold tier. Needs admin RPC + UI.

### 5. Subscription Management Page

No self-service cancel/manage UI exists. Needs Stripe Customer Portal integration.

---

## Not Touched (By Design)

- Ranking engine (merit-based, stays tier-blind)
- Matching logic (stays tier-blind)
- Visibility boost implementation (deferred until product decision)
- Billing / Stripe checkout (gated by `STRIPE_CHECKOUT_LIVE`)
