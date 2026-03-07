# Data Flows

**Last updated:** 2026-03-07
**Owner:** Engineering Lead

## Purpose

Document the key data flows through the platform as sequence diagrams. Each flow shows which tables, views, hooks, and edge functions are involved.

## Scope

Covers the four primary flows: job posting, matching, messaging, and quoting.

## 1. Job Posting Flow

```
Asker (Browser)          CanonicalJobWizard           Supabase DB              Edge Functions
     │                         │                          │                         │
     │  Select category        │                          │                         │
     │────────────────────────>│                          │                         │
     │                         │  useQuery('categories')  │                         │
     │                         │─────────────────────────>│ service_categories      │
     │                         │<─────────────────────────│                         │
     │                         │                          │                         │
     │  Select subcategory     │                          │                         │
     │────────────────────────>│                          │                         │
     │                         │  useQuery('subcats')     │                         │
     │                         │─────────────────────────>│ service_subcategories   │
     │                         │<─────────────────────────│                         │
     │                         │                          │                         │
     │  Select micro(s)        │                          │                         │
     │────────────────────────>│                          │                         │
     │                         │  useQuery('micros')      │                         │
     │                         │─────────────────────────>│ service_micro_categories│
     │                         │<─────────────────────────│                         │
     │                         │                          │                         │
     │  Answer questions       │                          │                         │
     │────────────────────────>│  useQuery('pack')        │                         │
     │                         │─────────────────────────>│ question_packs          │
     │                         │<─────────────────────────│ (by micro_slug)         │
     │                         │                          │                         │
     │  Submit job             │                          │                         │
     │────────────────────────>│  buildJobInsert()        │                         │
     │                         │  (lib/buildJobPayload)   │                         │
     │                         │─────────────────────────>│ INSERT jobs             │
     │                         │                          │─────────────────────────>│
     │                         │                          │  DB trigger:            │
     │                         │                          │  on_job_insert          │
     │                         │                          │  → enqueue notification │
     │                         │                          │  → job_notifications_   │
     │                         │                          │    queue INSERT         │
     │                         │                          │                         │
     │                         │                          │         send-job-notification
     │                         │                          │         (processes queue)│
     │                         │                          │         → Resend email  │
     │                         │                          │         → Telegram alert│
```

### Key files

- `src/features/wizard/canonical/CanonicalJobWizard.tsx` — main wizard component
- `src/features/wizard/canonical/lib/buildJobPayload.ts` — `buildJobInsert()`, `buildIdempotencyKey()`
- `src/features/wizard/canonical/types.ts` — `WizardStep` enum, `WizardAnswers` schema
- `src/features/wizard/canonical/hooks/useWizardDraft.ts` — draft persistence
- `supabase/functions/send-job-notification/index.ts` — processes `job_notifications_queue`

### Tables involved

| Table | Role |
|-------|------|
| `service_categories` | Step 1: category selection |
| `service_subcategories` | Step 2: subcategory selection |
| `service_micro_categories` | Step 3: micro task selection |
| `question_packs` | Step 4: dynamic question forms |
| `jobs` | Final INSERT on submission |
| `job_notifications_queue` | Enqueued by DB trigger |

## 2. Matching Flow

```
jobs table                   service_search_index       matched_jobs_for_professional
     │                              │                              │
     │  job.micro_slug              │                              │
     │─────────────────────────────>│  micro_slug → micro_id       │
     │                              │─────────────────────────────>│
     │                              │                              │
     │                              │  JOIN professional_services  │
     │                              │  WHERE micro_id = job micro  │
     │                              │  AND status = 'active'       │
     │                              │─────────────────────────────>│
     │                              │                              │
     │                              │                              │  Returns:
     │                              │                              │  job + professional_user_id
```

### Key views

- `service_search_index` — flattened: `micro_id`, `micro_slug`, `subcategory_name`, `category_name`, `search_text`
- `matched_jobs_for_professional` — joins `jobs` ↔ `professional_services` via taxonomy
- `professional_matching_scores` — adds ranking: `match_score`, `avg_rating`, `completed_jobs_count`

## 3. Messaging Flow

```
Client/Pro (Browser)      get_or_create_conversation    Supabase Realtime       send-notifications
     │                           (RPC)                       │                       │
     │  Click "Message"          │                           │                       │
     │──────────────────────────>│                           │                       │
     │                           │  UPSERT conversations    │                       │
     │                           │  INSERT conversation_    │                       │
     │                           │    participants          │                       │
     │                           │<──────────────────────   │                       │
     │                           │                           │                       │
     │  Send message             │                           │                       │
     │──────────────────────────>│  INSERT messages          │                       │
     │                           │──────────────────────────>│  postgres_changes     │
     │                           │                           │  event broadcast      │
     │                           │                           │──────────> Other user │
     │                           │                           │                       │
     │                           │  DB trigger:              │                       │
     │                           │  on_message_insert        │                       │
     │                           │  → UPDATE conversations   │                       │
     │                           │    (last_message_at/      │                       │
     │                           │     last_message_preview) │                       │
     │                           │  → enqueue email_         │                       │
     │                           │    notifications_queue    │──────────────────────>│
     │                           │                           │     Process queue     │
     │                           │                           │     → Check prefs     │
     │                           │                           │     → Send email      │
     │                           │                           │     → WhatsApp/TG     │
```

### Key files

- `src/pages/messages/` — messaging UI
- `supabase/functions/send-notifications/index.ts` — queue worker (Gmail SMTP, 600ms throttle, max 3 attempts)

### Tables involved

| Table | Role |
|-------|------|
| `conversations` | Thread metadata, `last_message_at`, read timestamps |
| `conversation_participants` | Who's in the thread (supports admin join for support) |
| `messages` | Individual messages with `message_type` and `metadata` |
| `email_notifications_queue` | Enqueued notifications for async processing |
| `notification_preferences` | Per-user notification opt-in/out |

## 4. Quote Flow

```
Professional              Supabase DB                    Client
     │                         │                           │
     │  Submit quote           │                           │
     │────────────────────────>│  INSERT quotes             │
     │                         │  (revision_number = 1)    │
     │                         │  status = 'submitted'     │
     │                         │                           │
     │                         │  INSERT quote_line_items  │
     │                         │  (per line item)          │
     │                         │                           │
     │                         │──────────────────────────>│  View quote
     │                         │                           │
     │                         │<──────────────────────────│  Accept/Decline
     │                         │  UPDATE quotes            │
     │                         │  status = 'accepted'      │
     │                         │                           │
     │  Revise quote           │                           │
     │────────────────────────>│  INSERT quotes             │
     │                         │  (revision_number++)      │
     │                         │  Previous = 'superseded'  │
```

### Tables involved

| Table | Role |
|-------|------|
| `quotes` | Quote metadata: pricing, scope, validity, status |
| `quote_line_items` | Itemized breakdown with `unit_price × quantity` |

### Quote statuses

`submitted` → `accepted` / `declined` / `superseded` / `expired`

## Failure Modes / Risks

- **Draft loss:** Wizard uses `useWizardDraft` hook with sessionStorage. Browser crash = lost draft. Future: persist to DB.
- **Queue stall:** If edge function fails 3 times, notification stays unsent with `last_error` recorded. No automatic retry beyond 3 attempts.
- **Realtime disconnect:** If WebSocket drops, messages still persist via INSERT but live updates stop until reconnection.

## Related Files

- `docs/ARCHITECTURE_PACK.md` — Sections 4 (Job State Machine) and 5 (Data Spine)
- `docs/architecture/queue-architecture.md` — Queue processing details
- `docs/architecture/ai-wizard.md` — Question pack resolution
