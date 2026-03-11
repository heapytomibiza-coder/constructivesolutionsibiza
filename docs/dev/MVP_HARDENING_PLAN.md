# MVP Hardening Plan — From 6.5 to 9/10

**Created:** 2026-03-11  
**Source:** Independent Technical Audit (MyCrewDev/Rafa, March 2026) + Internal Platform Audit  
**Goal:** Push the platform from ~6.5 post-fixes to a strong ~8/10 MVP with a clear path to 9/10  
**Principle:** Extend, improve, replace gradually — never rebuild from scratch

> **To the team:** This document is not about slowing development. It is about ensuring we build on a stable foundation while continuing to collect real marketplace data. Speed remains our priority — but speed on a shaky foundation creates rework. Speed on a solid foundation compounds.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Current maturity** | **6.5 / 10** (after critical fixes already applied) |
| **Target** | **8 / 10** (strong, secure MVP) |
| **Path to 9/10** | Defined but deferred until product-market fit confirmed |
| **Architecture approach** | Incremental improvement (Strangler Fig pattern) |
| **Rebuild required?** | **No** |
| **Timeline** | 6–8 weeks (runs in parallel with feature development) |

**Focus areas:**
1. Security hardening
2. Database optimisation
3. Observability & operations
4. Code cleanup & dead code removal
5. Testing foundation
6. Governance & drift prevention

**This hardening work runs in parallel with feature development.** The platform must continue collecting marketplace data during improvements. We do not pause product work — we strengthen the foundation underneath it.

---

## Guiding Rules

1. **Architectural Continuity** — New work must extend the existing system. Before creating anything new, ask: "Does this already exist?" If yes → extend it.
2. **Security First** — Security fixes always take priority over features.
3. **Data > Perfect Code** — The marketplace data we're collecting is more valuable than a clean codebase. Don't sacrifice data collection momentum.
4. **One System** — We are building one coherent platform, not multiple disconnected prototypes. Every new component must integrate with existing data models and flows.
5. **Extend → Improve → Replace** — Never rebuild from scratch. Gradually replace components while keeping the system running.

---

## Product-Market Validation Metrics

The platform exists to answer these questions. Every engineering decision should support collecting this data faster and more reliably.

| Metric | What It Tells Us |
|--------|------------------|
| **Job posts per week** | Is there demand for services? |
| **Professional responses per job** | Is the supply side engaged? |
| **Conversation start rate** | Are matches converting to engagement? |
| **Job completion rate** | Does the marketplace deliver value? |
| **Time to first response** | How healthy is the matching experience? |
| **Repeat client rate** | Are we building trust and retention? |

**Developers must understand:** we are not building software for its own sake. We are building a marketplace engine that collects intelligence. Every feature, every fix, every optimisation should serve this goal.

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
| Feature rollout system | ✅ DONE | `RolloutGate` component + `canSeeRoute` + ordered phases (pipe-control → founding-members → scale-ready). |

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
- `send-auth-email` — OK (called by Auth hooks, no user JWT available)
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
**Action:** Delete all V1 files already seeded into `question_packs` table:
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

## Governance: Architecture Ownership

All architectural changes must be reviewed before implementation.

**What counts as an architectural change:**
- Creating new database tables
- Creating new services or API endpoints
- Introducing new data models
- Replacing existing flows
- Adding external infrastructure or third-party services

**Before implementing, the developer must document:**
1. Why the existing system cannot support the change
2. What part of the architecture is affected
3. How the new component integrates with existing data models

**Goal:** Prevent parallel systems or logic duplication. No one should be able to introduce new tables or services without explaining why the existing ones are insufficient.

---

## Governance: Database Migration Discipline

All schema changes must occur through **tracked migrations**.

**Rules:**
- Never edit production tables manually
- All structural changes must be committed as versioned migrations
- Migrations must run successfully from a clean database

**Before merging any schema change, confirm:**
```
supabase db reset
supabase db push
```
works cleanly from scratch.

**Goal:** Ensure any developer can recreate the entire database from the migration history alone. This is essential for onboarding new developers and disaster recovery.

---

## Governance: Feature Flags for Experimental Work

The platform already has a rollout system (`RolloutGate` + `canSeeRoute` + ordered phases). New experimental features must use this system.

**When to use feature flags:**
- Beta features not ready for all users
- Experimental AI-powered flows
- Admin-only tools in development
- A/B testing or gradual rollouts

**Implementation:** Use the existing `rollout.ts` phase system. For finer control, add per-feature flags via the `feature_flags` pattern (database table or environment variable).

**Goal:** Allow safe experimentation without breaking production flows. No experimental feature should be accessible to end users unless explicitly enabled.

---

## Governance: Backup & Recovery

**Current state:** Lovable Cloud provides automated database backups.

**Actions required:**
1. Verify automated backup schedule is active
2. Document the recovery procedure (who runs it, how, expected downtime)
3. Define recovery targets:
   - **RPO** (Recovery Point Objective): Maximum acceptable data loss → target: < 24 hours
   - **RTO** (Recovery Time Objective): Maximum acceptable downtime → target: < 4 hours

**Critical data to protect:**
- Jobs, conversations, profiles (core marketplace data)
- `analytics_events`, `attribution_sessions` (validation intelligence)
- `admin_actions_log`, `job_status_history` (audit trail)

**Goal:** If something goes catastrophically wrong, we can restore the platform and its data within hours, not days.

---

## Governance: Staging Environment

**Current state:** All changes deploy directly to production.

**Target state:**
```
Local Development → Staging (Test) → Production (Live)
```

Lovable Cloud already provides separate **Test** and **Live** environments. The team must treat them correctly:

- **Test environment:** All development, schema changes, and edge function testing happen here first
- **Live environment:** Only receives changes via publishing after verification in Test
- **Schema changes:** Always test migrations in Test before publishing to Live
- **Data:** Never assume Test data matches Live — they are independent

**Goal:** Prevent production breakages from untested migrations or edge function changes.

---

## No-Drift Engineering Checklist

These 10 rules prevent the most common engineering failure in early-stage startups: **developers creating new structures instead of extending existing ones**.

### 1. Extend Before Creating
Before creating any new table, endpoint, or service: check if an existing structure already supports the feature. Preferred order: **extend → improve → replace only if necessary**.

### 2. No Duplicate Data Models
A new table must not duplicate data already stored elsewhere.
- ❌ Bad: `jobs`, `service_jobs`, `job_requests` (three overlapping models)
- ✅ Good: `jobs`, `job_status_history`, `job_reviews` (one job model, extended)

### 3. Respect the Existing Domain Model
The platform has core domain objects: **users, professionals, services, jobs, conversations, analytics**. All new features must connect to these objects, not create alternatives.
- New feature needs task tracking? → Extend `jobs` with a status, don't create `task_requests`.

### 4. Database Changes Must Be Migrations
All schema changes via versioned migrations. Never modify production schema manually. `supabase db reset && supabase db push` must succeed.

### 5. No Logic Duplication
If logic exists somewhere, reuse it. Permission checks, job validation, analytics tracking, notification sending — use shared functions, not copy-paste.

### 6. Server Logic Over Client Logic
Sensitive operations move toward edge functions, RPCs, and backend services. The frontend requests actions; the backend enforces rules.

### 7. Feature Flags for Experiments
Experimental features use the `RolloutGate` system or feature flags. No experimental code should be accessible to end users unless explicitly enabled.

### 8. Architecture Changes Require Justification
When introducing new architecture, document: (1) why existing architecture can't support it, (2) what problem it solves, (3) how it integrates with the current system.

### 9. Maintain Clear Data Ownership
Each core domain object has a clear owner. Other systems reference it rather than replicate its data. Jobs own job lifecycle, matching, conversations, and quotes.

### 10. Maintain Observability
All critical actions must be trackable via `analytics_events` or domain-specific history tables. If a feature creates data, it must also track that creation.

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
                          + Governance rules          + Penetration testing
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
- ❌ Pausing feature development — hardening runs alongside it

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
| Governance | — | **B+** (ownership rules, migration discipline, feature flags) |
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

**Total estimated effort: 6-8 weeks, running in parallel with feature development.**

---

## Final Principle

The goal is not perfect software.

The goal is a **trusted marketplace that solves real problems and collects valuable market data while it grows**.

We improve the system by **extending → strengthening → refining** — never by rebuilding it.

Every improvement should make the platform more secure, more reliable, and more capable of answering the core question: **does this marketplace create value?**

---

*This plan follows the Strangler Fig pattern: keep the system running, improve incrementally, replace only when necessary. Every improvement strengthens the existing foundation.*
