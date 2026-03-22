

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

## Sprint 3 — Alerts Engine + Stripe Events

### 3.1 Create `platform_alerts` table
- Columns: id, severity, title, body, category, related_id, status (open/acknowledged/resolved/snoozed), created_at, resolved_at

### 3.2 Build `run_platform_alert_rules` RPC
- Initial rules from daily metrics:
  - Zero-response jobs > 20% → high alert
  - Dispute rate > 5% → high alert
  - Wizard completion rate drops > 15% week-over-week → medium alert
  - Worker inactivity spike → medium alert
- Called by the daily aggregation job after metrics are written

### 3.3 Add Stripe webhook event logging
- Extend existing Stripe webhook handler (or create if not yet built) to call `track_event` for: `payment_intent_created`, `payment_succeeded`, `payment_failed`, `deposit_paid`, `refund_issued`
- Link to job_id/user_id in metadata

---

## Sprint 4 — Weekly AI Report + Admin Surface

### 4.1 Create `weekly_ai_reports` table
- Columns: id, report_week (date), summary_json, ai_analysis (text), issues (jsonb array), recommendations (jsonb array), comparison_json, created_at

### 4.2 Upgrade `weekly-kpi-digest` edge function
- Extend `gatherKPIs()` to pull from `daily_platform_metrics` (7-day window)
- Add previous-week comparison
- Add category performance + worker outliers
- Output structured summary JSON

### 4.3 Build AI analysis function
- New edge function `generate-weekly-ai-report`
- Takes the structured summary, sends to Lovable AI (gemini-2.5-flash)
- Prompt: what changed, why, top issues, opportunities, recommended actions
- Saves to `weekly_ai_reports`
- Called after digest generation

### 4.4 Build "Platform Assistant" admin tab
- New tab in existing AdminDashboard (reuse tab infrastructure)
- Sections:
  - **This Week Summary** — from latest `daily_platform_metrics` aggregation
  - **AI Analysis** — from latest `weekly_ai_reports`
  - **Active Alerts** — from `platform_alerts` (open/acknowledged), with resolve/acknowledge actions
  - **Recommendations** — from AI report, markable as reviewed/completed
  - **4-Week Trend** — sparklines for success rate, job score, response rate, dispute rate

### 4.5 Build `get_platform_assistant_summary` RPC
- Single SECURITY DEFINER RPC returning all data for the assistant tab
- Admin-only access check

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

