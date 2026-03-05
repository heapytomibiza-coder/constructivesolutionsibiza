# START HERE — Investor / Lead Dev Quick-Start

**Platform:** Constructive Solutions Ibiza  
**What it does:** Connects clients with tradespeople for construction jobs in Ibiza.  
**Stack:** React 18 · TypeScript · Vite · Tailwind · Supabase (auth, DB, edge functions, realtime)

---

## 1. Architecture Overview (5 key files)

| File | What it tells you |
|------|-------------------|
| [`docs/ARCHITECTURE_PACK.md`](./ARCHITECTURE_PACK.md) | Master blueprint — routes, job state machine, data spine, rollout phases |
| [`src/App.tsx`](../src/App.tsx) | Every route, guard wrapper, and rollout gate in one place |
| [`src/app/routes/registry.ts`](../src/app/routes/registry.ts) | Route registry with lanes (`public`, `client`, `professional`, `shared`, `admin`) + access rules |
| [`src/guard/access.ts`](../src/guard/access.ts) | Pure function that evaluates access rules (`public`, `auth`, `role:client`, `role:professional`, `proReady`, `admin`) |
| [`src/domain/scope.ts`](../src/domain/scope.ts) | Platform scope lock (construction-only) + locked terminology (Asker/Tasker) |

---

## 2. Core Flow Trace

**Post → Match → Message → Quote → Complete → Review**

| Step | Key files |
|------|-----------|
| **Post a job** | `src/features/wizard/canonical/` — multi-step wizard with question packs, draft persistence, URL-driven steps |
| **Job Board** | `src/pages/jobs/queries/jobBoard.query.ts` — public board query |
| **Matching** | `src/pages/jobs/queries/matchedJobs.query.ts` — DB view matches jobs to professionals by micro-category |
| **Messaging** | `src/pages/messages/` — realtime threads via Supabase, conversation list, support escalation |
| **Submit quote** | `src/pages/jobs/actions/submitQuote.action.ts` |
| **Accept quote** | `src/pages/jobs/actions/acceptQuote.action.ts` |
| **Revise quote** | `src/pages/jobs/actions/reviseQuote.action.ts` |
| **Complete job** | `src/pages/jobs/actions/completeJob.action.ts` |
| **Leave review** | `src/pages/jobs/actions/submitReview.action.ts` |

Every action is a named file. No business logic hidden in random components.

---

## 3. Database Security

| Signal | Detail |
|--------|--------|
| **Migrations** | 93 versioned SQL migrations in `supabase/migrations/` — all in-repo, all auditable |
| **RLS** | Row-Level Security on all user-facing tables (see [`docs/BACKEND_AUDIT.md`](./BACKEND_AUDIT.md)) |
| **Security functions** | `has_role()` (SECURITY DEFINER), `is_admin_email()`, `switch_active_role()` |
| **Admin dual-gate** | Route-level check (`admin` access rule) + DB-level `admin_allowlist` table |
| **Role storage** | Roles stored in `user_roles` table (not on profiles) — prevents privilege escalation |

---

## 4. Edge Functions

11 deployed functions in `supabase/functions/`:

| Function | Purpose |
|----------|---------|
| `send-notifications` | Push notification dispatch |
| `send-job-notification` | Job-specific alerts to matched professionals |
| `send-auth-email` | Custom auth email templates |
| `translate-content` | Auto-translation (EN↔ES) |
| `backfill-translations` | Batch translation backfill |
| `collect-attribution` | UTM/referrer tracking |
| `update-user-email` | Secure email change |
| `seedpacks` / `seed-electrical` | Question pack seeding |
| `ping` | Health check |

---

## 5. Admin Tooling

`src/pages/admin/` — full operational dashboard:

- **Sections:** Users, Jobs, Content, Health, Insights, Support Inbox, Link Map
- **Insights pages:** Market Gap, Funnels, Pro Performance, Pricing, Trends, Unanswered Jobs, Repeat Work, Onboarding Funnel, Top Sources, Messaging Pulse
- **Monitoring:** `src/pages/admin/monitoring/MonitoringPage.tsx`
- **DB-powered RPCs:** `admin_health_snapshot()`, `admin_operator_alerts()`, `admin_market_gap()`, `admin_metric_timeseries()`, `admin_metric_drilldown()`

---

## 6. Code Quality Signals

| Signal | Evidence |
|--------|----------|
| TypeScript | Strict mode, no `any` policy |
| Linting | `eslint.config.js` with import plugin |
| Tests | `vitest.config.ts` + `src/test/` |
| i18n | `i18next` with EN/ES, namespace-based (`auth`, `jobs`, `wizard`, etc.) |
| Feature modules | `src/pages/*` organised by domain with co-located `actions/`, `queries/`, `hooks/` |
| Route system | Central registry → derived nav → no scattered route arrays |
| Rollout gating | `src/domain/rollout.ts` — drip-feed features by phase |

---

## 7. Go Deeper

| Document | What it covers |
|----------|----------------|
| [`docs/ARCHITECTURE_PACK.md`](./ARCHITECTURE_PACK.md) | Complete technical blueprint |
| [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) | Domain structure guide |
| [`docs/BACKEND_AUDIT.md`](./BACKEND_AUDIT.md) | RLS policies, security audit |
| [`docs/dev/PLATFORM_OVERVIEW.md`](./dev/PLATFORM_OVERVIEW.md) | Non-technical founder summary |
| [`docs/dev/FEVZI_WORKSPACE.md`](./dev/FEVZI_WORKSPACE.md) | Developer review workspace |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Code standards and conventions |
