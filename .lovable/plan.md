

# Implementation Plan: Question Deduplication + Save-First Job Flow

## Overview

Two interconnected improvements to the job wizard:

**A) Question Deduplication** -- When multiple micro-services are selected, identical questions from different packs are asked repeatedly. Fix: merge questions by label so each is asked only once.

**B) Save-First Job Flow** -- Currently the wizard immediately posts/sends on submit. Fix: always save the ticket first (status="ready"), then let the user choose distribution from their dashboard ticket page. The ticket is reusable -- they can invite more pros or post publicly later without rewriting.

---

## Part A: Question Deduplication

### The Problem

Database evidence: `ac-installation` and `ac-servicing` both contain questions with identical labels ("What do you need?", "Property type", "How many units or areas?") but different IDs (`ac_installation_01_task` vs `ac_servicing_01_task`). When both are selected, the user sees each question twice.

### The Fix

Deduplicate questions by **normalized label** across all packs before rendering. When two packs share a question label, show it once. The answer is stored under a shared canonical key and copied to both micro-slug answer buckets so downstream systems (job cards, pro briefing) still work.

### Technical Changes

**File: `src/features/wizard/canonical/steps/QuestionsStep.tsx`**

Change the `visibleQuestions` memo (around line 238) to:

1. Collect all questions from all packs (as it does now)
2. Before pushing to the array, normalize the label (lowercase, trim)
3. If a question with that normalized label has already been added, skip it but record the mapping (so the answer gets copied to all matching pack/question pairs)
4. Store a `sharedWith` map: `normalizedLabel -> [{packSlug, questionId}]`

When an answer changes:

1. Look up the canonical label for the answered question
2. Copy the answer value to all other pack/question pairs that share that label
3. This ensures `answers.microAnswers['ac-installation']['ac_installation_03_property']` and `answers.microAnswers['ac-servicing']['ac_servicing_03_property']` always stay in sync

**No database changes required.** This is purely a frontend rendering + answer-sync fix.

### User Experience

- When multiple micros are selected, the question count drops (e.g. 16 down to 8-10)
- A small note appears: "We've combined overlapping questions so you only answer once."
- Micro-specific questions that truly differ still appear normally

---

## Part B: Save-First Job Flow + Ticket Reuse

### Current Behaviour

1. Wizard Review step shows "Post to job board" or "Send privately"
2. Submit button immediately creates the job with `status='open'` and `is_publicly_listed=true/false`
3. User is redirected to `/jobs` (broadcast) or `/messages` (direct)
4. No way to reuse the ticket or change distribution later

### New Behaviour

1. Wizard Review step button becomes **"Save Job"** (not "Post" or "Submit")
2. On save: job is created with `status='ready'` and `is_publicly_listed=false`
3. User is redirected to a new **Ticket Detail page** (`/dashboard/jobs/:id`)
4. From the Ticket Detail page, user can:
   - **Post to Job Board** (sets `status='open'`, `is_publicly_listed=true`)
   - **Invite Specific Professionals** (opens Match and Send screen)
   - Edit the ticket
   - Close/delete the ticket
5. The ticket is always saved and reusable

### Database Changes

**Migration: Add `ready` to job status workflow**

No schema change needed -- `status` is already a `text` column with no CHECK constraint. The value `'ready'` just needs to be recognized by the application code.

**New table: `job_invites`** (for direct invitations)

```
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
job_id          uuid NOT NULL REFERENCES jobs(id)
professional_id uuid NOT NULL
message         text
status          text NOT NULL DEFAULT 'sent'  -- sent, viewed, accepted, declined
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
UNIQUE(job_id, professional_id)
```

RLS policies:
- Job owner can INSERT, SELECT, UPDATE their own invites
- Invited professional can SELECT and UPDATE (accept/decline) their invites
- No DELETE (soft status management only)

### Frontend Changes

**1. Review Step (`ReviewStep.tsx`)**

- Remove the "Post to job board" / "Send privately" radio group
- Replace with a simple confirmation summary
- Button text: "Save Job" (authenticated) or "Sign in to Save" (unauthenticated)

**2. Wizard Submit (`CanonicalJobWizard.tsx` handleSubmit)**

- Change: insert job with `status: 'ready'`, `is_publicly_listed: false`
- Remove: direct conversation creation logic (moves to Ticket Detail)
- Remove: dispatch mode from wizard state (distribution happens post-save)
- Redirect to: `/dashboard/jobs/${jobId}`

**3. New Page: Ticket Detail (`/dashboard/jobs/:id`)**

Layout:
- Job summary card (category, services, location, budget, timing)
- Status badge: "Saved -- Not shared yet" / "Live" / "In Progress"
- Action buttons:
  - "Post to Job Board" -- updates `status='open'`, `is_publicly_listed=true`
  - "Invite Professionals" -- navigates to Match and Send screen
  - "Edit Job" -- navigates back to wizard with job data pre-filled
- Activity section (after sharing): shows invites sent and their statuses

**4. New Page: Match and Send (`/dashboard/jobs/:id/invite`)**

Layout:
- Sticky ticket summary bar at top
- List of matched professionals (uses existing `professional_matching_scores` view filtered by job's micro_slug + zone)
- Each pro card shows: name, rating, relevant services, zones covered
- "View Profile" opens a slide-over drawer (no page navigation)
- "Invite" button sends the saved job to that professional (creates `job_invite` row)
- Can invite multiple professionals without leaving

**5. Client Dashboard Updates**

- Show jobs with `status='ready'` under "Saved Jobs" section
- Add "Invite more" / "Post publicly" quick actions on job cards
- Update `ClientJobCard` to handle the `ready` status

**6. Professional Side**

- New query: fetch invites for the logged-in professional
- Show invites in Pro Dashboard with Accept/Decline actions
- Accepting an invite creates a conversation (reuses existing `get_or_create_conversation` RPC)

### Route Changes

| Route | Purpose |
|---|---|
| `/dashboard/jobs/:id` | Ticket Detail page |
| `/dashboard/jobs/:id/invite` | Match and Send screen |

### Implementation Order

1. Question deduplication (Part A) -- standalone, no dependencies
2. Database migration: `job_invites` table + RLS
3. Wizard submission change (save as `ready`)
4. Ticket Detail page
5. Match and Send page with profile drawer
6. Client Dashboard updates (ready status, invite actions)
7. Professional invite inbox

---

## Technical Details

### Question Dedup Algorithm

```text
Input: packs[] (each has micro_slug + questions[])
Output: uniqueQuestions[] with sharedWith map

labelMap = new Map<normalizedLabel, {packSlug, questionId, question}[]>

for each pack in packs:
  for each question in pack.questions:
    key = question.label.trim().toLowerCase()
    if labelMap.has(key):
      labelMap.get(key).push({pack.micro_slug, question.id, question})
    else:
      labelMap.set(key, [{pack.micro_slug, question.id, question}])
      uniqueQuestions.push(first entry)

On answer change for (slug, qId, value):
  find all entries sharing the same label
  copy value to all of them in microAnswers
```

### Job Status State Machine

```text
ready --> open (posted to board)
ready --> ready (invites sent, but not public)
open  --> in_progress (pro assigned)
ready --> in_progress (invite accepted)
*     --> closed (user cancels)
in_progress --> completed
```

### Files to Create

- `src/pages/dashboard/client/JobTicketDetail.tsx`
- `src/pages/dashboard/client/MatchAndSend.tsx`
- `src/pages/dashboard/client/components/ProProfileDrawer.tsx`
- `src/pages/dashboard/client/hooks/useJobInvites.ts`
- `src/pages/dashboard/professional/hooks/useProInvites.ts`

### Files to Modify

- `src/features/wizard/canonical/steps/QuestionsStep.tsx` (dedup logic)
- `src/features/wizard/canonical/steps/ReviewStep.tsx` (remove dispatch choice, simplify to Save)
- `src/features/wizard/canonical/CanonicalJobWizard.tsx` (submit as ready, redirect to ticket)
- `src/features/wizard/canonical/types.ts` (simplify -- dispatchMode becomes post-save concern)
- `src/pages/dashboard/client/ClientDashboard.tsx` (show ready jobs, add actions)
- `src/pages/dashboard/client/components/ClientJobCard.tsx` (handle ready status)
- `src/App.tsx` (new routes)

