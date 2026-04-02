

# Redesign Job Ticket as a Guided Workflow

## Problem
The Job Ticket page is a flat stack of cards. It does not visually communicate where the job is, what has happened, or what to do next. Both roles need a process-oriented layout, not a dashboard layout.

## Solution

Restructure the page into three layers: a **progress rail**, a **stage hero**, and **stage-specific content** — plus a new **progress updates** system with photo support.

---

## Architecture

```text
Desktop (lg+)                    Mobile
┌────────────┬──────────────┐    ┌──────────────────┐
│ Progress   │  Stage Hero  │    │  Progress Rail    │
│ Rail       │              │    │  (horizontal)     │
│ (sticky)   │  Stage       │    ├──────────────────┤
│            │  Content     │    │  Stage Hero       │
│ ✓ Posted   │              │    │  Stage Content    │
│ ✓ Quoted   │  Progress    │    │  ...              │
│ ✓ Accepted │  Updates     │    └──────────────────┘
│ → Working  │              │
│ ○ Complete │  Quote       │
│ ○ Review   │  Summary     │
│            │              │
│            │  Conversation│
└────────────┴──────────────┘
```

---

## Changes

### 1. New DB table: `job_progress_updates`

```sql
create table public.job_progress_updates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  author_id uuid not null,
  note text,
  photo_url text,
  created_at timestamptz not null default now()
);
alter table public.job_progress_updates enable row level security;
-- RLS: author can insert, job owner + assigned pro can read
```

### 2. New storage bucket: `progress-photos`

Create via migration. Public read, authenticated upload. Path: `{user_id}/{timestamp}.webp`.

### 3. New component: `JobProgressRail.tsx`

Vertical progress indicator replacing `StatusTimeline`. Steps:

- Job Posted (ready/open)
- Quote Sent (quote exists)
- Quote Accepted (in_progress or completed)
- Work in Progress (in_progress)
- Completed (completed)
- Review (review exists)

Each step shows: done / current / upcoming state with icon + optional timestamp from `job_status_history`. The "current" step is visually dominant (larger, coloured, with description text).

On mobile: renders as a compact horizontal strip at the top (similar to current `StatusTimeline` but richer).

On desktop (lg+): renders as a sticky left column.

### 4. New component: `StageHero.tsx`

A prominent banner at the top of the right column:
- Stage name in large text
- One-sentence plain-English explanation of what this stage means
- One clear "next action" button (context-dependent)

Examples:
- `in_progress` + client: "Work is underway. Mark complete once the job is finished." → [Mark Complete]
- `in_progress` + pro: "You're working on this job. Post progress updates to keep the client informed." → [Add Update]
- `completed` + no review: "The job is done. Leave a review." → [Leave Review]
- `open` + client: "Your job is live. Waiting for quotes." → (no action)

### 5. New component: `ProgressUpdates.tsx`

- Fetches from `job_progress_updates` ordered by `created_at desc`
- Each update shows: photo (if any), note, timestamp, author label
- For professionals on `in_progress` jobs: shows an "Add Update" form with photo upload + short text input
- Photo upload uses `progress-photos` bucket via the existing image pipeline pattern
- Clients see updates read-only

### 6. Rewrite `JobTicketDetail.tsx` layout

Replace the current single-column card stack with:

**Desktop (lg+):** 2-column grid
- Left (w-64, sticky): `JobProgressRail`
- Right (flex-1): `StageHero` → stage-specific content in priority order

**Mobile:** single column
- `JobProgressRail` (horizontal mode)
- `StageHero`
- Stage content

**Content priority order (right column):**
1. `StageHero` (always)
2. `ProgressUpdates` (in_progress / completed)
3. `JobTicketCompletion` (client + in_progress)
4. `JobTicketReview` (completed)
5. `ProQuoteSummary` or `JobTicketQuotes` (role-dependent)
6. Job summary (collapsed by default once past open stage)
7. `JobTicketConversations`
8. Distribution actions (client + ready/open only)

### 7. Security: conversations visibility fix

The tasker should only see their own conversation, not all conversations for the job. Update `JobTicketConversations` query to filter:
- Client: show all conversations for the job
- Professional: filter `conversations` where `pro_id = user.id`

### 8. Remove `StatusTimeline` usage from this page

Replaced by `JobProgressRail`. The old component can remain for use elsewhere.

---

## Files affected

| File | Action |
|------|--------|
| Migration SQL | Create `job_progress_updates` table + RLS + storage bucket |
| `src/pages/dashboard/client/components/JobProgressRail.tsx` | New |
| `src/pages/dashboard/client/components/StageHero.tsx` | New |
| `src/pages/dashboard/client/components/ProgressUpdates.tsx` | New |
| `src/pages/dashboard/client/JobTicketDetail.tsx` | Major rewrite — 2-column layout |
| `src/pages/dashboard/client/components/JobTicketConversations.tsx` | Filter by role |

---

## What this does NOT include

- Payment/holding system integration (separate feature)
- Image optimization pipeline for progress photos (can use direct upload first, optimize later)
- Notification triggers for progress updates (follow-up)

