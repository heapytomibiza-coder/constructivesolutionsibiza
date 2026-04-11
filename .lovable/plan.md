

# QA Reminder Visibility in Platform Assistant

## Summary
Add a lightweight "QA Reminder" card to the Platform Assistant showing the latest reminder run status, recent history, and a manual "Send Now" button backed by a secure server-side RPC.

## Phase 1 — Database changes

### 1a. Add columns to `qa_reminder_runs`
Migration to add `trigger_source` and `triggered_by` columns:
```sql
ALTER TABLE qa_reminder_runs
  ADD COLUMN trigger_source text NOT NULL DEFAULT 'cron',
  ADD COLUMN triggered_by uuid REFERENCES auth.users(id);
```

### 1b. Add RLS policy for admin read access
```sql
ALTER TABLE qa_reminder_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read qa_reminder_runs"
  ON qa_reminder_runs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());
```

### 1c. Create `trigger_qa_reminder()` RPC
A `SECURITY DEFINER` function that:
- Checks admin role + allowlist
- Calls `net.http_post` to the edge function URL with vault-backed `INTERNAL_FUNCTION_SECRET`
- Returns a status message (sent / already-sent-this-week / failed)

```sql
CREATE OR REPLACE FUNCTION trigger_qa_reminder()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _secret text;
  _url text;
  _request_id bigint;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') AND is_admin_email()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT decrypted_secret INTO _secret
  FROM vault.decrypted_secrets WHERE name = 'INTERNAL_FUNCTION_SECRET' LIMIT 1;

  _url := current_setting('app.settings.supabase_url', true)
    || '/functions/v1/weekly-qa-reminder';

  SELECT net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', _secret
    ),
    body := jsonb_build_object('source', 'admin_manual', 'triggered_by', auth.uid()::text)
  ) INTO _request_id;

  RETURN jsonb_build_object('status', 'triggered', 'request_id', _request_id);
END;
$$;
```

### 1d. Update edge function to record `trigger_source` and `triggered_by`
Parse the request body for `source` and `triggered_by` fields, write them to `qa_reminder_runs` on insert.

## Phase 2 — Frontend

### 2a. New hook: `src/pages/admin/hooks/useQaReminderStatus.ts`
- Query `qa_reminder_runs` ordered by `created_at DESC LIMIT 5`
- Return `{ latestRun, history, isLoading, isError }`
- Mutation wrapper for `supabase.rpc('trigger_qa_reminder')`
- On success: invalidate query, show toast
- On error: show error toast

### 2b. QA Reminder card in `PlatformAssistant.tsx`
Placed after the Alerts card, before Trends. Shows:

```text
┌─────────────────────────────────────────┐
│ 📋 QA Reminder                          │
│                                         │
│ Last run: 11 Apr 2026, 08:00            │
│ Week: 2026-W15                          │
│ Status: ● Sent                          │
│ Next scheduled: Monday 08:00 Madrid     │
│                                         │
│ [Send Now]                              │
│                                         │
│ ▸ Recent history (expandable)           │
│   2026-W15 — sent — cron                │
│   2026-W14 — sent — admin_manual        │
│   2026-W13 — failed — cron — error...   │
└─────────────────────────────────────────┘
```

States handled:
- **Loading**: Skeleton
- **Empty** (no rows): "No QA reminders sent yet"
- **Error**: Error message + retry
- **Sent this week**: Green status badge, Send Now shows "Already sent for 2026-W15"
- **Failed**: Red badge, error snippet visible, button says "Retry Send"
- **Pending mutation**: Button disabled with spinner

### 2c. Export hook from `src/pages/admin/hooks/index.ts`

## Files changed

| File | Change |
|---|---|
| Migration (new) | Add columns, RLS, RPC |
| `supabase/functions/weekly-qa-reminder/index.ts` | Parse body for `source`/`triggered_by`, write to DB |
| `src/pages/admin/hooks/useQaReminderStatus.ts` | New hook |
| `src/pages/admin/hooks/index.ts` | Export new hook |
| `src/pages/admin/sections/PlatformAssistant.tsx` | Add QA Reminder card |

## Out of scope
- Changes to `get_platform_assistant_summary` RPC
- Structured QA checklist result tracking
- Telegram message parsing

