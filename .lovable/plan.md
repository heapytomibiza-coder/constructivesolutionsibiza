

# Auto-trigger Review Modal on Completion

## What we're building

When a client confirms job completion, the review modal opens automatically after a brief success moment. Professionals see a softer prompt when they next view a completed ticket. The inline `JobTicketReview` card becomes the fallback if the modal is dismissed.

## Changes

### 1. Wire RatingModal into JobTicketCompletion (client path)

**File: `JobTicketCompletion.tsx`**

- Add `showReviewModal` state (default `false`)
- After `complete_job` RPC succeeds and query invalidates, set `showReviewModal = true` (with a ~800ms delay for the success toast to land)
- Render `RatingModal` at the bottom of the component
  - `reviewerRole="client"`
  - `onSubmit` → insert into `job_reviews` (same logic as `JobTicketReview.handleSubmit`), then invalidate review queries
  - `onSkip` → close modal, user falls back to inline review section
- Pass `assignedProfessionalId` and `clientId` as new props so the modal knows the reviewee
- Fetch the pro's display name for the modal title

### 2. Add new props to JobTicketCompletion

**File: `JobTicketCompletion.tsx`**

Add to interface:
- `assignedProfessionalId: string | null`
- `clientId: string`

These are already available in `JobTicketDetail.tsx` and just need threading through.

### 3. Update JobTicketDetail to pass new props

**File: `JobTicketDetail.tsx`**

- Pass `assignedProfessionalId={job.assigned_professional_id}` and `clientId={job.user_id}` to both `JobTicketCompletion` renders (lines 438-444 and 451-456)

### 4. Professional soft prompt on completed ticket

**File: `JobTicketReview.tsx`**

- Add a `useEffect` + `useState` for `showReviewModal`
- On first render when `jobStatus === 'completed'` and no existing review, auto-open the `RatingModal` once per session using `sessionStorage` key `reviewed_prompt_${jobId}`
- `reviewerRole="professional"`, private rating copy
- On skip/dismiss, mark session key so it doesn't reopen

### 5. Guardrails

- Modal dismissable (skip button + close X)
- `sessionStorage` prevents repeated auto-opens in same session
- Inline `JobTicketReview` card remains visible as fallback after dismiss
- Dashboard `PendingReviewsCard` continues working independently

## Technical detail

The review submission logic will be extracted into a shared helper to avoid duplication between `RatingModal` callbacks and the inline `JobTicketReview`:

```typescript
// Shared review insert used by both modal and inline form
async function submitJobReview(params: {
  jobId: string; reviewerUserId: string; reviewerRole: string;
  revieweeUserId: string; revieweeRole: string;
  rating: number; comment: string;
}) { /* supabase insert + trackEvent */ }
```

This keeps the review logic in one place.

## Flow summary

```text
Client confirms completion
  → complete_job RPC
  → success toast
  → 800ms delay
  → RatingModal opens automatically
  → Submit review OR Skip
  → If skipped: inline JobTicketReview visible on page
  → Dashboard fallback still works

Professional views completed ticket
  → If no review yet + not prompted this session
  → RatingModal opens (softer copy, private)
  → Submit or Skip
  → Same fallbacks apply
```

## Files touched

| File | Change |
|------|--------|
| `JobTicketCompletion.tsx` | Add review modal auto-trigger after completion, new props |
| `JobTicketDetail.tsx` | Thread `assignedProfessionalId` + `clientId` to completion component |
| `JobTicketReview.tsx` | Add auto-open modal for professionals on first visit |
| New: `src/pages/jobs/utils/submitJobReview.ts` | Shared review submission helper |

