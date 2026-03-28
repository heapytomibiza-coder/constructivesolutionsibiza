

# Platform Hardening — Phased Remediation Plan

## Delivery Board

---

### PHASE 1 — P0 Hotfixes (Week 1, Days 1-2)

#### Ticket 1: CORS Allowlist
- **Priority:** P0 | **Owner:** Backend
- **Files:** `supabase/functions/_shared/cors.ts`, `supabase/functions/weekly-kpi-digest/index.ts`, `supabase/functions/send-auth-email/index.ts`
- **Migration:** No
- **Effort:** 1 hour

**What:** Replace `"Access-Control-Allow-Origin": "*"` with a `getCorsHeaders(req)` helper that reads the `Origin` header and returns it only if it matches `constructivesolutionsibiza.lovable.app` or `constructivesolutionsibiza.com`. The two functions with local CORS headers (`weekly-kpi-digest`, `send-auth-email`) must import from `_shared/cors.ts` instead.

Also update `Access-Control-Allow-Headers` to include the full Supabase client header set: `authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version`.

**Note:** `stripe-webhook` receives server-to-server calls from Stripe — CORS is irrelevant there, but keeping it consistent is fine since Stripe ignores CORS headers.

**Acceptance criteria:**
- No edge function returns `Access-Control-Allow-Origin: *`
- Requests from non-allowlisted origins get no ACAO header
- All existing frontend calls still work

**Rollback:** Revert `_shared/cors.ts` to `"*"`

---

#### Ticket 2: CSP Stripe Readiness
- **Priority:** P0 | **Owner:** Frontend
- **Files:** `index.html`
- **Migration:** No
- **Effort:** 15 min

**What:** Add `https://*.stripe.com` to `connect-src` and `frame-src` in the CSP meta tag. This is additive and safe — it prepares for Stripe Checkout without affecting current behavior.

**Acceptance criteria:**
- No CSP console errors during normal app use
- When `STRIPE_CHECKOUT_LIVE` is later enabled, Stripe redirect will not be blocked

**Rollback:** Remove the added domains

---

#### Ticket 3: Lock `weekly-kpi-digest`
- **Priority:** P0 | **Owner:** Backend
- **Files:** `supabase/functions/weekly-kpi-digest/index.ts`
- **Migration:** No
- **Effort:** 30 min

**What:** Add `x-internal-secret` check at the top of the handler (same pattern as `seedpacks` and `send-job-notification`). Currently, any HTTP POST triggers a full KPI gather + email send with zero auth.

**Implementation:** Copy the exact 4-line pattern from `seedpacks/index.ts` lines 14-18: read `INTERNAL_FUNCTION_SECRET` env var, compare against `x-internal-secret` header, return 401 if mismatch.

**Acceptance criteria:**
- POST without header → 401
- POST with wrong header → 401
- POST with correct header → normal digest flow

**Rollback:** Remove the auth check block

---

### PHASE 2 — Transactional Integrity (Week 1, Days 3-5)

#### Ticket 4: Atomic Accept-Quote RPC
- **Priority:** P1 | **Owner:** Database + Frontend
- **Files:** New migration, `src/pages/jobs/actions/acceptQuote.action.ts`
- **Migration:** Yes — new RPC `accept_quote_and_assign`
- **Effort:** 3 hours

**What:** Currently `acceptQuote.action.ts` does 3 sequential client-side writes. If quote acceptance succeeds but job assignment fails (line 64-67), an accepted quote exists with no assigned professional — a trust-breaking partial state.

**Migration SQL creates:**
```text
accept_quote_and_assign(p_quote_id UUID, p_job_id UUID, p_professional_id UUID)
  - SECURITY DEFINER, search_path = public
  - Verify auth.uid() = jobs.user_id
  - Verify job.status IN ('open','posted')
  - Verify job.assigned_professional_id IS NULL
  - Verify quote belongs to job
  - UPDATE quotes SET status='accepted' WHERE id = p_quote_id
  - UPDATE quotes SET status='rejected' WHERE job_id = p_job_id AND id != p_quote_id AND status IN ('submitted','revised')
  - UPDATE jobs SET assigned_professional_id = p_professional_id, status = 'in_progress'
  - All in single transaction (implicit in plpgsql)
  - RAISE EXCEPTION on any validation failure
```

**Frontend change:** Replace 3 Supabase writes with `supabase.rpc('accept_quote_and_assign', { p_quote_id, p_job_id, p_professional_id })`. Keep `trackEvent` call on success.

**Acceptance criteria:**
- Concurrent accepts on same job: only one succeeds
- Failed assignment rolls back quote acceptance
- RPC rejects calls from non-owner

**Downstream risk:** Low — same end state, fewer writes
**Rollback:** Revert to multi-write approach

---

#### Ticket 5: Batch Pro Stats RPC
- **Priority:** P1 | **Owner:** Database + Frontend
- **Files:** New migration, `src/pages/jobs/actions/awardProStats.action.ts`
- **Migration:** Yes — new RPC `increment_professional_micro_stats_batch`
- **Effort:** 2 hours

**What:** Currently loops through `microIds` with one RPC call per micro (N+1 pattern, lines 28-38). A job with 5 micros = 5 sequential network calls. Partial failures leave partial stats.

**Migration SQL creates:**
```text
increment_professional_micro_stats_batch(p_user_id UUID, p_micro_ids UUID[], p_rating NUMERIC)
  - Loops internally in plpgsql
  - All-or-nothing transaction
```

**Frontend change:** Replace the `for` loop with single `supabase.rpc('increment_professional_micro_stats_batch', { ... })`.

**Acceptance criteria:**
- Single network call for any number of micros
- Failure rolls back all updates
- Existing `increment_professional_micro_stats` kept for backward compatibility

**Rollback:** Revert to loop approach

---

### PHASE 3 — Abuse & Trust Hardening (Week 2)

#### Ticket 6: Persistent Auth Email Rate Limiting
- **Priority:** P1 | **Owner:** Backend
- **Files:** `supabase/functions/send-auth-email/index.ts`
- **Migration:** No (existing `check_rate_limit` RPC + `rate_limit_events` table already exist)
- **Effort:** 1.5 hours

**What:** The in-memory `rateLimitMap` (line 60) resets on every cold start. Under multiple instances, rate limiting is effectively zero.

**Implementation:** Replace `checkRateLimit(email)` calls with a service-role Supabase client calling `check_rate_limit`. Since the existing RPC requires `p_user_id` (non-null in the WHERE clause), we need to either:
- Option A: Use a deterministic UUID derived from email (e.g., `uuid_generate_v5`) for unauthenticated requests
- Option B: Create a lightweight variant `check_rate_limit_by_key(p_key TEXT, ...)` that doesn't require a user_id

Option B is cleaner. Small migration to add the variant function.

**Acceptance criteria:**
- 6th email to same address within 5 min returns generic 200 (no send)
- Limit persists across cold starts
- Remove the `rateLimitMap` and `checkRateLimit` function

**Rollback:** Revert to in-memory (weaker but functional)

---

#### Ticket 7: Restrict `get_user_tier`
- **Priority:** P1 | **Owner:** Database
- **Files:** New migration (ALTER FUNCTION)
- **Migration:** Yes
- **Effort:** 30 min

**What:** Current `get_user_tier(p_user_id)` is SECURITY DEFINER and accepts any UUID. Any authenticated user can query another user's tier and commission rate. Currently not called from frontend, but it's an exposed API surface.

**Fix:** Add ownership check:
```text
IF p_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin') THEN
  RAISE EXCEPTION 'not_authorized';
END IF;
```
Convert from SQL to plpgsql to support the conditional.

**Acceptance criteria:**
- Own ID → returns data
- Other user's ID (non-admin) → raises exception
- Admin → returns data for any user

**Rollback:** Remove the auth check

---

#### Ticket 8: Quote Amount Validation Trigger
- **Priority:** P2 | **Owner:** Database
- **Files:** New migration
- **Migration:** Yes
- **Effort:** 45 min

**What:** No server-side bounds on quote amounts. A pro can submit €0.01 or €999,999,999.

**Implementation:** Create a BEFORE INSERT OR UPDATE trigger on `quotes` that validates:
- `price_fixed > 0 AND price_fixed <= 500000` (when not null)
- `price_min > 0 AND price_max <= 500000 AND price_min <= price_max` (when range)
- `hourly_rate > 0 AND hourly_rate <= 1000` (when hourly)

**Acceptance criteria:**
- Quote with €0 → rejected
- Quote with €999,999 → rejected
- Quote with valid €5,000 → accepted

**Rollback:** Drop trigger

---

#### Ticket 9: Review Cooling Period
- **Priority:** P2 | **Owner:** Database + Frontend
- **Files:** New migration (trigger on `job_reviews`), review UI update
- **Migration:** Yes
- **Effort:** 2 hours

**What:** Reviews can be submitted seconds after job completion — weaponizable for retaliation.

**Implementation:** BEFORE INSERT trigger on `job_reviews` that checks the job's `completed_at` is at least 12 hours old. Frontend: update review eligibility query and show countdown if within cooling period.

**Acceptance criteria:**
- Review submitted 1 hour after completion → rejected with clear message
- Review submitted 13 hours after completion → accepted
- UI shows "Review available in X hours"

---

#### Ticket 10: Pro Completion Confirmation (Optional Enhancement)
- **Priority:** P2 | **Owner:** Database + Frontend
- **Files:** New migration (add `pro_confirmed_complete_at` to jobs), new action file
- **Migration:** Yes
- **Effort:** 3 hours

**What:** Add a "Confirm delivery" action for the professional. Does not block client completion — purely additive evidence for disputes.

**Acceptance criteria:**
- Pro can confirm delivery on assigned jobs
- Client can still complete without pro confirmation
- Dispute view shows confirmation status

---

### PHASE 4 — Stripe Activation (When Credentials Arrive)

#### Ticket 11: Stripe Secrets + Config
- **Blocked until:** Stripe dashboard access + credentials
- **Files:** Environment secrets, Stripe dashboard
- **Effort:** 1 hour

**Checklist:**
- Load `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` into environment
- Verify `price_1TG3HUAsoYCrHLeBJ0XM4Ks3` (Silver) and `price_1TG3HXAsoYCrHLeBlwitj6fQ` (Elite) exist in Stripe
- Register webhook endpoint in Stripe dashboard
- Subscribe to: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`

#### Ticket 12: End-to-End Stripe Test
- **Blocked until:** Ticket 11
- **Effort:** 2 hours

**Test matrix:**
- Create checkout → redirect → success return
- Cancel return
- Webhook: subscription created → row upserted
- Webhook: payment failed → status = past_due
- Webhook: subscription deleted → tier = bronze
- Webhook: unknown price ID → logged, ignored, no tier change
- Duplicate webhook event → idempotent (no error)

#### Ticket 13: Controlled Live Activation
- **Blocked until:** Ticket 12 passes
- **Effort:** 30 min

**Actions:**
- Set `STRIPE_CHECKOUT_LIVE = true` in `entitlements.ts`
- Monitor: session creation rate, webhook success rate, subscription row accuracy
- Verify tier entitlement updates propagate correctly

---

### PHASE 5 — Final Hardening (Week 3)

#### Ticket 14: Production CSP Tightening
- **Priority:** P3
- Remove `unsafe-eval` from production builds (Vite production doesn't need it)
- Test all pages for CSP violations

#### Ticket 15: Full Edge Function Audit
- **Priority:** P3
- Classify all 20 functions: public / authenticated / internal / webhook
- Confirm each has appropriate auth, CORS, rate limiting, logging

---

### DEFERRED — Not Actually Risky

| Item | Reason |
|---|---|
| `verify_jwt: false` on checkout function | Platform standard — all Cloud functions use in-code `getClaims()` validation |
| Subscriptions table INSERT/UPDATE RLS | RLS enabled + no policies = deny by default. Webhook uses service role. Correct by design. |
| Dispute `raised_by` validation | Mitigated by edge function validation + user needs valid `job_id` |

---

### Dependency Map

```text
Phase 1 (P0)          Phase 2 (P1)           Phase 3 (P2)
┌──────────┐          ┌──────────────┐        ┌─────────────────┐
│ T1: CORS │──┐       │ T4: Quote RPC│        │ T8: Quote valid │
│ T2: CSP  │  │       │ T5: Stats RPC│        │ T9: Review cool │
│ T3: KPI  │  │       │ T6: Rate lim │        │ T10: Pro confirm│
└──────────┘  │       │ T7: Tier auth│        └─────────────────┘
              │       └──────────────┘
              │                                Phase 4 (Blocked)
              └──────────────────────────────▶ T11→T12→T13: Stripe
```

No ticket in Phases 1-3 depends on Stripe credentials. All can proceed now.

