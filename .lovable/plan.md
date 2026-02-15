

# Phase 6: Admin Alerts Engine (Operator Cockpit Upgrade)

## Problem

The admin currently has no visibility into critical events unless manually checking tables. The "Needs Attention" section only shows 3 static metrics (failed emails, open tickets, jobs today). There's no signal for new signups, stuck onboarding, unanswered jobs, or error spikes.

## Solution

Build a dynamic alerts system powered by a single new RPC that evaluates alert rules server-side and returns only the alerts that need attention. No new tables needed for v0 -- pure computed alerts from existing data.

## Architecture

The alerts engine is **entirely computed** (no `admin_alerts` table yet). A single RPC evaluates all rules and returns active alerts. This avoids the complexity of a cron job, deduplication, and state management. When you need persistence (snooze/acknowledge), that's Phase 6.1.

```text
+---------------------------+
|  admin_operator_alerts()  |  <-- New SECURITY DEFINER RPC
|  Evaluates 7 alert rules  |
|  Returns: AlertCard[]     |
+---------------------------+
            |
            v
+---------------------------+
|  useAdminAlerts() hook    |  <-- New React Query hook
|  Polls every 60s          |
+---------------------------+
            |
            v
+---------------------------+
|  OperatorCockpit.tsx      |  <-- Upgraded "Needs Attention"
|  Renders dynamic cards    |
|  with severity + CTA      |
+---------------------------+
```

## Step 1: New RPC -- `admin_operator_alerts()`

Creates a SECURITY DEFINER function that evaluates all alert rules against live data and returns a JSON array of active alerts.

**Alert rules (7 total):**

| # | Alert Key | Severity | Threshold | CTA Link |
|---|-----------|----------|-----------|----------|
| 1 | `failed_emails` | red | failed > 0 | Health tab |
| 2 | `high_priority_tickets` | red | open high-priority tickets > 0 | Support tab |
| 3 | `open_tickets` | yellow | open/triage tickets > 0 | Support tab |
| 4 | `unanswered_jobs` | red | jobs with no conversation after 6h > 0 | Unanswered jobs insight |
| 5 | `stuck_onboarding` | yellow | pros stuck in non-complete phase > 6h | Users tab (filtered to professionals) |
| 6 | `new_signups_24h` | blue (info) | new users in last 24h > 0 | Users insight |
| 7 | `new_pros_24h` | blue (info) | new pros in last 24h > 0 | Pros insight |

**Return shape per alert:**
```text
{
  key: text,
  severity: 'red' | 'yellow' | 'blue',
  title: text,
  body: text,
  count: integer,
  cta_label: text,
  cta_href: text
}
```

The RPC only returns alerts where the threshold is crossed (empty array = all clear).

**SQL migration:** Creates the function in a new migration file.

## Step 2: New Hook -- `useAdminAlerts()`

**File:** `src/pages/admin/hooks/useAdminAlerts.ts`

- Calls `admin_operator_alerts` RPC
- Polls every 60 seconds (matches health snapshot interval)
- Returns `{ alerts, isLoading, error }`
- Alert type interface defined here
- Exported from hooks index

## Step 3: Upgrade OperatorCockpit "Needs Attention" Section

**File:** `src/pages/admin/sections/OperatorCockpit.tsx`

Replace the current hardcoded attention cards with dynamic rendering from `useAdminAlerts()`:

- **Red cards** (destructive styling): failed emails, high-priority tickets, unanswered jobs
- **Yellow cards** (warning styling): open tickets, stuck onboarding
- **Blue cards** (info styling): new signups, new pros (positive signals, not problems)
- Each card shows: icon, count, title, description, and a CTA button that navigates to the relevant page
- "All clear" state remains when alerts array is empty
- Remove the old separate health snapshot query from the cockpit (alerts RPC covers it)

**Card layout:**
- Severity-ordered: red first, then yellow, then blue
- Grid: responsive, 1-3 columns
- Each card is clickable (navigates to cta_href)

## Step 4: Hook Index Export

**File:** `src/pages/admin/hooks/index.ts`

Add `useAdminAlerts` export.

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/[timestamp]_admin_operator_alerts.sql` | New RPC function |
| `src/pages/admin/hooks/useAdminAlerts.ts` | New hook (new file) |
| `src/pages/admin/hooks/index.ts` | Add export |
| `src/pages/admin/sections/OperatorCockpit.tsx` | Replace hardcoded attention with dynamic alerts |

## What This Does NOT Include

- No `admin_alerts` table (no persistence yet -- that's Phase 6.1 for snooze/acknowledge)
- No cron job or edge function (alerts are computed on-read)
- No external notifications (WhatsApp/email alerts come later)
- No changes to Health tab (it stays as-is for detailed diagnostics)
- No changes to the drawer system or routing

## Acceptance Criteria

- Opening `/dashboard/admin` shows real-time alert cards based on actual data
- Red alerts appear first, then yellow, then blue
- Clicking any card navigates to the correct page/tab
- When all thresholds are clear, "All clear" message displays
- Alerts refresh every 60 seconds without manual reload
- RPC enforces admin role check server-side

