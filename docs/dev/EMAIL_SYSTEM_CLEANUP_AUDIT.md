# Email System Cleanup — Audit Record

**Date:** 2026-03-30  
**Status:** Complete (Phase 1A + 1B). Phase 1C deferred.

---

## Phase 1A — Dead Code Removal

### What Was Removed
- `supabase/functions/send-auth-email/` — entire edge function directory deleted
- `supabase/config.toml` — `[functions.send-auth-email]` block removed
- 8 documentation files cleaned of stale references

### Evidence for Removal
- Zero frontend invocations (`src/` does not call `send-auth-email`)
- Zero production edge function logs
- Auth flows use native Supabase Auth: `signUp()`, `resend()`, `resetPasswordForEmail()`
- No database hooks or triggers reference the function

### Auth Replacement Statement
Authentication emails are handled by native Supabase Auth flows (GoTrue), not custom edge functions. Password resets, signup confirmations, and magic links all use Supabase's built-in email delivery.

### Secrets Status
- `RESEND_API_KEY` — retained (still used by `send-job-notification` for admin alerts)
- No orphaned secrets

---

## Phase 1B — Notification Preference Expansion

### Schema Changes
Two columns added to `notification_preferences`:

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| `email_quotes` | `boolean` | `true` | `NOT NULL` |
| `email_project_updates` | `boolean` | `true` | `NOT NULL` |

Using `NOT NULL DEFAULT true` ensures existing rows automatically receive sane defaults with no manual backfill required.

### Event → Preference Matrix

| Event | Category | Preference Flag |
|-------|----------|----------------|
| `new_message` | Preference-controlled | `email_messages` |
| `job_match` | Preference-controlled | `email_job_matches` |
| `quote_received` | Preference-controlled | `email_quotes` |
| `welcome` | Preference-controlled | `email_project_updates` |
| `job_posted_confirm` | Preference-controlled | `email_project_updates` |
| `quote_accepted` | **Mandatory** | — |
| `quote_declined` | **Mandatory** | — |
| `job_completed` | **Mandatory** | — |
| All `dispute_*` events (9 types) | **Mandatory** | — |
| `admin_new_job` | **Admin-only** | — |
| `admin_new_user` | **Admin-only** | — |
| `pro_signup` | **Admin-only** | — |
| `support_ticket` | **Admin-only** | — |
| `forum_post` | **Admin-only** | — |
| `bug_report` | **Admin-only** | — |
| `platform_error` | **Admin-only** | — |
| `contact_form` | **Admin-only** | — |
| `new_service` | **Admin-only** | — |
| `listing_ready_for_review` | **Admin-only** | — |

### Queue Semantics
Preference-skipped notifications are marked as processed (`sent_at = now()`, `last_error = 'skipped_by_preferences'`) and are not retried. This prevents queue buildup while preserving an audit trail of suppressed sends.

### Files Changed
| File | Change |
|------|--------|
| `supabase/functions/send-notifications/index.ts` | Expanded preference check to cover 5 event types |
| `src/pages/settings/Settings.tsx` | Added "Quotes & hiring" and "Project updates" toggles |
| `public/locales/en/settings.json` | Added translation keys for new toggles |

---

## Phase 1C — Provider Consolidation (Deferred)

### Current Provider Split

| Provider | Used By | Transport |
|----------|---------|-----------|
| **Resend** (API) | `send-job-notification` | REST API |
| **Krystal SMTP** | `send-notifications` | SMTP via nodemailer |
| **Supabase Auth** (native) | Signup, reset, magic link | GoTrue |

### Decision
Deferred until Phase 1A and 1B are tested in production. Consolidation depends on deliverability assessment, cost analysis, and whether there is a business reason to maintain the SMTP path.

---

## Result

- ✅ Dead custom auth email path removed with full evidence
- ✅ Notification preferences expanded safely (no backfill needed)
- ✅ Event policy fully classified (optional / mandatory / admin-only)
- ✅ Documentation aligned with production behavior
- ✅ Build passes cleanly
- ⏳ Transport consolidation intentionally deferred

---

## Recommended Smoke Test

1. Toggle "Quotes & hiring" off → submit a quote → verify email is suppressed
2. Toggle "Project updates" off → post a job → verify confirmation email is suppressed
3. Accept a quote → verify mandatory email sends regardless of preferences
4. Check dispute email sends regardless of preferences
5. Toggle preferences back on → verify emails resume
