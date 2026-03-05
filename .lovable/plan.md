

## Plan: Create `docs/START_HERE.md` + add to Fevzi's workspace

A single investor-facing quick-start guide pointing to the 10 key files/folders, plus placing a copy in `docs/dev/` for Fevzi.

### File: `docs/START_HERE.md`

Structure (concise, ~150 lines):

**1. What is this?**
One-liner: Constructive Solutions Ibiza — construction job platform connecting clients with tradespeople in Ibiza.

**2. Architecture overview (5 files)**
- `docs/ARCHITECTURE_PACK.md` — master blueprint (routes, state machine, data spine)
- `src/App.tsx` — all routes, guards, rollout gates
- `src/app/routes/registry.ts` — route registry with lanes + access rules
- `src/guard/access.ts` + `RouteGuard.tsx` — auth + role enforcement
- `src/domain/rollout.ts` + `scope.ts` — feature gating + platform scope lock

**3. Core flow trace (Post → Match → Message → Quote → Complete → Review)**
- Job Wizard: `src/features/wizard/canonical/`
- Job Board: `src/pages/jobs/queries/jobBoard.query.ts`
- Matching: `src/pages/jobs/queries/matchedJobs.query.ts`
- Messaging: `src/pages/messages/` (realtime thread, conversation list)
- Quotes: `src/pages/jobs/actions/submitQuote.action.ts`, `acceptQuote.action.ts`, `reviseQuote.action.ts`
- Completion: `src/pages/jobs/actions/completeJob.action.ts`
- Reviews: `src/pages/jobs/actions/submitReview.action.ts`

**4. Database security**
- 93 migrations in `supabase/migrations/` (versioned, in-repo)
- RLS policies on all tables (documented in `docs/BACKEND_AUDIT.md`)
- Security functions: `has_role()`, `is_admin_email()`, `switch_active_role()`
- Admin dual-gate: role check + `admin_allowlist` table

**5. Edge functions**
- `supabase/functions/` — 11 deployed functions (notifications, translations, attribution, auth emails)

**6. Admin tooling**
- `src/pages/admin/` — full ops dashboard with insights, monitoring, support
- DB-powered analytics RPCs: `admin_health_snapshot()`, `admin_operator_alerts()`, `admin_market_gap()`, etc.

**7. Code quality signals**
- TypeScript strict throughout
- ESLint configured
- Tests in `src/test/`
- i18n with `i18next` (EN/ES)
- Feature-based file organisation

**8. Where to go deeper**
Links to `ARCHITECTURE_PACK.md`, `BACKEND_AUDIT.md`, `docs/dev/FEVZI_WORKSPACE.md`

### Changes
1. Create `docs/START_HERE.md`
2. Create `docs/dev/START_HERE.md` (same file, copied into Fevzi's workspace)

No application code changes.

