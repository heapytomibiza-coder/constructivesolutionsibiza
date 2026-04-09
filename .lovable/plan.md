

# Plan: Daily Health System + Immediate Fixes

## What this builds

An automated daily health system that catches problems before users feel them, plus immediate fixes for the 4 critical issues found in today's audit.

## Part A: Immediate Fixes

### 1. Fix missing `get_saved_pros` RPC (190 failures/week)
Find all code calling this RPC. Either create the database function or remove/replace the calls. This is the single largest source of network failures.

### 2. Fix `professional_profiles` 406 errors (70/week)
Find the query producing the 406 and fix the select/filter shape to match the table schema.

### 3. Add chunk-load error recovery
Wrap React.lazy dynamic imports with an error handler that detects "Failed to fetch dynamically imported module" and does a single page reload. This prevents the hard crash seen on admin insight pages.

### 4. Harden auth token refresh
Add a listener for auth token refresh failures that clears the stale session and redirects to login with a friendly message, instead of leaving users in a broken half-logged-in state.

## Part B: Daily Health Edge Function

### New edge function: `daily-health-check`

Runs daily at 7:00 AM via cron. Queries the database for the last 24 hours and produces a structured health report. Sends it to Telegram (same admin channel as existing notifications).

**What it checks:**
- Error events count (24h) — flag if > 20
- Network failures count (24h) — flag if > 50
- React crashes (24h) — flag if > 0
- Auth token failures (24h) — flag if > 10
- Jobs created / posted (24h)
- New signups (24h)
- Wizard completion rate
- Email queue: pending + failed count
- Edge function failures from logs

**Output format (Telegram message):**
```
🏥 Daily Health Report — Apr 10

Status: 🟢 GREEN / 🟡 AMBER / 🔴 RED

Errors (24h): 3 ✅
Network fails (24h): 12 ✅
React crashes: 0 ✅
Auth failures: 2 ✅

Jobs created: 1
Jobs posted: 1
New users: 3
Wizard completion: 67%

Emails pending: 0
Emails failed: 0

Top failing route: /messages (4 errors)
Top network issue: collect-attribution (6 fails)
```

Thresholds for status:
- RED: React crashes > 0, OR errors > 50, OR auth failures > 20
- AMBER: errors > 20, OR network fails > 100, OR wizard completion = 0%
- GREEN: everything else

### 2. Cron job
Schedule `daily-health-check` at 7:00 AM daily via pg_cron.

## Part C: Chunk-Load Recovery (App-wide)

Add a global handler in the app entry point that catches dynamic import errors and performs one automatic reload, using a sessionStorage flag to prevent infinite loops.

## Files to Create/Edit

| File | Action |
|---|---|
| `supabase/functions/daily-health-check/index.ts` | **Create** — daily health check edge function |
| `supabase/config.toml` | **Edit** — add function config |
| `src/App.tsx` or router file | **Edit** — add chunk-load error recovery |
| Code calling `get_saved_pros` | **Edit** — fix or remove broken RPC call |
| Code querying `professional_profiles` with 406 | **Edit** — fix select shape |
| `src/integrations/supabase/client.ts` | **No edit** (auto-generated) — auth recovery goes in a wrapper |
| pg_cron | **Insert** — schedule daily-health-check at 7 AM |

### Database changes
- One cron job insert (not a migration)
- No new tables needed — uses existing `error_events`, `network_failures`, `daily_platform_metrics`, `email_notifications_queue`

