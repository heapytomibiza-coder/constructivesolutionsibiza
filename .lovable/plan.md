

# Fix: Unblock Quote Submission + Funnel Visibility

## Root Cause (Critical Finding)

The quote submission UI (`QuotesTab` → `ProposalBuilder`) is **gated behind `isRolloutActive('escrow-beta')`** in `JobDetailsModal.tsx` line 400. The current rollout phase is `service-layer`, which is 2 phases below `escrow-beta`. **Pros literally cannot submit quotes** — the form is hidden.

This is the primary blocker. The 3 tickets below address both the gate and the visibility/nudge improvements, but **Ticket 0 is the unlock**.

## Changes

### Ticket 0 — Ungate QuotesTab from escrow-beta (THE FIX)

**File:** `src/pages/jobs/JobDetailsModal.tsx`

Remove the `isRolloutActive('escrow-beta')` gate around QuotesTab (lines 399-405). The quote submission flow should be available at the current `service-layer` phase — it's the core conversion mechanism.

Change the gate to `isRolloutActive('service-layer')` or remove it entirely.

**File:** `src/pages/jobs/components/QuotesTab.tsx` — no changes needed, already works.

This single change makes the ProposalBuilder visible to pros on the job detail modal, enabling structured quote submission.

---

### Ticket 1 — Admin "Needs Quote" visibility

**File:** `src/pages/admin/hooks/useAdminJobs.ts`
- Add `"needs_quote"` to `AdminJobsFilter` type
- Add a new query that joins conversation and quote counts per job using two subqueries
- Filter case: `needs_quote` → `status = 'open'`, then client-side filter where `conversation_count > 0 && quote_count === 0`

**File:** `src/pages/admin/sections/JobsSection.tsx`
- Add `<SelectItem value="needs_quote">💬 Needs Quote</SelectItem>` to filter dropdown
- Add conversation/quote count badges to the table row (new column or inline badges)
- Show `🟡 Needs Quote` badge on qualifying rows

Data approach: Extend the admin jobs query to include `conversation_count` and `quote_count` as derived fields from subqueries against `conversations` and `quotes` tables (admin has access via RLS).

---

### Ticket 2 — Pro "Send Quote" nudge in chat

**File:** `src/pages/messages/ConversationThread.tsx`
- Add props: pass `jobStatus` to thread (already has `jobId`)
- New component `QuoteNudgeBanner` rendered above the compose bar when:
  - `userRole === 'professional'`
  - job status is `open`
  - message count ≥ 2
  - pro has no existing quote for this job (query `useMyQuoteForJob`)
- Banner text: "Ready to send a quote? The client can't hire you until you submit one."
- CTA button navigates to `/jobs/{jobId}` which opens the job detail modal with the now-ungated QuotesTab

**File:** `src/pages/messages/Messages.tsx`
- Pass `jobStatus` through to ConversationThread (fetch from conversation's job)

---

### Ticket 3 — Client job activity panel

**File:** `src/pages/dashboard/client/JobTicketDetail.tsx`
- New component `JobActivityPanel` inserted above the job summary card
- Shows: professionals invited (from `job_invites` count), conversations started (from `conversations` count), quotes received (from `quotes` count)
- Conditional messaging based on counts:
  - 0 quotes, 0 conversations → "We're matching you with professionals..."
  - conversations > 0, 0 quotes → "You're getting responses — quotes should follow shortly"
  - quotes > 0 → "You have X quotes ready" + Compare CTA
- Data: reuses existing queries (`job_invites`, `conversations`, `quotes` for this job)

---

## Files Changed

| File | Type | Change |
|------|------|--------|
| `src/pages/jobs/JobDetailsModal.tsx` | Gate fix | Remove `escrow-beta` gate on QuotesTab |
| `src/pages/admin/hooks/useAdminJobs.ts` | Enhancement | Add `needs_quote` filter + conversation/quote counts |
| `src/pages/admin/sections/JobsSection.tsx` | Enhancement | Add filter option + badges |
| `src/pages/messages/ConversationThread.tsx` | Enhancement | Add QuoteNudgeBanner component |
| `src/pages/messages/Messages.tsx` | Enhancement | Pass job status to thread |
| `src/pages/dashboard/client/JobTicketDetail.tsx` | Enhancement | Add JobActivityPanel component |
| `src/pages/dashboard/client/components/JobActivityPanel.tsx` | New file | Activity panel component |
| `src/pages/messages/components/QuoteNudgeBanner.tsx` | New file | Nudge banner component |

## No database changes. No RPC changes. No schema changes.

## Risk

Low — Ticket 0 removes a gate. Tickets 1-3 are additive UI only, using existing data and existing queries. No core logic is modified.

