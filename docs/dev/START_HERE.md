# START HERE — Technical Quick-Start

**Platform:** Constructive Solutions Ibiza  
**Scope:** Construction & trade services only (locked in `src/domain/scope.ts`)  
**Stack:** React 18 · TypeScript · Vite · Tailwind · Supabase (auth, DB, edge functions, realtime)

---

## 10-Minute Audit Path

1. **What this is** → You're reading it. Construction job platform, Ibiza-only.
2. **How to run locally** → `bun install && bun run dev` — opens on `localhost:5173`
3. **Routes + access rules** → `src/app/routes/registry.ts` + `src/guard/access.ts`
4. **Core user journey** → [Section 2 below](#2-core-flow-trace)
5. **Database safety** → [Section 3 below](#3-database-security)
6. **Tests + lint + build** → `bun run test` · `bun run lint` · `bun run build`

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
| **RLS** | Row-Level Security on all user-facing tables (audit in [`docs/BACKEND_AUDIT.md`](./BACKEND_AUDIT.md)) |
| **Security functions** | `has_role()` (SECURITY DEFINER), `is_admin_email()`, `switch_active_role()` |
| **Admin dual-gate** | Route-level check (`admin` access rule) + DB-level `admin_allowlist` table |
| **Role storage** | Roles stored in `user_roles` table (not on profiles) — prevents privilege escalation |
| **Role switching** | `switch_active_role()` RPC validates target role exists in user's `roles` array before allowing change |
| **Trigger validation** | `ensure_micro_slug_exists()` blocks invalid service references at insert time |

All RLS policies are defined in `supabase/migrations/` and deployed via versioned migration files. Nothing lives only in a dashboard.

---

## 4. Confidence Answers

Questions a senior dev will ask — answered here so they don't have to hunt.

| Question | Answer | Proof |
|----------|--------|-------|
| **Do conversations belong to jobs?** | Yes. `conversations.job_id` is a foreign key. Every message thread is scoped to a specific job. | `get_or_create_conversation()` enforces job ownership |
| **Are quotes versioned?** | Yes. `quotes.revision_number` tracks versions. The `reviseQuote` action creates a new revision, not an overwrite. | `src/pages/jobs/actions/reviseQuote.action.ts` |
| **Is matching micro-service based?** | Yes. `matched_jobs_for_professional` is a DB view that joins `professional_services.micro_id` to `jobs.micro_slug` via the service taxonomy. | `src/pages/jobs/queries/matchedJobs.query.ts` |
| **Are job status transitions tracked?** | Yes. `log_job_status_change()` trigger writes every transition to `job_status_history` with `from_status`, `to_status`, `changed_by`, and timestamp. | `supabase/migrations/` |
| **Is the admin route actually secure?** | Yes. Dual-gated: route-level `admin` access rule + every admin RPC checks `has_role(uid, 'admin') AND is_admin_email()`. | `src/guard/access.ts` + all `admin_*` functions |

---

## 5. Edge Functions

11 deployed functions in `supabase/functions/`:

| Function | Purpose |
|----------|---------|
| `send-notifications` | Push notification dispatch |
| `send-job-notification` | Job-specific alerts to matched professionals |

| `translate-content` | Auto-translation (EN↔ES) |
| `backfill-translations` | Batch translation backfill |
| `collect-attribution` | UTM/referrer tracking |
| `update-user-email` | Secure email change |
| `seedpacks` / `seed-electrical` | Question pack seeding |
| `ping` | Health check |

---

## 6. Admin Tooling

`src/pages/admin/` — full operational dashboard:

- **Sections:** Users, Jobs, Content, Health, Insights, Support Inbox, Link Map
- **Insights pages:** Market Gap, Funnels, Pro Performance, Pricing, Trends, Unanswered Jobs, Repeat Work, Onboarding Funnel, Top Sources, Messaging Pulse
- **Monitoring:** `src/pages/admin/monitoring/MonitoringPage.tsx`
- **DB-powered RPCs:** `admin_health_snapshot()`, `admin_operator_alerts()`, `admin_market_gap()`, `admin_metric_timeseries()`, `admin_metric_drilldown()`

---

## 7. Code Quality Signals

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

## 8. What's Intentionally Not Built Yet

These are **planned for later phases**, not missing by accident:

| Feature | Status | Why later |
|---------|--------|-----------|
| **Payments / Escrow** | Planned | Requires payment processor integration + legal review |
| **Dispute Resolution** | Planned | Depends on payments being live |
| **Service Marketplace** | Gated (`service-layer` rollout) | UI + listings built, waiting for content threshold |
| **Professional Directory** | Gated (`founding-members` rollout) | Profiles built, waiting for verified pro count |
| **Portfolio Pages** | Planned | Depends on file storage + moderation flow |

The codebase is **phased, not incomplete**.

---

## 9. Where to Start If You Want to Improve

If you're reviewing this codebase and want to add immediate value:

1. **Review RLS policies** — `supabase/migrations/` contains all policies. Verify edge cases around quote visibility and job ownership.
2. **Review status transitions** — Job actions in `src/pages/jobs/actions/` each update status. Confirm the state machine in `ARCHITECTURE_PACK.md` matches reality.
3. **Review notification edge functions** — `supabase/functions/send-notifications/` and `send-job-notification/` are the main outbound channels. Check error handling and retry logic.

---

## 10. Go Deeper

| Document | What it covers |
|----------|----------------|
| [`docs/ARCHITECTURE_PACK.md`](./ARCHITECTURE_PACK.md) | Complete technical blueprint |
| [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) | Domain structure guide |
| [`docs/BACKEND_AUDIT.md`](./BACKEND_AUDIT.md) | RLS policies, security audit |
| [`docs/dev/PLATFORM_OVERVIEW.md`](./dev/PLATFORM_OVERVIEW.md) | Non-technical founder summary |
| [`docs/dev/FEVZI_WORKSPACE.md`](./dev/FEVZI_WORKSPACE.md) | Developer review workspace |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Code standards and conventions |

---

## Questions?

**Founder** — Constructive Solutions Ibiza  
**Lead Developer** — Fevzi ([workspace](./dev/FEVZI_WORKSPACE.md))  
**Architecture overview** — [`docs/ARCHITECTURE_PACK.md`](./ARCHITECTURE_PACK.md)
