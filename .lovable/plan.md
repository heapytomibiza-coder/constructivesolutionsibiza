

# Communication-First Quote System

## What we're fixing

The quote form sits on the job detail modal — a cold, context-free location. Builders need to discuss scope before pricing. The platform should match reality: **discuss first, quote second**.

## Changes

### 1. Remove QuotesTab from pro-facing JobDetailsModal

**File:** `src/pages/jobs/JobDetailsModal.tsx` (lines 399-405)

For professionals (non-owners), remove the `QuotesTab` render. The modal becomes a pure job brief. The "Message" button remains the only CTA. Client owners keep seeing `QuotesTab` unchanged for quote management.

### 2. Create InlineQuoteBuilder wrapper

**New file:** `src/pages/messages/components/InlineQuoteBuilder.tsx`

A slide-up panel wrapper around the existing `ProposalBuilder`. Responsibilities:
- Open/close animation (slide up from bottom, overlay style)
- Cancel button to dismiss
- On successful submit: close panel, insert a system message into the conversation ("You sent a formal quote"), and trigger query invalidation
- Passes `jobId` and `onSuccess` through to `ProposalBuilder` unchanged

`ProposalBuilder` itself is not modified.

### 3. Add quote builder trigger to ConversationThread

**File:** `src/pages/messages/ConversationThread.tsx`

Add state and UI for the inline quote flow:
- New state: `isQuoteBuilderOpen` (boolean)
- New derived state: `canQuote` — true when `userRole === 'professional'`, `jobStatus === 'open'`, and no existing quote (reuse `useMyQuoteForJob`)
- When `canQuote` is true, add a small "Build Quote" icon button next to the send button in the compose bar. Visually secondary (outline/ghost variant) — does not compete with messaging.
- When clicked, renders `InlineQuoteBuilder` as an overlay above the compose bar
- On submit success: send a system-style message via `useSendMessage` with `message_type: 'system'` body like "sent a formal quote", then close the builder

### 4. Convert QuoteNudgeBanner to callback-based

**File:** `src/pages/messages/components/QuoteNudgeBanner.tsx`

- Remove `useNavigate` and the navigation onClick
- Add prop: `onStartQuote: () => void`
- CTA calls `onStartQuote` instead of navigating away
- Update copy: "You've discussed the details — ready to send a formal quote?" / CTA: "Start your quote"
- Parent (`ConversationThread`) passes `onStartQuote={() => setIsQuoteBuilderOpen(true)}`

### 5. Render quote cards inline in message thread

**File:** `src/pages/messages/ConversationThread.tsx`

After a quote is submitted, it appears as a system message in the thread (from step 3). Additionally, for richer display:
- Query quotes for this job+pro using `useMyQuoteForJob`
- If a quote exists and the last system message references it, render `QuoteCard` inline below that system message as a conversation artifact
- This makes the quote visible in context for both parties

### 6. Gate hire on quote existence

**File:** `src/pages/jobs/actions/assignProfessional.action.ts`

After the conversation check (around line 62), add:
```sql
SELECT id FROM quotes
WHERE job_id = $1 AND professional_id = $2
AND status IN ('submitted', 'revised')
LIMIT 1
```
If no quote found: `return { success: false, error: 'A quote is required before hiring this professional.' }`

Server-side enforcement — not UI-only.

## What does NOT change

- `ProposalBuilder` — untouched, rendered inside wrapper
- `QuoteCard` — untouched, reused in thread
- Database schema — no migrations
- `submitQuote.action.ts` — unchanged
- `acceptQuote.action.ts` — unchanged
- Client-side `QuotesTab` in `JobTicketDetail` — unchanged (clients still see all quotes)

## Build order

1. `InlineQuoteBuilder.tsx` (new wrapper)
2. `QuoteNudgeBanner.tsx` (convert to callback)
3. `ConversationThread.tsx` (add builder trigger + state + inline quote rendering)
4. `JobDetailsModal.tsx` (remove pro-facing QuotesTab)
5. `assignProfessional.action.ts` (add quote gate)

## Translation keys needed

Add to `public/locales/en/messages.json`:
- `nudge.title` → "You've discussed the details — ready to send a formal quote?"
- `nudge.subtitle` → "The client can't hire you until you submit one."
- `nudge.cta` → "Start your quote"
- `thread.buildQuote` → "Build Quote"
- `thread.quoteSent` → "sent a formal quote"

