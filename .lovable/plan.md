

# Phase 1: Email System Cleanup — Truth Check, Preferences, Consolidation

## Summary

Three-phase workstream: remove dead code, expand notification preferences, then prepare for provider consolidation.

---

## Phase 1A — Remove `send-auth-email` (Dead Code)

### Evidence

- **Zero frontend invocations**: No file in `src/` calls `send-auth-email`
- **Zero production logs**: Edge function logs return empty
- **Auth flows use native Supabase Auth**: `Auth.tsx` calls `supabase.auth.signUp()`, `supabase.auth.resend()`, `ForgotPassword.tsx` calls `supabase.auth.resetPasswordForEmail()` — all native, no edge function
- **No DB hooks or triggers reference it**

### Action

| What | Detail |
|------|--------|
| Delete `supabase/functions/send-auth-email/index.ts` | Remove the entire edge function directory |
| Remove from `supabase/config.toml` | Delete the `[functions.send-auth-email]` block |
| Remove `RESEND_API_KEY` dependency note | Document that Resend is still used by `send-job-notification` — do not remove the secret yet |

---

## Phase 1B — Expand Notification Preferences

### Current State

The `notification_preferences` table has 4 columns: `email_messages`, `email_job_matches`, `email_digests`, `digest_frequency`. Only `email_messages` and `email_job_matches` are checked in `send-notifications`.

The following event types send emails **without** any preference check:
- `welcome`
- `job_posted_confirm`
- `quote_received`
- `quote_accepted` / `quote_declined`
- `job_completed`
- `job_match` (already preference-aware)
- `new_message` (already preference-aware)

### Classification

| Category | Events | Mandatory? |
|----------|--------|-----------|
| **Mandatory** (no opt-out) | `quote_accepted`, `quote_declined`, `job_completed`, dispute emails | Yes — action/outcome emails |
| **Optional — Quotes & Hiring** | `quote_received` | No — add `email_quotes` preference |
| **Optional — Project Updates** | `job_posted_confirm`, `welcome` | No — add `email_project_updates` preference |
| **Already controlled** | `new_message` → `email_messages`, `job_match` → `email_job_matches` | Already done |

### Database Changes

Add two columns to `notification_preferences`:

```sql
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS email_quotes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_project_updates boolean NOT NULL DEFAULT true;
```

### Code Changes

| File | Change |
|------|--------|
| `supabase/functions/send-notifications/index.ts` | Expand the preference check block (~line 851) to include `quote_received` → `email_quotes` and `welcome`, `job_posted_confirm` → `email_project_updates` |
| `src/pages/settings/Settings.tsx` | Add two new toggle rows for "Quotes & hiring activity" and "Project updates". Update the `NotificationPrefs` interface. |
| `public/locales/en/settings.json` | Add translation keys for the new toggles |

### Preference Check Logic (in `send-notifications`)

```
expanded preference map:
  new_message       → email_messages       (existing)
  job_match         → email_job_matches    (existing)
  quote_received    → email_quotes         (new)
  welcome           → email_project_updates (new)
  job_posted_confirm→ email_project_updates (new)
  quote_accepted    → mandatory (no check)
  quote_declined    → mandatory (no check)
  job_completed     → mandatory (no check)
```

---

## Phase 1C — Provider Consolidation (Documented, Not Implemented Yet)

### Current Split

| Provider | Used By | Transport |
|----------|---------|-----------|
| **Resend** (API) | `send-job-notification` (admin alerts) | REST API |
| **Krystal SMTP** | `send-notifications` (all user + admin queue emails) | SMTP via nodemailer |
| **Supabase Auth** | Signup confirm, password reset, resend | Native (GoTrue) |

### Recommendation (for later)

Consolidate to one provider for all **app-generated** emails (not auth — those stay native). The choice depends on:
- Whether Krystal SMTP has deliverability issues
- Whether Resend costs are acceptable at scale
- Whether you want API-driven sending everywhere

This phase is deferred until Phase 1A and 1B are complete and tested.

---

## Implementation Order

1. Delete `send-auth-email` edge function + config entry
2. Add `email_quotes` and `email_project_updates` columns (migration)
3. Update `send-notifications` preference check logic
4. Update Settings UI with new toggles
5. Add translation keys
6. Deploy updated `send-notifications` edge function

---

## Files Changed

| File | Action |
|------|--------|
| `supabase/functions/send-auth-email/index.ts` | Delete |
| `supabase/config.toml` | Remove `[functions.send-auth-email]` block |
| `supabase/functions/send-notifications/index.ts` | Expand preference check |
| `src/pages/settings/Settings.tsx` | Add 2 new preference toggles |
| `public/locales/en/settings.json` | Add translation keys |
| New migration SQL | Add 2 columns to `notification_preferences` |

