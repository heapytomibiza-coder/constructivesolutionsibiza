# Queue Architecture

**Last updated:** 2026-03-07
**Owner:** Engineering Lead

## Purpose

Document the DB-backed queue pattern used for asynchronous notification processing.

## Scope

Covers both notification queues, their producers (DB triggers), consumers (edge functions), retry logic, and failure handling.

## Current State

Two operational queues processing email, WhatsApp, and Telegram notifications.

## Core Components

### 1. Queue Tables

| Table | Consumer | Purpose |
|-------|----------|---------|
| `email_notifications_queue` | `send-notifications` | General notifications: new messages, forum activity, bug reports |
| `job_notifications_queue` | `send-job-notification` | Job-specific: new job posted alerts |

### 2. Queue Schema

```
email_notifications_queue:
  id              UUID (PK)
  event_type      TEXT        — 'new_message' | 'forum_post' | 'bug_report' | ...
  recipient_user_id UUID     — who to notify
  payload         JSONB      — event-specific data
  attempts        INTEGER    — retry counter (default 0)
  sent_at         TIMESTAMPTZ — null until successfully sent
  last_error      TEXT       — error message from last failed attempt
  created_at      TIMESTAMPTZ

job_notifications_queue:
  id              UUID (PK)
  job_id          UUID (FK → jobs)
  event           TEXT       — 'new_job' | ...
  attempts        INTEGER    — retry counter (default 0)
  sent_at         TIMESTAMPTZ — null until sent
  last_error      TEXT       — last failure message
  created_at      TIMESTAMPTZ
```

### 3. Producers (Enqueue)

Notifications are enqueued by **database triggers** on INSERT/UPDATE:

| Trigger | Source Table | Queue Target | Event |
|---------|-------------|--------------|-------|
| `on_message_insert` | `messages` | `email_notifications_queue` | `new_message` |
| `on_job_insert` | `jobs` | `job_notifications_queue` | `new_job` |
| (forum triggers) | `forum_posts` | `email_notifications_queue` | `forum_post` |

### 4. Consumers (Process)

#### `send-notifications` (Edge Function)

- **Location:** `supabase/functions/send-notifications/index.ts`
- **Transport:** Gmail SMTP via `denomailer`
- **Batch size:** 20 items per invocation
- **Selection:** `WHERE sent_at IS NULL AND attempts < 3 ORDER BY created_at ASC LIMIT 20`
- **Throttle:** 600ms delay between sends (Gmail rate limit protection)
- **Preference check:** Reads `notification_preferences` table before sending — respects `email_messages`, `email_job_matches`, `email_digests` flags
- **Multi-channel fan-out:**
  - Email → recipient user (via Gmail SMTP)
  - WhatsApp → admin only (via CallMeBot API)
  - Telegram → admin only (via Bot API)
- **On success:** `UPDATE SET sent_at = now()`
- **On failure:** `UPDATE SET attempts = attempts + 1, last_error = error_message`
- **Secrets required:** `GMAIL_APP_PASSWORD`, `ADMIN_WHATSAPP_NUMBER`, `WHATSAPP_CALLMEBOT_APIKEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

#### `send-job-notification` (Edge Function)

- **Location:** `supabase/functions/send-job-notification/index.ts`
- **Transport:** Resend API (with domain fallback)
- **Processing:** Single job at a time (triggered per job)
- **Multi-channel:**
  - Email → admin notification via Resend
  - Telegram → admin alert with job details and links
- **Site URL:** Uses `PUBLIC_SITE_ORIGIN` secret for link generation
- **Secrets required:** `RESEND_API_KEY`, `PUBLIC_SITE_ORIGIN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

## Diagram: Queue Processing Cycle

```
DB Trigger (INSERT on messages/jobs)
        │
        ▼
Queue table INSERT
(event_type, payload, attempts=0, sent_at=NULL)
        │
        ▼
Edge Function invoked (scheduled or webhook)
        │
        ▼
SELECT unsent items (sent_at IS NULL, attempts < 3)
        │
        ▼
For each item:
  ├── Check notification_preferences
  │   └── Opted out? → Mark sent (skip silently)
  │
  ├── Build email HTML from event_type + payload
  │
  ├── Send via SMTP/Resend
  │   ├── Success → UPDATE sent_at = now()
  │   └── Failure → UPDATE attempts++, last_error = msg
  │
  └── Wait 600ms (throttle)
        │
        ▼
Items with attempts >= 3 remain as dead letters
(last_error preserved for debugging)
```

## Design Decisions

- **DB-backed over external queue service:** Simpler infrastructure. Supabase is already the data layer. No additional service to manage (SQS, Redis, etc.). See `docs/architecture/adr/003-db-backed-queue-pattern.md`.
- **3-attempt max:** Prevents infinite retry loops on permanent failures (invalid email, etc.).
- **600ms throttle:** Gmail allows ~500 emails/day. At 600ms/send, a single invocation processes ~33 items/batch in ~20s. Keeps within rate limits.
- **Preference-aware:** Checking preferences at send-time (not enqueue-time) means preference changes take effect immediately.
- **Dual transport (SMTP + Resend):** `send-notifications` uses Gmail SMTP for reliability. `send-job-notification` uses Resend for better deliverability on job alerts. This split is intentional — consolidation planned when domain is verified.

## Failure Modes / Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gmail rate limit (500/day) | Notifications delayed | 600ms throttle + batch size 20 |
| Resend free tier limit | Only sends to owner email | Domain verification needed |
| Edge function timeout | Partial batch processed | Unprocessed items remain in queue for next run |
| Dead letters accumulate | Silent notification failure | Monitor `attempts >= 3` count in admin dashboard |
| SMTP credential rotation | All email stops | `GMAIL_APP_PASSWORD` secret must be updated |

## Future Considerations

- **Consolidated transport:** Move all email to a single verified domain sender
- **Dead letter alerting:** Notify admin when dead letters exceed threshold
- **Priority queues:** Urgent notifications (e.g., support escalations) processed before batch digests
- **Webhook-triggered processing:** Instead of polling, use Supabase webhooks to invoke edge functions on INSERT
- **Digest batching:** Group multiple notifications into a single digest email per user

## Related Files

- `supabase/functions/send-notifications/index.ts` — Gmail SMTP queue worker
- `supabase/functions/send-job-notification/index.ts` — Resend + Telegram job alerts
- `docs/architecture/system-overview.md` — Edge function inventory
- `docs/architecture/scaling-roadmap.md` — Queue throughput scaling analysis
