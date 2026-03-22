

# Backfill Historical Metrics and Generate First AI Report

## What you have

Your data situation is strong for a backfill:

| Table | Rows | Date range |
|-------|------|-----------|
| analytics_events | 3,650 | Feb 15 – Mar 22 (36 days, continuous) |
| jobs | 46 | Feb 19 – Mar 21 |
| conversations | 82 | Feb 19 – Mar 22 |
| messages | 156 | Feb 19 – Mar 22 |
| disputes | 3 | Mar 5 – Mar 20 |
| job_status_history | 59 | Feb 19 – Mar 21 |
| professional_services | 1,161 | Feb 4 – Mar 21 |
| daily_platform_metrics | **0** | — (never aggregated) |

You have real event data (wizard starts, job_posted, message_sent, etc.) and real business records. This is a **full backfill** scenario — not reconstructed, but actual source data.

## Plan

### Step 1: Backfill daily metrics for all 36 historical days

Create a migration with a one-time backfill function that loops from Feb 15 through yesterday (Mar 21), calling the aggregation logic for each date. The existing `aggregate_daily_metrics` RPC requires admin auth, so the backfill function will be `SECURITY DEFINER` and bypass the auth check — it will contain the same aggregation logic inline, run once, then drop itself.

This populates:
- `daily_platform_metrics` — 36 rows
- `daily_category_metrics` — rows per category per day
- `daily_worker_metrics` — rows per active worker per day

### Step 2: Run alert rules on backfilled data

After metrics exist, call `run_platform_alert_rules` for each historical date to generate any alerts that would have fired. This gives the AI report a realistic alert history to reference.

### Step 3: Generate the first weekly AI report

Invoke the `generate-weekly-ai-report` edge function. It will now find real metrics, real week-over-week comparisons, and real alerts to analyze.

### Step 4: Add "Backfill Metrics" button to Platform Assistant

Add a small admin utility in the assistant tab that lets operators trigger a backfill for a date range. This is useful for:
- Re-running after fixing aggregation logic
- Catching up after downtime

Will show progress and results.

## Technical details

**Migration SQL** — a `DO` block that:
1. Loops `d` from `'2026-02-15'` to `CURRENT_DATE - 1`
2. For each date, runs the same aggregation queries as `aggregate_daily_metrics` but without the auth check
3. Then loops again calling `run_platform_alert_rules(d)` for each date
4. Self-contained, runs once on deploy

**UI addition** — small "Backfill" section in `PlatformAssistant.tsx` with date range inputs and a button that calls `aggregate_daily_metrics` + `run_platform_alert_rules` in sequence via RPC.

**Edge function call** — after backfill, trigger `generate-weekly-ai-report` to produce the first report with real data.

