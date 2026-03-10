# Platform Audit Report

**Date:** 2026-03-10  
**Scope:** Architecture, Security, Database, Scalability, Code Quality, Operations, Performance  
**Status:** Early-stage marketplace — 1–100 users

---

## 1. Architecture Critique

### ✅ Strengths
- **Clean domain separation:** `features/`, `pages/`, `hooks/`, `lib/`, `guard/`, `domain/` — well-organised.
- **Session snapshot pattern:** Single source of truth (`useSessionSnapshot`) for auth + roles + professional state. Smart parallelisation of independent queries.
- **RPC-first admin layer:** All admin data access goes through `SECURITY DEFINER` RPCs with dual-gate checks. Excellent.
- **Queue-based notifications:** DB-backed queue with retry logic — resilient and auditable.
- **Edge functions for server-side logic:** Keeps frontend clean, business logic portable.

### ⚠️ Concerns

| Issue | Severity | Detail |
|-------|----------|--------|
| **Monolithic edge function** | Medium | `send-notifications/index.ts` is 462 lines handling 6 event types, 3 channels, templates, routing, and retry. Should be split into template module + channel senders + orchestrator. |
| **No service layer abstraction** | Medium | Business actions (e.g., `assignProfessional.action.ts`, `archiveJob.action.ts`) call Supabase directly. No shared service/repository layer — if you switch backends, every action file changes. |
| **Question packs in `_shared/`** | Low | 24 question pack files in `supabase/functions/_shared/` — massive static data files deployed with every edge function. Should be in the database (they already are via `question_packs` table). These are dead weight. |
| **No API versioning** | Low | RPCs are called directly. If you change a return shape, every consumer breaks simultaneously. |

---

## 2. Security Issues

### ✅ Recently Hardened
- Admin views → SECURITY DEFINER RPCs ✅
- `user_roles` INSERT restricted to self-assign client only ✅  
- `has_role()` + `is_admin_email()` dual-gate on all admin RPCs ✅
- `switch_active_role` validates against existing roles array ✅

### 🔴 Remaining Risks

| Issue | Severity | Detail |
|-------|----------|--------|
| **`send-notifications` test endpoint is unauthenticated** | HIGH | `?test_email=1&to=anyone@example.com` sends emails with zero auth. `verify_jwt = false` in config.toml. Anyone can use your Resend quota as a spam relay. **Fix: remove test endpoint or gate behind admin JWT.** |
| **Service role key in edge functions** | Medium | `SUPABASE_SERVICE_ROLE_KEY` is used in `send-notifications` — correct for server-side, but ensure it's never logged or exposed in error responses. Currently `result.error` is returned in test endpoint JSON. |
| **`verify_jwt = false` on multiple functions** | Medium | `ping`, `seedpacks`, `send-auth-email`, `send-job-notification`, `send-notifications`, `search-stock-photos` — all skip JWT verification. Each needs individual review for abuse potential. |
| **No rate limiting on public RPCs** | Medium | `get_or_create_conversation`, `track_event` — no throttling. A bot could flood analytics_events or create thousands of conversations. |
| **`ADMIN_EMAIL` hardcoded as fallback** | Low | `heapytomibiza@gmail.com` is a hardcoded fallback in the edge function. Should be env-only with a startup check. |
| **Old admin views still exist** | Low | `admin_users_list`, `admin_support_inbox`, `admin_platform_stats` views still exist in DB. Not used by frontend, but still queryable if someone has the anon key. Drop them. |

---

## 3. Database Design Concerns

### ✅ Good Patterns
- Proper RLS on all tables
- `user_roles` separated from `profiles` (no privilege escalation via profile update)
- Audit trail via `admin_actions_log` and `job_status_history`
- Notification preferences respected before sending

### ⚠️ Concerns

| Issue | Severity | Detail |
|-------|----------|--------|
| **No indexes on high-query columns** | HIGH | `jobs(status, created_at)`, `messages(conversation_id, created_at)`, `jobs(micro_slug)` — identified in scaling roadmap but **not yet created**. Will cause slow queries at 500+ jobs. |
| **`email_notifications_queue` has no dead-letter handling** | Medium | After 3 attempts, items sit forever with `sent_at IS NULL AND attempts >= 3`. No cleanup, no alerting pipeline — just the admin alert RPC. |
| **`analytics_events` will grow unbounded** | Medium | 365-day retention via `purge_stale_telemetry`, but with 225 trackEvent call sites, this table could reach millions of rows. No partitioning strategy. |
| **`service_search_index` is a view, not materialised** | Medium | Scanned on every search query. Identified in scaling roadmap but not addressed. |
| **No composite unique constraint on `conversations`** | Low | `(job_id, client_id, pro_id)` uniqueness is enforced by application code (`get_or_create_conversation`), not by DB constraint. Race condition possible under load. |
| **`professional_profiles.services_count`** | Low | Denormalised counter with no trigger to keep it in sync. If `professional_services` rows are deleted directly, count drifts. |

---

## 4. Scalability Problems

### Current Bottlenecks (will break at 500+ users)

| Bottleneck | Impact | Fix |
|------------|--------|-----|
| **Missing DB indexes** | Slow job board, slow message loading | Create the indexes listed in `scaling-roadmap.md` NOW |
| **`matched_jobs_for_professional` view** | Complex JOIN on every pro dashboard load | Materialise or convert to RPC with caching |
| **Sequential notification processing** | 20 items × 100ms = 2 sec minimum per batch | Parallelise Resend API calls (they support it) |
| **Lighthouse monitor flushes per-user** | Every authenticated user writes errors/page_views every 5s | Batch on server side or sample (only flush 10% of sessions) |
| **No connection pooling** | Default Supabase connections will exhaust at ~100 concurrent | Enable PgBouncer |

### Not Yet Critical But Watch
- Realtime subscription count (messaging)
- Edge function cold starts on `send-job-notification`
- Frontend bundle size (route splitting partially done)

---

## 5. Code Quality Risks

### ⚠️ Issues Found

| Issue | Severity | Files |
|-------|----------|-------|
| **`any` types in email templates** | Medium | `send-notifications/index.ts` — all `buildXxxEmail(payload: any, ...)`. No type safety on payload shapes. A trigger could enqueue malformed data and crash silently. |
| **Duplicate question pack files** | Medium | 24 static TS files in `_shared/` (V1 + V2 versions of carpentry, electrical, etc.) — these are seeded into `question_packs` table. The files are dead code deployed with every function. |
| **No shared email template types** | Low | Each `buildXxxEmail` function returns `{ subject, html, whatsapp?, telegram? }` but there's no shared interface. Easy to miss a field. |
| **`isAdminEmail()` returns false always** | Low | `src/domain/adminAllowlist.ts` — deprecated shim that always returns false. Any code still calling it gets wrong results. Should be removed entirely or throw. |
| **Inconsistent error handling in actions** | Low | Some actions (e.g., `archiveJob`) call `trackEvent` before checking success. If the DB update failed, the event is still tracked. |
| **`setTimeout(() => loadUserData(...), 0)`** | Low | In `useSessionSnapshot` — deferred to avoid "potential deadlock" but creates a race where UI renders with stale role data for one tick. |

---

## 6. Operational Risks

| Risk | Severity | Detail |
|------|----------|--------|
| **No automated notification queue processing** | HIGH | `send-notifications` must be invoked externally (cron/webhook). If the cron stops, ALL notifications queue up silently. No health check that cron is running. |
| **No alerting for edge function failures** | HIGH | If `send-notifications` throws, there's no retry at the function level — only at the queue item level. If the function itself can't start (cold start timeout, deploy error), nothing sends. |
| **Gmail SMTP not yet removed** | Medium | Resend migration is code-complete but DNS verification and secret provisioning are pending. If `RESEND_API_KEY` is empty, `sendEmail` returns an error for every item. |
| **No backup/restore plan** | Medium | Supabase handles backups, but there's no documented restore procedure or RTO/RPO targets. |
| **`purge_stale_telemetry` not scheduled** | Medium | Function exists but no `pg_cron` job is confirmed to call it. Telemetry tables will grow indefinitely. |
| **No staging environment** | Medium | All changes go directly to production. One bad migration = production outage. |

---

## 7. Performance Bottlenecks

| Area | Issue | Impact |
|------|-------|--------|
| **Session load** | 2–3 sequential DB queries on every page load (roles → pro profile → phone) | ~300ms+ on mobile. Already parallelised partially but roles query is still blocking. |
| **Admin dashboard** | `rpc_admin_platform_stats` runs 11 separate COUNT(*) queries | Slow at scale. Should be a single query with CTEs. |
| **Lighthouse monitor** | Polls route changes every 1s + flushes every 5s | Unnecessary CPU/network on mobile. Should use `popstate`/`pushState` events instead of polling. |
| **`admin_metric_timeseries`** | UNION ALL of 8 subqueries, only one matches `p_metric_key` — the other 7 scan for nothing | Wasteful. Use IF/ELSIF like `admin_metric_drilldown` does. |
| **Email template generation** | String concatenation of HTML per email | Not a bottleneck now, but no caching of static template shells. |

---

## 8. Duplicate / Dead Code

| Item | Location | Action |
|------|----------|--------|
| V1 question pack files | `supabase/functions/_shared/*QuestionPacks.ts` (non-V2) | Delete — V2 versions exist + data is in DB |
| `isAdminEmail()` shim | `src/domain/adminAllowlist.ts` | Delete — all consumers should use `hasRole('admin')` |
| Old admin views | DB: `admin_users_list`, `admin_support_inbox` | Drop after confirming no FK dependencies |
| `v1QuestionPacks.ts` | `supabase/functions/_shared/v1QuestionPacks.ts` | Delete — superseded |
| Duplicate CORS headers | Defined in `_shared/cors.ts` AND inline in `send-notifications` | Use shared import |

---

## 9. Analytics & Data Collection Inventory

### What You're Collecting

| Data Source | Table | What It Captures | Retention |
|-------------|-------|------------------|-----------|
| **Behavioural events** | `analytics_events` | 225 instrumented `trackEvent()` calls: auth, wizard steps, onboarding, messaging, quoting, admin actions, listing publish/pause | 365 days |
| **Page views** | `page_views` | Every route change for authenticated users: URL, route, load time, browser, viewport | 30 days |
| **JS errors** | `error_events` | Runtime errors, unhandled promises, console.error (filtered) | 60 days |
| **Network failures** | `network_failures` | HTTP 400+ responses, fetch errors | 60 days |
| **Attribution** | `attribution_sessions` | UTM params, referrer, landing URL, gclid, fbclid, session→user binding | 180 days |
| **Job lifecycle** | `job_status_history` | Every status transition with timestamp, actor, source | Permanent |
| **Notification delivery** | `email_notifications_queue` | Send attempts, errors, timestamps per notification | Permanent (no purge) |
| **Admin actions** | `admin_actions_log` | Every admin intervention: verifications, suspensions, content moderation | Permanent |
| **Service views** | `service_views` | Listing page views with session/user ID | Permanent |
| **Support events** | `support_request_events` | Ticket lifecycle events | Permanent |

### Where Data Lives
- **All data** → single Postgres instance via Lovable Cloud
- **Client-side buffer** → `lighthouse-monitor.ts` holds errors/page_views in memory, flushes every 5s
- **Attribution** → also persisted to `localStorage` + cookie for cross-session tracking

### Admin Reporting Available Today

| Report | Access | RPC/View |
|--------|--------|----------|
| Platform stats (users, jobs, conversations) | Admin dashboard Overview tab | `rpc_admin_platform_stats()` |
| User list with role/status | Admin dashboard Users tab | `rpc_admin_users_list()` |
| Support inbox with ticket age | Admin dashboard Support tab | `rpc_admin_support_inbox()` |
| Metric timeseries (any metric, any date range) | Admin Metrics tab | `admin_metric_timeseries()` |
| Metric drilldown (row-level detail) | Admin Metrics tab | `admin_metric_drilldown()` |
| Market gap analysis (demand vs supply by area/category) | Admin Insights | `admin_market_gap()` |
| Unanswered jobs (no response for N hours) | Admin Insights | `admin_unanswered_jobs()` |
| Repeat work / client LTV | Admin Insights | `admin_repeat_work()` |
| Messaging pulse (response times, stale convos) | Admin Monitoring | `admin_messaging_pulse()` |
| Operator alerts (failed emails, stuck onboarding, etc.) | Admin Overview | `admin_operator_alerts()` |
| Health snapshot (queue depth, active users) | Admin Health tab | `admin_health_snapshot()` |
| Traffic source attribution | Admin Insights | `admin_top_sources()` |
| Onboarding funnel (drop-off, step timing) | Admin Insights | `admin_onboarding_funnel()` |

### 🔴 What's Missing: Weekly/Monthly Reporting

**You have no automated reporting pipeline.** All insights require manually opening the admin dashboard. There is no:

1. **Scheduled digest email** — No weekly/monthly summary sent to you automatically
2. **Metric snapshots** — No historical KPI snapshots stored for trend comparison
3. **Exportable reports** — No CSV/PDF export from the admin dashboard
4. **Anomaly detection** — `admin_operator_alerts` is reactive (threshold-based), not predictive
5. **Funnel visualisation** — Onboarding funnel data exists but no conversion funnel for the full client journey (visit → signup → post job → hire → complete → review)
6. **Cohort analysis** — Attribution data collected but no cohort retention analysis built

### Recommended Next Steps for Reporting

| Priority | Action | Effort |
|----------|--------|--------|
| **P0** | Create a scheduled edge function that emails you a weekly KPI digest (jobs posted, signups, conversations, response times, unanswered jobs) | 2–3 hours |
| **P0** | Add the missing DB indexes from the scaling roadmap | 30 min |
| **P1** | Schedule `purge_stale_telemetry` via pg_cron | 15 min |
| **P1** | Drop old admin views + delete dead question pack files | 30 min |
| **P1** | Gate or remove the `?test_email=1` endpoint | 15 min |
| **P2** | Add unique constraint on `conversations(job_id, client_id, pro_id)` | 15 min |
| **P2** | Build a full-funnel conversion report (visit → signup → job → hire → complete) | 3–4 hours |
| **P3** | Monthly snapshot table for KPI trend tracking | 2 hours |

---

## Summary Verdict

**Overall health: 7/10 — solid for early stage, but has security gaps and operational blind spots that need fixing before scaling.**

The architecture is clean and well-organised. Security has been significantly hardened recently. The main risks are:
1. **Unauthenticated test endpoint** on the notification function (fix immediately)
2. **Missing DB indexes** (will cause performance problems within months)
3. **No automated reporting** (you're flying blind on weekly trends)
4. **Dead code accumulation** (question pack files, deprecated admin shims)

The analytics instrumentation is comprehensive — you're collecting the right data. The gap is in **surfacing it automatically** rather than requiring manual dashboard checks.
