

# Platform Assistant MVP — Implementation Plan

## Architectural Decision

The audit is correct: **do NOT create a new `platform_events` table**. The existing `analytics_events` table (with `event_name`, `metadata` JSONB, `user_id`, `role`, `created_at`) already serves as the event backbone. It has indexes, RLS policies, a `track_event` RPC, and a frontend `trackEvent()` helper used across 26 files. We extend, not duplicate.

---

## What Already Exists (will be reused)

- **`analytics_events`** — event stream with 345+ instrumentation points
- **`professional_micro_stats`** — per-service completion/rating tracking
- **`track_event` RPC** — server-side event writer
- **`trackEvent()` client helper** — frontend instrumentation
- **`admin_operator_alerts` RPC** — operational alerts (5 rules)
- **`weekly-kpi-digest` edge function** — weekly email with KPIs
- **11 admin insight pages** — funnels, pro performance, trends, etc.
- **Dispute system** — full state machine with AI analysis
- **`professional_matching_scores` view** — matching engine

---

## Sprint 1 — Event Backbone + Job Score

### 1.1 Standardise event taxonomy + enrich metadata
- Document approved event names (freeze taxonomy)
- No schema change needed — `metadata` JSONB already supports `job_id`, `worker_id`, `category`, etc.
- Update `trackEvent()` to accept optional typed fields and merge them into metadata consistently

### 1.2 Add missing frontend instrumentation
- Audit 26 files already instrumented; add missing events:
  - `worker_viewed_job`, `worker_responded`, `worker_ignored_job`
  - `quote_viewed` (client side)
  - `admin_viewed_insight_panel`
- Stripe events handled in Sprint 3

### 1.3 Implement `calculate_job_score` RPC
- SQL function scoring jobs 0-100 based on: description (20), photos (20), budget (20), category+service (20), timeline (20)
- Store result in new `job_score` column on `jobs` table (migration: `ALTER TABLE jobs ADD COLUMN job_score numeric DEFAULT NULL`)
- Trigger on INSERT/UPDATE to auto-calculate

### 1.4 Implement `calculate_worker_trust_score` RPC
- SQL function using disputes (last 90d), completion rate, response rate, review average
- Store in new `trust_score` column on `professional_profiles` (migration)
- Trigger refresh on: dispute resolved, job completed, review submitted

---

## Sprint 2 — Derived Metrics + Daily Aggregation

### 2.1 Create `daily_platform_metrics` table
- One row per date: jobs_created, jobs_posted, jobs_awarded, jobs_completed, jobs_disputed, avg_job_score, response_rate, success_rate, dispute_rate, wizard_completion_rate, jobs_with_zero_responses

### 2.2 Create `daily_category_metrics` table
- One row per date+category: jobs_created, avg_job_score, avg_responses, success_rate, dispute_rate

### 2.3 Create `daily_worker_metrics` table
- One row per date+worker: jobs_received, responded, completed, disputes, response_rate, trust_score snapshot

### 2.4 Build `aggregate_daily_metrics` scheduled edge function
- Runs daily via pg_cron
- Reads previous day's data from jobs, analytics_events, disputes, conversations
- Upserts into the 3 metrics tables
- Idempotent (re-run safe)

---

## Sprint 3 — Alerts Engine + Stripe Events ✅

### 3.1 Create `platform_alerts` table ✅
- Columns: id, severity, title, body, category, metric_date, related_id, status, dedupe_key, metadata, created_at, resolved_at, acknowledged_at, acknowledged_by
- Dedupe index on (dedupe_key, metric_date)
- Status workflow: open → acknowledged → resolved / snoozed
- Admin-only RLS (read + update)

### 3.2 Build `run_platform_alert_rules` RPC ✅
- 5 alert rules based on daily_*_metrics:
  1. Zero-response jobs > 20% → high (>40% → critical)
  2. Dispute rate > 5% → high (>10% → critical)
  3. Wizard completion rate drops > 15% week-over-week → medium
  4. Category underperformance (3+ jobs, <0.5 avg responses) → medium
  5. Worker inactivity spike (>30% of verified pros idle) → medium
- Deduplication via ON CONFLICT on dedupe_key+metric_date

### 3.2b Fix aggregate_daily_metrics null-rate handling ✅
- response_rate, success_rate, dispute_rate, wizard_completion_rate → NULL when denominator is zero
- success_rate documented as "resolved-outcome success rate" (completed / (completed + disputed))

### 3.3 Add Stripe webhook event logging (deferred)
- Extend existing Stripe webhook handler to call `track_event` for payment events
- Link to job_id/user_id in metadata

---

## Sprint 4 — Weekly AI Report + Admin Surface ✅

### 4.1 Create `weekly_ai_reports` table ✅
- Columns: id, report_week, summary_json, comparison_json, ai_analysis, issues, recommendations, open_alerts_snapshot, created_at
- Unique index on report_week, admin-only RLS

### 4.2 Build `generate-weekly-ai-report` edge function ✅
- Assembles 7-day platform rollup + previous week comparison + category breakdown + active alerts
- Calls Lovable AI (gemini-2.5-flash) for structured analysis
- Returns issues + recommendations + narrative analysis
- Upserts to weekly_ai_reports (idempotent per week)
- Auth: internal secret OR admin JWT

### 4.3 Build `get_platform_assistant_summary` RPC ✅
- Single SECURITY DEFINER RPC returning: this_week, prev_week, 4-week trends, active alerts (14d), latest AI report
- Admin-only access check

### 4.4 Build "Platform Assistant" admin tab ✅
- New tab in AdminDashboard with Brain icon
- Sections: This Week Summary (with delta indicators), AI Analysis, Recommendations, Active Alerts (with acknowledge/resolve), 4-Week Trends (sparklines)

---

## Sprint 5 — Polish + QA

### 5.1 Match outcome tracking
- Log `job_sent_to_worker`, `worker_viewed_job`, `worker_responded` events from existing notification/conversation flows
- Create simple `job_distribution_log` view over analytics_events for debugging

### 5.2 End-to-end validation
- Verify: action → event → daily metric → alert → weekly report → admin surface

---

## Technical Details

### Database migrations needed
1. `ALTER TABLE jobs ADD COLUMN job_score numeric DEFAULT NULL`
2. `ALTER TABLE professional_profiles ADD COLUMN trust_score numeric DEFAULT NULL`
3. `CREATE TABLE daily_platform_metrics (...)`
4. `CREATE TABLE daily_category_metrics (...)`
5. `CREATE TABLE daily_worker_metrics (...)`
6. `CREATE TABLE platform_alerts (...)`
7. `CREATE TABLE weekly_ai_reports (...)`
8. Score calculation functions + triggers
9. Alert rules RPC
10. Summary RPC

### Edge functions
- `aggregate-daily-metrics` (scheduled via pg_cron)
- `generate-weekly-ai-report` (called after weekly digest)

### Frontend changes
- New admin tab "Assistant" in `AdminDashboard.tsx`
- ~4 new components: AlertsPanel, RecommendationsPanel, TrendView, WeekSummary
- Additional `trackEvent()` calls in ~5 existing files

### No changes to
- Existing matching engine
- Existing dispute system
- Existing admin insight pages
- `analytics_events` schema (metadata JSONB already flexible enough)
- `src/integrations/supabase/client.ts` or `types.ts`

---

## Estimated scope
- ~7 migrations
- ~2 new edge functions
- ~1 new admin tab with 4-5 sub-components
- ~5 new RPCs/SQL functions
- ~10 files modified for additional event instrumentation

This is large. I recommend implementing sprint-by-sprint across multiple conversations, starting with Sprint 1 (event taxonomy + job score + trust score).

