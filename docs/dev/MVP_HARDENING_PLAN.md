# MVP Hardening Plan — From 6.5 to 8/10

**Created:** 2026-03-11  
**Source:** Independent Technical Audit (MyCrewDev/Rafa, March 2026) + Internal Platform Audit  
**Goal:** Push the platform from ~6.5 post-fixes to a strong ~8/10 MVP  
**Principle:** Extend, improve, replace gradually — never rebuild from scratch

---

## Guiding Rules

1. **Architectural Continuity** — New work must extend the existing system. Before creating anything new, ask: "Does this already exist?" If yes → extend it.
2. **Security First** — Security fixes always take priority over features.
3. **Data > Perfect Code** — The marketplace data we're collecting is more valuable than a clean codebase. Don't sacrifice data collection momentum.
4. **One System** — We are building one coherent platform, not multiple disconnected prototypes. Every new component must integrate with existing data models and flows.

---

## Current Status vs Audit Findings

### ✅ ALREADY FIXED (No Action Needed)

| Audit Finding | Status | How It Was Fixed |
|---------------|--------|------------------|
| S1: Privilege escalation via `user_roles` RLS | ✅ FIXED | UPDATE restricted to `active_role` column only. `roles` array immutable from client. Role changes via `switch_active_role` RPC. |
| Admin views exposed via anon key | ✅ FIXED | Replaced with `SECURITY DEFINER` RPCs (`rpc_admin_platform_stats`, `rpc_admin_users_list`, `rpc_admin_support_inbox`) with dual-gate `has_role() + is_admin_email()` checks. |
| Admin emails hardcoded in frontend | ✅ FIXED | `isAdminEmail()` is now a deprecated no-op. All admin checks use `hasRole('admin')` from session context. DB-level `is_admin_email()` handles real security. |
| S2: .env committed to git | ✅ FIXED | `.env` excluded from version control. |
| No error monitoring | ✅ FIXED | Lighthouse Monitor deployed — tracks errors, page views, network failures with retention policies. |
| Session load sequential queries | ✅ PARTIALLY FIXED | `useSessionSnapshot` parallelised via `Promise.all` (~450ms → ~150ms). |
| Route-level code splitting | ✅ DONE | `React.lazy` implemented for route splitting. |
| Weekly KPI digest | ✅ DONE | `weekly-kpi-digest` edge function exists. |
| Telemetry purging | ✅ DONE | `purge_stale_telemetry` function exists with retention policies. |

### 🔴 REMAINING — Ordered by Priority

---

## Sprint 1: Security Hardening (Week 1-2)

### 1.1 Gate `send-notifications` test endpoint ⚡ P0
**Audit ref:** S-HIGH — Unauthenticated `?test_email=1` sends emails to anyone  
**Risk:** Anyone can use Resend quota as a spam relay  
**Fix:** Add admin JWT check at the top of the test branch, or remove the test endpoint entirely.

### 1.2 Enable JWT verification on edge functions ⚡ P0
**Audit ref:** S-MEDIUM — 7 functions have `verify_jwt = false`  
**Current state in `config.toml`:**
- `ping` — OK to keep open (health check)
- `send-auth-email` — OK (called by Supabase Auth hooks, no user JWT available)
- `seedpacks` — ❌ MUST enable JWT + admin check
- `send-job-notification` — ❌ Review: if called by DB trigger, needs service role; if by client, needs JWT
- `send-notifications` — ❌ Add internal auth (service role or admin JWT)
- `weekly-kpi-digest` — OK if called by cron only (add shared secret check)
- `search-stock-photos` — ❌ MUST enable JWT (prevents unauthenticated abuse)

**Action:** Review each function, enable JWT where possible, add shared-secret or admin check where JWT isn't feasible.

### 1.3 Rate limiting on public RPCs ⚡ P1
**Audit ref:** S-MEDIUM — `get_or_create_conversation`, `track_event` have no throttling  
**Fix:** Use existing `check_rate_limit` function (already designed). Wire it into the critical RPCs:
- Job posting: max 5/day/client
- Messages: rate per minute
- Conversation creation: rate per hour
- Analytics writes: batch or sample

### 1.4 Remove hardcoded admin email fallback ⚡ P1
**Audit ref:** S-LOW — `heapytomibiza@gmail.com` is hardcoded in edge function  
**Fix:** Use env-only `ADMIN_EMAIL` with startup validation. Fail loudly if missing.

---

## Sprint 2: Database Integrity (Week 2-3)

### 2.1 Add missing performance indexes ⚡ P0
**Audit ref:** DB-HIGH — Will cause slow queries at 500+ jobs  
**Indexes to create:**
```sql
CREATE INDEX idx_jobs_status_created ON jobs(status, created_at);
CREATE INDEX idx_jobs_micro_slug ON jobs(micro_slug);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_service_views_listing ON service_views(service_listing_id, created_at);
CREATE INDEX idx_email_queue_pending ON email_notifications_queue(sent_at, attempts) WHERE sent_at IS NULL AND attempts < 3;
```

### 2.2 Add unique constraint on conversations ⚡ P1
**Audit ref:** DB-LOW — Race condition possible under load  
```sql
ALTER TABLE conversations ADD CONSTRAINT uq_conversations_job_client_pro 
  UNIQUE (job_id, client_id, pro_id);
```

### 2.3 Add dead-letter handling for notification queue ⚡ P1
**Audit ref:** DB-MEDIUM — Failed items sit forever  
**Fix:** Add `failed_at` column. After 3 attempts, mark as permanently failed. Surface in `admin_operator_alerts`.

### 2.4 Add `services_count` sync trigger ⚡ P2
**Audit ref:** DB-LOW — Denormalised counter drifts  
**Fix:** Create trigger on `professional_services` INSERT/DELETE that updates `professional_profiles.services_count`.

---

## Sprint 3: Code Cleanup & Quality (Week 3-4)

### 3.1 Delete dead question pack files ⚡ P1
**Audit ref:** Code-MEDIUM — 24 files deployed with every edge function  
**Action:** Delete all V1 files + any V2 files that are already seeded into `question_packs` table:
- `supabase/functions/_shared/carpentryQuestionPacks.ts` (V1)
- `supabase/functions/_shared/constructionQuestionPacks.ts` (V1)
- `supabase/functions/_shared/electricalQuestionPacks.ts` (V1)
- `supabase/functions/_shared/floorsDoorsWindowsQuestionPacks.ts` (V1)
- `supabase/functions/_shared/gardeningLandscapingQuestionPacks.ts` (V1)
- `supabase/functions/_shared/handymanQuestionPacks.ts` (V1)
- `supabase/functions/_shared/hvacQuestionPacks.ts` (V1)
- `supabase/functions/_shared/kitchenBathroomQuestionPacks.ts` (V1)
- `supabase/functions/_shared/plumbingQuestionPacks.ts` (V1)
- `supabase/functions/_shared/poolSpaQuestionPacks.ts` (V1)
- `supabase/functions/_shared/transportQuestionPacks.ts` (V1)
- `supabase/functions/_shared/v1QuestionPacks.ts`

### 3.2 Remove deprecated `isAdminEmail()` shim ⚡ P2
**File:** `src/domain/adminAllowlist.ts`  
**Action:** Verify no imports remain, then delete the file.

### 3.3 Fix error handling order in actions ⚡ P2
**Audit ref:** Code-LOW — Some actions track events before checking DB success  
**Pattern to enforce:**
```typescript
const { error } = await supabase.from(...).update(...)
if (error) return { success: false, error: 'message' }
// Only track AFTER confirmed success
trackEvent('action_name', 'role', metadata)
```
**Files to review:** `suspendUser.action.ts`, `archiveJob.action.ts`, and other action files.

### 3.4 Add shared email template types ⚡ P2
**Audit ref:** Code-LOW — No shared interface for email builders  
**Fix:** Create `EmailTemplate` interface in `_shared/types.ts`:
```typescript
interface EmailTemplate {
  subject: string;
  html: string;
  whatsapp?: string;
  telegram?: string;
}
```

---

## Sprint 4: Observability & Operations (Week 4-5)

### 4.1 Schedule `purge_stale_telemetry` via pg_cron ⚡ P1
**Audit ref:** Ops-MEDIUM — Function exists but may not be scheduled  
**Action:** Confirm cron job is active. If not:
```sql
SELECT cron.schedule('purge-telemetry', '0 3 * * *', $$SELECT purge_stale_telemetry()$$);
```

### 4.2 Add notification queue health monitoring ⚡ P1
**Audit ref:** Ops-HIGH — If cron stops, notifications queue silently  
**Fix:** Add a check in `admin_operator_alerts` for: "notification queue items older than 1 hour with 0 attempts" = cron is not running.

### 4.3 Drop old admin views ⚡ P2
**Audit ref:** Security-LOW — Still queryable with anon key  
**Action:** Verify no FK dependencies, then:
```sql
DROP VIEW IF EXISTS admin_users_list;
DROP VIEW IF EXISTS admin_support_inbox;
DROP VIEW IF EXISTS admin_platform_stats;
```
⚠️ Note: `admin_support_inbox` is referenced by `support_request_events` FK. Check before dropping.

---

## Sprint 5: Performance & Scalability (Week 5-6)

### 5.1 Optimise `rpc_admin_platform_stats` ⚡ P2
**Audit ref:** Perf — 11 separate COUNT queries  
**Fix:** Rewrite as single query with CTEs.

### 5.2 Optimise `admin_metric_timeseries` ⚡ P2
**Audit ref:** Perf — UNION ALL of 8 subqueries, only 1 matches  
**Fix:** Use IF/ELSIF pattern like `admin_metric_drilldown`.

### 5.3 Improve Lighthouse Monitor efficiency ⚡ P2
**Audit ref:** Perf — Polls every 1s + flushes every 5s  
**Fix:** Replace route polling with `popstate`/`pushState` event listeners. Consider sampling (flush 10% of sessions on mobile).

### 5.4 Parallelise notification sending ⚡ P2
**Audit ref:** Scale — 20 items × 100ms = 2s per batch  
**Fix:** Use `Promise.allSettled()` for Resend API calls within each batch.

---

## Sprint 6: Testing Foundation (Week 6-8)

### 6.1 Add critical path tests ⚡ P1
**Audit ref:** Code — Zero test coverage is the biggest quality gap  
**Minimum viable test suite (target: 15 tests):**

**Unit tests (Vitest):**
- Role permission checks (`has_role` logic)
- Job creation validation
- Service matching logic
- Rate limit function

**Integration tests (Vitest + Supabase test client):**
- Authentication flow (signup → verify → login)
- Job posting → status transitions
- Conversation creation → messaging
- Quote submission flow

**E2E tests (Playwright — optional, later):**
- Client posts job → pro sees it → conversation starts
- Pro creates service listing → appears in browse

---

## Architecture Evolution Path

```
Current (6.5/10)          Target (8/10)              Future (9/10)
─────────────────         ─────────────────          ─────────────────
Frontend → DB direct      Frontend → DB direct       Frontend → API → DB
                          + Edge Functions for        + Full API layer
                            sensitive operations      + Redis caching
                          + JWT on all endpoints      + Search service
                          + Rate limiting             + Payment/escrow
                          + Indexes + constraints     + Staging env
                          + Basic test suite          + Full test coverage
                          + Monitoring alerts         + CI/CD pipeline
```

**We are targeting the middle column.** The right column comes when we hit product-market fit and need to scale beyond 1,000 users.

---

## What We Are NOT Doing

- ❌ Full rebuild
- ❌ Adding a Node.js/Deno API layer yet (Month 4+ per audit roadmap)
- ❌ Payment/escrow integration (premature)
- ❌ Migration squashing (nice-to-have, not blocking)
- ❌ Full GDPR compliance review (needed before scale, not now)
- ❌ Switching away from Supabase
- ❌ Creating parallel systems that duplicate existing logic

---

## Success Criteria

After completing Sprints 1-6, the platform should score:

| Metric | Before | After |
|--------|--------|-------|
| Security | D+ → B- (post F1-F4) | **B+** (JWT hardened, rate limited, no exposed endpoints) |
| Database | B | **B+** (indexed, constrained, dead-letter handling) |
| Code Quality | C+ | **B** (dead code removed, tests on critical paths) |
| Operations | D | **B-** (monitoring, alerting, scheduled maintenance) |
| Data Collection | B+ | **B+** (unchanged — already strong) |
| **Overall** | **~6.5** | **~8/10** |

---

## Timeline Summary

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 1-2 | Security | JWT hardening, rate limiting, test endpoint gated |
| 2-3 | Database | Indexes, constraints, dead-letter handling |
| 3-4 | Code cleanup | Dead code removal, error handling fixes, types |
| 4-5 | Operations | Cron jobs confirmed, monitoring alerts, old views dropped |
| 5-6 | Performance | RPC optimisation, notification parallelisation |
| 6-8 | Testing | 15 critical path tests |

**Total estimated effort: 6-8 weeks of focused work.**

---

*This plan follows the Strangler Fig pattern: keep the system running, improve incrementally, replace only when necessary. Every improvement strengthens the existing foundation.*
