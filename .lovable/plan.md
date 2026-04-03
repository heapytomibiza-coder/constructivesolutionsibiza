

# Agreement Layer — Implementation Plan

## Summary

Add a confirmation step before quote acceptance, a professional Agreement Card for the client job ticket, and supporting touches (terminology, completion reference, print styles). One new DB column, two new components, four file updates.

## 1. Database Migration

Add `accepted_at` to quotes table and update the RPC:

```sql
ALTER TABLE public.quotes ADD COLUMN accepted_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.accept_quote_and_assign(p_quote_id UUID, p_job_id UUID)
-- Same body as current, but the accepted quote UPDATE becomes:
-- SET status = 'accepted', updated_at = now(), accepted_at = now()
```

Preserves all existing logic. No new tables.

## 2. New: `AcceptConfirmationModal`

**File**: `src/components/quotes/AcceptConfirmationModal.tsx`

A `Dialog` triggered from QuoteCard instead of immediate acceptance. Shows:
- Professional name via `ProSummaryCard`
- Scope text
- Line items table (description, qty, unit price, line total)
- Exclusions
- Subtotal / IVA / Total
- Timing (start date estimate, duration)
- Notes
- Microcopy: "Review the scope, pricing, and timing before hiring this professional."
- Footer: "Accept & Hire" primary button + Cancel

Uses existing `Quote` type, `ProSummaryCard`, `Dialog` primitives. Calls the existing `acceptQuote()` action on confirm — no new acceptance path.

## 3. Update: `QuoteCard.tsx`

Replace the direct `handleAccept` call with opening `AcceptConfirmationModal`. Add state `confirmOpen` and pass quote + callbacks to the modal. The modal calls `handleAccept` internally on confirm.

## 4. New: `AgreementCard`

**File**: `src/pages/dashboard/client/components/AgreementCard.tsx`

Renders when an accepted quote exists. Uses `useQuotesForJob` (already fetches line items).

**Structure**:
- Header: "Project Agreement" + accepted date (use `accepted_at ?? updated_at`)
- Professional name via `ProSummaryCard`
- Scope (`scope_text`)
- Original line items only (`!is_addition`)
- Exclusions (`exclusions_text`)
- Subtotal / IVA / Total (from original items)
- Timing (`start_date_estimate`, `time_estimate_days`)
- Notes
- Print button: `window.print()`

**Separated below**: Additions section (items where `is_addition === true`). Header: "Added after agreement". Each with date, acknowledgment icon (✓/⏳), amount. Separate additions subtotal. Reuses the same display pattern from `ProQuoteSummary`.

Visual: `rounded-2xl border bg-card p-6` — clean, dominant, document-like. Wrapped in a `div` with `id="agreement-card"` for scroll targeting and print isolation.

## 5. Update: `JobTicketDetail.tsx`

Insert `AgreementCard` after CancellationCard, before ProgressUpdates:

```
StageHero
CancellationCard
AgreementCard          ← NEW
ProgressUpdates
Completion
Gallery
Review
Quotes (secondary)
Conversation
JobSummary
```

Condition: render when `hasAcceptedQuote && isClient`. Uses existing `quotesForJob` data or the already-available `useQuotesForJob` hook. Add `agreementRef` for scroll targeting.

## 6. Update: `ProQuoteSummary.tsx`

Line 114: change `t('jobTicket.yourQuote', 'Your Quote')` to conditionally show "Agreement" when `quote.status === 'accepted'`. Single ternary, no redesign.

## 7. Update: `JobTicketCompletion.tsx`

In the client completion card (both the "waiting" and "confirm" variants), add a quiet line below the description:
"Refer back to the original agreement if needed." with a text button that scrolls to `#agreement-card`.

## 8. Print Styles in `src/index.css`

Append a `@media print` block:
- Hide everything except `#agreement-card`
- Full-width, no margins
- Clean typography, no shadows/borders
- Hide the print button itself
- Add a simple "Constructive Solutions Ibiza" header via `::before` pseudo-element

## Files Changed

| File | Type |
|---|---|
| Migration SQL | New column + RPC update |
| `src/components/quotes/AcceptConfirmationModal.tsx` | **New** |
| `src/pages/dashboard/client/components/AgreementCard.tsx` | **New** |
| `src/pages/jobs/components/QuoteCard.tsx` | Update (modal trigger) |
| `src/pages/dashboard/client/JobTicketDetail.tsx` | Update (layout insert) |
| `src/pages/dashboard/client/components/ProQuoteSummary.tsx` | Update (1 line) |
| `src/pages/dashboard/client/components/JobTicketCompletion.tsx` | Update (add reference) |
| `src/index.css` | Update (print block) |

## Reuse

- `acceptQuote()` action: unchanged, single acceptance path
- `useQuotesForJob`: existing hook, already fetches line items
- `ProSummaryCard`: reused for professional display
- `Dialog` primitives: existing component
- `formatQuotePrice`: reused where compact price needed
- `ProQuoteSummary` additions pattern: replicated in AgreementCard
- `formatDistanceToNow`: existing date-fns usage

## Edge Cases

- Existing accepted quotes with `accepted_at = null`: fall back to `updated_at`
- Quotes with no line items: show scope text fallback (same pattern as QuoteCard)
- IVA at 0%: hide the IVA line
- No additions: hide additions section entirely

## What Stays Untouched

Quote creation, ProposalBuilder, InlineQuoteBuilder, matching/invites, messaging, disputes, subscriptions.

