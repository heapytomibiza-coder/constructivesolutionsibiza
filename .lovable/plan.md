

# Fix: send-notifications Edge Function Still Returning 401

## Root Cause

The auth fix applied previously checks `bearerToken === anonKey` where `anonKey = Deno.env.get("SUPABASE_ANON_KEY")`. **But `SUPABASE_ANON_KEY` is not a standard auto-injected env var in Supabase Edge Functions.** Only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically.

So `anonKey` resolves to `""`, and the comparison `bearerToken === ""` always fails → 401 on every cron invocation.

This means **no emails from the `email_notifications_queue` have been sent since this function was deployed** — there's a backlog of ~20+ unsent welcome emails, job confirmations, and message notifications.

## Evidence

- Every cron call returns HTTP 401 (confirmed via edge logs)
- All items in `email_notifications_queue` have `sent_at: null`
- Direct curl test with the correct anon key also returns 401

## Fix

**File: `supabase/functions/send-notifications/index.ts`** (lines ~838-841)

Replace the env var lookup with the hardcoded anon key value (which is a publishable key, not a secret —