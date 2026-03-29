

# Phase 7 — Conversion & Retention Layer

## Existing Infrastructure

- **Admin nudge system**: `admin_nudge_client` RPC already exists for manual nudging from MessagingPulsePage
- **Email queue**: `email_notifications_queue` with retry/dead-letter pattern, processed by `send-notifications` edge function
- **Dispute deadline nudges**: `dispute-deadline-automation` edge function already uses the enqueue + dedup pattern via `dispute_ai_events`
- **Jobs table**: has `assigned_professional_id`, all needed fields for cloning (category, subcategory, micro_slug, area, budget, location, answers, description)
- **No existing**: saved pros, rebook flow, or automated conversion nudges

---

## Implementation Plan

### Ticket 1: Saved Pros / Favourites
**Effort:** 2 hours

**Migration:**
- Create `saved_pros` table: `user_id UUID`, `professional_id UUID`, `created_at TIMESTAMPTZ DEFAULT now()`, `PRIMARY KEY (user_id, professional_id)`
- RLS: users can INSERT/SELECT/DELETE where `user_id = auth.uid()`
- Create `toggle_saved_pro(p_professional_id UUID)` RPC (SECURITY DEFINER): if row exists, delete; else insert. Returns `{saved: boolean}`
- Create `get_saved_pros()` RPC: returns saved pros joined with `professional_profiles` for display name, avatar, verification status

**Frontend:**
- New `src/hooks/useSavedPros.ts` — toggle mutation + list query
- Heart button on `ServiceListingCard` and `ProfessionalDetails.tsx`
- New "Saved Pros" section in `ClientDashboard.tsx` — grid of saved pro cards with link to profile

---

### Ticket 2: Re-booking Flow (Hire Again)
**Effort:** 3 hours

**Migration:**
- Add `rebook_source_job_id UUID` column to `jobs` table (nullable, references self)
- Create `create_rebook_job(p_source_job_id UUID)` RPC (SECURITY DEFINER):
  - Verifies `auth.uid() = jobs.user_id` on source job
  - Verifies source job status is `completed` or `in_progress`
  - Copies: title, category, subcategory, micro_slug, area, location, budget_type, budget_value, budget_min, budget_max, start_timing, description, answers
  - Sets: `status = 'draft'`, `user_id = auth.uid()`, `rebook_source_job_id = p_source_job_id`, `assigned_professional_id = source.assigned_professional_id`
  - Returns `{new_job_id}`
- No separate `rebook_events` table — the `rebook_source_job_id` column on jobs is sufficient for tracking

**Frontend:**
- New `src/hooks/useRebook.ts` — mutation calling the RPC, redirects to `/post?edit={new_job_id}`
- "Hire Again" button on:
  - `ClientJobCard.tsx` (for completed jobs)
  - `JobTicketDetail.tsx` (for completed/in_progress jobs)
  - `ProfessionalDetails.tsx` (if user has a completed job with this pro — checked via a lightweight query)

---

### Ticket 3: Incomplete Hire Nudges (Automated + Admin Override)
**Effort:** 4 hours

**Migration:**
- Create `nudge_log` table:
  - `id UUID PK`, `user_id UUID NOT NULL`, `job_id UUID`, `nudge_type TEXT NOT NULL`, `triggered_at TIMESTAMPTZ DEFAULT now()`, `sent_at TIMESTAMPTZ`, `suppressed_by UUID` (admin override), `suppressed_at TIMESTAMPTZ`
  - Unique constraint: `(user_id, job_id, nudge_type, DATE(triggered_at))` — enforces max 1 per type per day
- RLS: no direct user access (service role only); admin SELECT
- Create `get_pending_nudges()` RPC (SECURITY DEFINER, service role pattern):
  - Finds nudge candidates:
    - `draft_stale`: jobs in draft, created > 2h ago, no nudge sent in 24h
    - `quotes_pending`: jobs with quotes but status still open, oldest quote > 24h, no nudge in 24h
    - `conversation_stale`: conversations with messages but no quote/hire after 48h, no nudge in 24h
  - Anti-spam: max 3 nudges per job total, skip if job completed/cancelled
  - Returns candidate rows
- Create `mark_nudge_sent(p_nudge_id UUID)` and `suppress_nudge(p_job_id UUID, p_nudge_type TEXT)` RPCs

**Edge Function: `process-nudges`**
- Internal-only (x-internal-secret header)
- Calls `get_pending_nudges()`, inserts into `nudge_log`, enqueues into `email_notifications_queue`
- Message templates:
  - `draft_stale`: "Finish posting your job — pros are waiting"
  - `quotes_pending`: "You've received X quotes — review them now"
  - `conversation_stale`: "You spoke to {pro_name} — ready to hire?"
- Scheduled via pg_cron every hour

**Admin UI:**
- Add "Suppress nudges" and "Send nudge now" buttons to existing MessagingPulsePage stale conversations view
- Admin can pause all nudges for a specific job

**Event taxonomy additions:**
- `NUDGE_SENT`, `NUDGE_SUPPRESSED`, `REBOOK_CREATED`, `PRO_SAVED`, `PRO_UNSAVED`

---

## Build Order

| Week | Tickets | Rationale |
|------|---------|-----------|
| 1 | T1 (Saved Pros) | Simplest, immediate retention value |
| 1 | T2 (Rebook Flow) | High-impact, leverages existing job structure |
| 2 | T3 (Nudges) | Most complex, needs email templates + scheduling |

## Technical Notes

- Rebook uses a column on `jobs` rather than a separate tracking table — simpler, queryable, no sync issues
- Nudge deduplication follows the same pattern as `dispute-deadline-automation` (event log + unique constraint)
- All RPCs use SECURITY DEFINER with `SET search_path = public`
- Nudge edge function is internal-only, matching the existing auth classification model
- No new public-facing tables — `saved_pros` is user-scoped, `nudge_log` is service-role only

