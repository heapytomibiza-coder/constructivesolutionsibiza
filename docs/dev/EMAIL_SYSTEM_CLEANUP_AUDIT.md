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

## Phase 1C — Provider Consolidation (Partial)

### Current Provider Split

| Provider | Used By | Transport |
|----------|---------|-----------|
| **Resend** (API) | `send-job-notification`, `send-notifications` (primary) | REST API |
| **Krystal SMTP** | `send-notifications` (fallback) | SMTP via nodemailer |
| **Supabase Auth** (native) | Signup, reset, magic link | GoTrue |

### What Was Done (2026-04-14)

1. **Resend added as primary transport** in `send-notifications` with SMTP fallback
2. **Uniform `SendResult` response shape** — every send returns `{ ok, provider, messageId?, error? }`
3. **Provider logged per send** — `last_error` column records `provider:resend` or `provider:smtp` on success, `[none] error` on failure
4. **Duplicate-send risk eliminated** — SMTP fallback only runs on true Resend API error (`resendError` set), not on ambiguous responses
5. **Deployed and live**

### Remaining

- `RESEND_FROM` must point to a verified Resend domain for operational delivery
- Full rollout test matrix (Resend-only, SMTP-only, both-broken, per-event-type) not yet run in production

---

## Result

- ✅ Dead custom auth email path removed with full evidence
- ✅ Notification preferences expanded safely (no backfill needed)
- ✅ Event policy fully classified (optional / mandatory / admin-only)
- ✅ Documentation aligned with production behavior
- ✅ Build passes cleanly
- ✅ Resend primary + SMTP fallback with uniform response and provider logging
- ✅ Conversion nudge pipeline activated (Phase 2)

---

## Phase 2 — Conversion Nudge Activation

**Date:** 2026-03-30

### What Was Done

1. **`process-nudges` deployed**: Added to `config.toml`, function updated with 50-item batch safety cap and Bearer token auth for pg_cron compatibility.

2. **Hourly pg_cron schedule created**: `process-nudges-hourly` runs at the top of every hour via `pg_net.http_post`.

3. **`get_pending_nudges()` expanded**: Added two new nudge types:
   - `pro_no_quote` — Pro has conversation on open job but no quote after 12h (max 2 nudges, 24h cooldown)
   - `review_reminder` — Job completed > 24h ago, targets each side independently (max 2 nudges, 48h cooldown)

4. **`send-notifications` wired for nudges**: 
   - All `nudge_*` events now render using payload-driven subject/body wrapped in email shell
   - All nudge events respect `email_project_updates` preference
   - Skipped nudges marked processed with `skipped_by_preferences` (consistent with existing pattern)

5. **Event taxonomy aligned**: Added `NUDGE_DRAFT_STALE`, `NUDGE_QUOTES_PENDING`, `NUDGE_CONVERSATION_STALE`, `NUDGE_PRO_NO_QUOTE`, `NUDGE_REVIEW_REMINDER` to `eventTaxonomy.ts`.

### Nudge Matrix

| Type | Target | Trigger | Cooldown | Max | Preference |
|------|--------|---------|----------|-----|------------|
| `draft_stale` | Client | Draft job > 2h | 24h | 3 | `email_project_updates` |
| `quotes_pending` | Client | Unreviewed quotes > 24h | 24h | 3 | `email_project_updates` |
| `conversation_stale` | Client | Idle conversation > 48h | 24h | 3 | `email_project_updates` |
| `pro_no_quote` | Pro | Conversation exists, no quote > 12h | 24h | 2 | `email_project_updates` |
| `review_reminder` | Client & Pro (independently) | Job completed > 24h, no review | 48h | 2 | `email_project_updates` |

### Design Decisions

- **`pro_no_quote` targets conversation participants only**, not all category-matched pros. This prevents spam from overly broad matching.
- **`review_reminder` fires per-side**: only the party that hasn't reviewed gets nudged. Suppressed once that party leaves a review.
- **Batch limit of 50** per hourly run prevents flood after downtime or backlog.
- **Preference-skipped nudges** are marked processed and not retried (consistent queue semantics).

### Files Changed

| File | Change |
|------|--------|
| `supabase/config.toml` | Added `[functions.process-nudges]` |
| `supabase/functions/process-nudges/index.ts` | Expanded templates, added batch limit + Bearer auth |
| `supabase/functions/send-notifications/index.ts` | Added `NUDGE_EVENTS`, `buildNudgeEmail()`, preference handling |
| `src/lib/eventTaxonomy.ts` | Added 5 nudge event constants |
| SQL migration | Expanded `get_pending_nudges()` with `pro_no_quote` + `review_reminder` |
| SQL (insert) | Created `process-nudges-hourly` pg_cron job |

---

## Recommended Smoke Test

### Phase 1
1. Toggle "Quotes & hiring" off → submit a quote → verify email is suppressed
2. Toggle "Project updates" off → post a job → verify confirmation email is suppressed
3. Accept a quote → verify mandatory email sends regardless of preferences
4. Check dispute email sends regardless of preferences
5. Toggle preferences back on → verify emails resume

### Phase 2
6. Create a draft job → wait 2h (or manually invoke `process-nudges`) → verify `nudge_draft_stale` appears in email queue
7. Submit a quote on an open job → wait 24h → verify `nudge_quotes_pending` enqueued
8. Start a conversation as a pro without quoting → wait 12h → verify `nudge_pro_no_quote` enqueued
9. Complete a job → wait 24h → verify `nudge_review_reminder` enqueued for both client and pro (separately)
10. Toggle "Project updates" off → verify nudges are skipped with `skipped_by_preferences`
