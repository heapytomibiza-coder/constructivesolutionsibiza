

# Sprint 1 Closure — Fix Issues 1, 3, 4, 6

## Issue 5 — Already Resolved
The `job_reviews` table already has `CONSTRAINT unique_review_per_job_per_reviewer UNIQUE (job_id, reviewer_user_id)` from its original migration. No action needed.

---

## Issue 1 — Complete Job via Secure RPC (Blocker)

**Problem**: `JobTicketCompletion.tsx` does a raw client-side update. Timestamps and status are client-controlled.

**Fix**:

1. **Migration**: Create `complete_job(p_job_id UUID)` RPC as `SECURITY DEFINER`:
   - Validates `auth.uid() = user_id`
   - Confirms `status = 'in_progress'` and `assigned_professional_id IS NOT NULL`
   - Sets `status = 'completed'`, `completed_at = now()` server-side
   - Returns `job_id` and `status` (not `VOID`, per your feedback)
   - Raises named exceptions for each failure case

2. **Update `JobTicketCompletion.tsx`**: Replace the raw `.update()` with `supabase.rpc('complete_job', { p_job_id: jobId })`. Map RPC error messages to user-friendly toasts.

3. **Update `completeJob.action.ts`**: Same change — use the RPC instead of raw update. This action file already has ownership checks that become redundant (RPC handles it), so simplify to just call RPC + track event.

---

## Issue 3 — Message Button Links to Wrong Page (Bug)

**Problem**: In `JobTicketQuotes.tsx` line 110, the `MessageSquare` button links to `/dashboard/jobs/${jobId}/compare` instead of the conversation.

**Fix**: Replace the static `<Link>` with an `onClick` handler that:
1. Queries `conversations` for `job_id + pro_id` match
2. Navigates to `/messages/${conv.id}` if found
3. Falls back to `/messages` if no conversation exists

This mirrors the `handleMessage` pattern already used in `QuoteComparison.tsx`.

---

## Issue 4 — Extract Shared Price Formatter (Cleanup)

**Problem**: Identical price formatting logic in `JobTicketQuotes.tsx` (lines 20-33) and `QuoteComparisonCard.tsx` (lines 32-45).

**Fix**: Create `src/pages/jobs/utils/formatQuotePrice.ts` with a single `formatQuotePrice(quote)` function. Import in both files, delete the inline versions.

---

## Issue 6 — Wire Decline Handler (Missing Feature)

**Problem**: `QuoteComparisonCard` renders a decline button when `onDecline` is passed, but `QuoteComparison.tsx` never passes it.

**Fix**: Following the same secure pattern as `acceptQuote.action.ts`:

1. **Create `declineQuote.action.ts`**: Updates the quote status to `rejected`. Since the `quotes` table RLS already allows clients to update quotes on their own jobs, this can use a direct update with status guard (`eq('status', 'submitted')`). The client can only reject quotes on jobs they own (RLS enforced).

2. **Wire in `QuoteComparison.tsx`**: Add `handleDecline` function, pass as `onDecline` to each card. Show a confirmation dialog before declining. Track `EVENTS.QUOTE_DECLINED` event. Invalidate quote queries after success.

3. **Add `QUOTE_DECLINED` to event taxonomy**.

---

## Summary

| Issue | Type | Action | Files Changed |
|-------|------|--------|---------------|
| 1 | Blocker | `complete_job` RPC + update 2 components | Migration + `JobTicketCompletion.tsx` + `completeJob.action.ts` |
| 3 | Bug | Fix message button navigation | `JobTicketQuotes.tsx` |
| 4 | Cleanup | Extract `formatQuotePrice` | New util + `JobTicketQuotes.tsx` + `QuoteComparisonCard.tsx` |
| 5 | N/A | Already has unique constraint | None |
| 6 | Missing | `declineQuote` action + wire handler | New action + `QuoteComparison.tsx` + `eventTaxonomy.ts` |

