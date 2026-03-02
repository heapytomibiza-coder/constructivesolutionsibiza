

## Three-Part Plan: Data Retention, Quote Funnel Tracking, and Tracking Gap Audit

### Part 1: Data Retention Policy (Auto-Purge)

Create a scheduled database function that purges old rows from high-volume observability tables. Retention windows:

| Table | Retention | Rationale |
|---|---|---|
| `page_views` | 30 days | Volume is highest; older views have no debugging value |
| `error_events` | 60 days | Keep longer for trend analysis of recurring bugs |
| `network_failures` | 60 days | Same as errors — useful for spotting regression patterns |
| `analytics_events` | 365 days | Business KPIs; keep a full year |
| `attribution_sessions` | 180 days | Marketing ROI needs longer window |

**Implementation:**
1. Migration: create a `purge_stale_telemetry()` SECURITY DEFINER function that DELETEs rows older than each threshold
2. Schedule via `pg_cron` (hourly or daily) calling this function directly (no edge function needed)
3. Add an index on `created_at` for `page_views`, `error_events`, `network_failures` if not already present (speeds up deletes)

---

### Part 2: Quote Funnel Metrics

Currently tracked: `quote_submitted`, `quote_revised`, `quote_accepted`, `quote_withdrawn`.
Missing: **`quote_viewed`** (client opens/sees a quote).

**Implementation:**
1. In `QuotesTab.tsx`: when the client view renders quotes, fire `trackEvent('quote_viewed', 'client', { jobId, quoteCount })` — guarded with a `useEffect` + ref to fire once per mount
2. No new events needed for submitted/revised/accepted/withdrawn — already instrumented in their respective action files

This completes the quote funnel: `quote_submitted → quote_viewed → quote_accepted` with `quote_revised` and `quote_withdrawn` as side branches.

---

### Part 3: Tracking Gap Audit vs Pipe-Control KPIs

**Pipe-control baseline KPIs** and their tracking status:

| KPI | Status | Gap |
|---|---|---|
| Jobs posted | Tracked (`job_posted`) | None |
| Wizard started/abandoned | Tracked (`job_wizard_started`, `job_wizard_abandoned`, `job_wizard_step_viewed`) | None |
| Auth signup/login success/failure | Tracked (`signup_started`, `login_started`, `signup_failed`, `login_failed`) | None |
| Pro onboarding step progression | Tracked (`pro_onboarding_step_entered/completed`, `onboarding_step_failed`) | None |
| Conversations started | Tracked (`conversation_started`) | None |
| Quote funnel | Mostly tracked | **Gap: `quote_viewed`** (fix in Part 2) |
| Messages sent | DB-level only (no `trackEvent`) | **Gap: no `message_sent` event** — needed for engagement velocity |
| Job completion + review | `review_submitted` tracked; `job_completed` via `completeJob.action` | **Gap: no `job_completed` event** |
| Search usage | Not tracked | **Gap: no `search_performed` event** — low priority for pipe-control |
| Page views (engagement) | Tracked via Lighthouse (`page_views` table) | None |
| Error rate | Tracked via Lighthouse (`error_events`) | None |

**Additional events to add (2 gaps):**
1. `job_completed` in `completeJob.action.ts` — fires when client marks job done
2. `message_sent` in `ConversationThread.tsx` or wherever messages are sent — fires on each user message

---

### Summary of Changes

**Database:**
- 1 migration: `purge_stale_telemetry()` function
- 1 cron job: schedule daily purge (via `pg_cron` + `pg_net`)

**Frontend (4 files):**
- `QuotesTab.tsx`: add `quote_viewed` event
- `completeJob.action.ts`: add `job_completed` event
- Message send handler: add `message_sent` event
- No new dependencies

