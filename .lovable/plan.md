

# Stability & Hardening Sprint — Phase 2

Based on the deep audit continuation, here are the verified findings and the concrete sprint to address them.

## Verified Findings

### Confirmed Critical
1. **Background jobs have NO scheduling** — `pg_cron` extension is enabled in 4 migrations but zero `cron.schedule()` calls exist anywhere. `send-notifications`, `process-nudges`, `refresh-demand-snapshots`, `daily-health-check`, `generate-weekly-ai-report`, `weekly-kpi-digest`, `dispute-deadline-automation`, and `optimize-image` are deployed but never invoked automatically.
2. **5 native `confirm()` calls** remain in destructive actions (JobTicketDetail ×2, QuoteComparison ×1, CancellationRequestCard ×1, DisputeDetail ×1).
3. **`/launch-checklist` is publicly accessible** — internal developer page with no auth gate.
4. **6 components in `dashboard/client/components/`** make direct Supabase calls (architecture violation).
5. **236 `.single()` calls across 29 files** — many are on lookups that could legitimately return 0 rows.

### Confirmed Medium
6. **9 edge functions have `verify_jwt = false`** in config.toml for background/webhook functions — correct for cron/webhook use, but `collect-attribution`, `generate-bio`, `listing-description-assist`, `search-stock-photos`, `translate-content`, `update-user-email`, `backfill-translations`, `seed-electrical` have no config entries (they inherit default `verify_jwt = true` from Lovable Cloud, which is correct).
7. **`dangerouslySetInnerHTML`** — only in `chart.tsx` for CSS injection (developer-controlled). No user content paths. Safe.

---

## Sprint Plan

### Ticket 1 (P0): Schedule Background Jobs via pg_cron
Create a single migration that registers `cron.schedule()` entries for all background edge functions:

| Function | Schedule | Notes |
|----------|----------|-------|
| `send-notifications` | Every 2 minutes | Process email queue |
| `process-nudges` | Every 15 minutes | Stalled journey nudges |
| `daily-health-check` | Daily 06:00 UTC | Platform health snapshot |
| `refresh-demand-snapshots` | Daily 05:00 UTC | Pro insights data |
| `dispute-deadline-automation` | Every 30 minutes | Deadline enforcement |
| `generate-weekly-ai-report` | Weekly Monday 07:00 UTC | Admin AI summary |
| `weekly-kpi-digest` | Weekly Monday 06:30 UTC | KPI email |

Each job calls the edge function via `pg_net` HTTP POST with the internal secret header. The migration will also create a `cron_job_log` view or use `cron.job_run_details` for observability.

### Ticket 2 (P0): Replace All `confirm()` with AlertDialog
Replace native `confirm()` in 5 locations with shadcn AlertDialog:
- `JobTicketDetail.tsx` — close job, withdraw from job (2 calls)
- `QuoteComparison.tsx` — decline quote
- `CancellationRequestCard.tsx` — accept/decline cancellation
- `DisputeDetail.tsx` — re-analyze dispute

Pattern: Add local `AlertDialog` state, trigger on button click, execute mutation in `onConfirm` callback.

### Ticket 3 (P1): Gate `/launch-checklist` Behind Admin Auth
Wrap the route in `RouteGuard` with `access: 'admin'` so only admin users can access it.

### Ticket 4 (P1): Extract Dashboard Client Component Supabase Calls
Move inline Supabase calls from 6 components into proper action/query files:
- `CancellationRequestCard.tsx` → `actions/respondToCancellation.action.ts`
- `JobTicketCompletion.tsx` → `actions/requestCompletion.action.ts`
- `ProgressUpdates.tsx` → `actions/addProgressUpdate.action.ts`
- `PortfolioPrompt.tsx` → `actions/savePortfolioProject.action.ts`
- `ProQuoteSummary.tsx` → `actions/addQuoteLineItem.action.ts`
- `ClientJobCard.tsx` → already uses `cancel_job` RPC, extract to `actions/cancelJob.action.ts`

### Ticket 5 (P2): Convert High-Risk `.single()` to `.maybeSingle()`
Focus on lookups where a missing row is a valid state (not inserts):
- `ListingPreviewDrawer.tsx` (admin drawer — profile/micro lookups)
- `adminUserDetails.query.ts` (profile/roles lookups)
- `serviceListings.query.ts` (provider profile, micro category, subcategory, category chain)
- `QuoteComparison.tsx` (job lookup)
- `QuestionsStep.tsx` (fallback question pack lookup)
- `forumQueries.ts` (category by slug, post by id)
- `hydrateFromJob.ts` (job lookup for edit mode)
- `useListingEditor.ts` (listing lookup)
- `disputes.query.ts` (dispute detail)
- `RaiseDispute.tsx` (job lookup)

Leave `.single()` on insert-then-select patterns (messages, forum posts/replies) where a missing row is genuinely an error.

```text
Ticket  Priority  Effort    Files Changed
──────  ────────  ────────  ─────────────
1       P0        45 min    1 migration
2       P0        1 hr      5 files
3       P1        5 min     1 file (App.tsx)
4       P1        1 hr      6 new files + 6 edited
5       P2        1 hr      ~12 files
```

Total: ~3.5 hours, 1 migration, ~12 new files, ~18 edited files.

