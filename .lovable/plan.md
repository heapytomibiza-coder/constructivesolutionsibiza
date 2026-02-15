
# Phase Completion Audit + Fixes

## Phase Scoreboard

| Phase | Status | Details |
|-------|--------|---------|
| 1. Database foundation | COMPLETE | `analytics_events` table, `track_event()` RPC, `admin_metric_timeseries` (with `generate_series` zero-fill), `admin_metric_drilldown`, `admin_market_gap`, `admin_unanswered_jobs`, `admin_repeat_work` -- all exist with `SECURITY DEFINER` + `has_role` admin checks |
| 2. Frontend infra | COMPLETE | `metricRegistry.ts`, `useAdminMetricTimeseries`, `useAdminMetricDrilldown`, `MetricTrendChart`, `DrilldownTable`, `InsightFilterBar`, `DeltaBadge` all exist and work together |
| 3. Clickable tiles + Insight Workspace | PARTIAL | `MetricInsightPage` template is complete. But stat tiles in `OperatorCockpit` and `HealthSection` are NOT clickable -- they don't link to insight workspaces |
| 4. Leader insight pages | MOSTLY COMPLETE | All 7 pages exist and render. But have bugs and missing features (detailed below) |
| 5. Entity detail drawers | NOT STARTED | No drawers exist for jobs, users, or pros |
| 6. Alerts engine | NOT STARTED | No alerts table, hooks, or UI |
| 7. Event instrumentation | NOT STARTED | `trackEvent()` utility exists but is called ZERO times across the entire codebase |

---

## What needs to be fixed / completed

### Fix 1: Make stat tiles clickable (Phase 3 gap)

`OperatorCockpit.tsx` has 5 `StatTile` components (Total Users, Active Pros, Open Jobs, Conversations, Open Tickets) that are just static numbers. They need to navigate to their corresponding insight workspace on click.

`HealthSection.tsx` has 5 cards (Pending Emails, Failed Emails, Jobs Posted Today, Active Users 24h, Active Users 7d) that are also static.

**Change**: Wrap each `StatTile` / health card with click handlers that navigate to `/dashboard/admin/insights/:metricKey`.

### Fix 2: MetricInsightPage pagination bug

When area or category filters change, `page` state stays at whatever value it was. If you're on page 3 and change the area filter, the drilldown requests offset 150 which likely returns empty data.

**Change**: Add `useEffect(() => setPage(0), [area, category, metricKey])` to reset pagination on filter change.

### Fix 3: Remove dead `FUNNEL_STEPS` constant

`FunnelsPage.tsx` has an unused `FUNNEL_STEPS` array referencing event metric keys (`job_wizard_started`, `job_step_completed`) that don't exist in the metric system. This is misleading dead code.

**Change**: Delete the `FUNNEL_STEPS` constant.

### Fix 4: ProPerformancePage has an import error

`Users` is imported at the bottom of the file (line 192) after the default export, which is incorrect. It should be part of the top imports.

**Change**: Move `Users` import to the top with the other lucide imports.

### Fix 5: TrendRadarPage fires 32 parallel RPC calls

Each of the 16 categories makes 2 `useAdminMetricTimeseries` calls (this week + last week) = 32 simultaneous RPC calls on page load. This is a performance problem.

**Change**: Replace with a single aggregation query that fetches all category trends at once, or batch the calls.

### Fix 6: InsightFilterBar uses hardcoded area/category arrays

The `AREAS` and `CATEGORIES` arrays are hardcoded and will drift from actual taxonomy. Already missing newer categories like `painting-decorating`, `cleaning`, `architects-design`, etc.

**Change**: Populate filter options dynamically from the database (service_categories table for categories, distinct job areas for areas).

### Fix 7: Add "No Pro Reply" tier to Unanswered Jobs

Current definition is "no conversations". But a more painful failure is "conversation exists but pro never replied". The `conversations` table has `pro_id` and `messages` table has `sender_id`, so we can detect this.

**Change**: Add a second section or toggle showing jobs where a conversation exists but the pro has sent zero messages.

### Fix 8: Begin event instrumentation (Phase 7 kickstart)

`trackEvent()` is defined but never called. Without this, funnels will remain proxy-mode forever.

**Change**: Add `trackEvent()` calls to the highest-value touchpoints:
- Job wizard: `job_wizard_started` when entering the wizard, `job_posted` on successful publish
- Pro onboarding: `pro_onboarding_started` when entering onboarding
- Messaging: `conversation_started` when a pro initiates contact

---

## Technical Details

### Files to modify

- `src/pages/admin/sections/OperatorCockpit.tsx` -- add `useNavigate` + click handlers on stat tiles
- `src/pages/admin/sections/HealthSection.tsx` -- add click handlers on health cards
- `src/pages/admin/insights/MetricInsightPage.tsx` -- add `useEffect` for page reset on filter change
- `src/pages/admin/insights/FunnelsPage.tsx` -- remove dead `FUNNEL_STEPS` constant
- `src/pages/admin/insights/ProPerformancePage.tsx` -- fix `Users` import position
- `src/pages/admin/insights/TrendRadarPage.tsx` -- refactor to reduce RPC calls (batch approach)
- `src/pages/admin/components/InsightFilterBar.tsx` -- fetch areas/categories from database
- `src/pages/admin/insights/UnansweredJobsPage.tsx` -- add "No Pro Reply" tier
- `src/pages/admin/hooks/useUnansweredJobs.ts` -- update to support two-tier definition
- `src/features/wizard/canonical/CanonicalJobWizard.tsx` -- add `trackEvent` calls
- `src/pages/onboarding/ProfessionalOnboarding.tsx` -- add `trackEvent` calls
- `src/pages/jobs/PostJob.tsx` -- add `trackEvent` on publish

### Build order

1. Bugs first: pagination reset, dead code removal, import fix (quick wins)
2. Clickable stat tiles (completes Phase 3)
3. Dynamic filter bar (prevents taxonomy drift)
4. TrendRadar performance fix (reduces 32 calls to 1-2)
5. Unanswered Jobs v2 with "No Pro Reply" tier
6. Event instrumentation kickstart (begins Phase 7)
