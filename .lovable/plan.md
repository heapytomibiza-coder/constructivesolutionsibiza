

# Fix Quote System: Tighten the Quote-to-Message Link + Client Visibility

## Problems to fix

1. **`submitQuote` returns no quote ID** — `InlineQuoteBuilder` cannot attach the quote to the system message
2. **System message matched by translated text** (`msg.body.includes(...)`) — brittle, breaks across locales
3. **Client cannot see the quote in-thread** — `useMyQuoteForJob` queries by `currentUserId` which is the client, not the pro
4. **Nudge banner + footer button can visually clash** — no coordination when builder is open

## Changes

### 1. `submitQuote.action.ts` — return created quote ID

Change the insert to use `.select('id').single()` so the action returns `{ success: true, quoteId: string }`. This is a small change to lines 40-52.

### 2. `ProposalBuilder.tsx` — pass quote ID to `onSuccess`

Change `onSuccess` prop signature from `() => void` to `(quoteId?: string) => void`. After successful submit, call `onSuccess(quoteId)`. The existing callers that ignore the argument remain compatible.

### 3. `InlineQuoteBuilder.tsx` — attach `quote_id` to system message metadata

Update `handleSuccess` to accept the `quoteId` from `ProposalBuilder`. Insert the system message with `metadata: { quote_id: quoteId, event: 'quote_submitted' }`. This creates a stable, locale-independent link between the message and the quote.

### 4. `ConversationThread.tsx` — fix quote rendering logic

**Replace text-matching with metadata check:**
Instead of `msg.body.includes(t('thread.quoteSent'))`, check `msg.metadata?.event === 'quote_submitted'`.

**Fix client visibility:**
Replace `useMyQuoteForJob` with `useQuotesForJob` (already exists, fetches all quotes for a job). Both client and pro can then see the relevant quote card. The quote to render is determined by `msg.metadata?.quote_id` matching against the quotes list.

**Hide nudge banner when builder is open:**
Pass `isQuoteBuilderOpen` to suppress the banner when the builder is already expanded.

### 5. `QuoteNudgeBanner.tsx` — add `hidden` prop

Accept an optional `hidden: boolean` prop. When `true`, return `null`. Parent passes `hidden={isQuoteBuilderOpen}`.

## Files to touch

| File | Change |
|---|---|
| `src/pages/jobs/actions/submitQuote.action.ts` | Return `quoteId` from insert |
| `src/pages/jobs/components/ProposalBuilder.tsx` | Pass `quoteId` to `onSuccess` callback |
| `src/pages/messages/components/InlineQuoteBuilder.tsx` | Attach `quote_id` + `event` to system message metadata |
| `src/pages/messages/ConversationThread.tsx` | Use metadata-based rendering, switch to `useQuotesForJob`, suppress nudge when builder open |
| `src/pages/messages/components/QuoteNudgeBanner.tsx` | Add `hidden` prop |

## What does NOT change

- Database schema — `metadata` JSONB column already exists on `messages`
- `QuoteCard` — untouched
- `acceptQuote.action.ts` — unchanged
- `assignProfessional.action.ts` — unchanged (quote gate already correct)
- `QuotesTab` — unchanged

## Build order

1. `submitQuote.action.ts` (return ID)
2. `ProposalBuilder.tsx` (forward ID to callback)
3. `InlineQuoteBuilder.tsx` (attach metadata)
4. `QuoteNudgeBanner.tsx` (add hidden prop)
5. `ConversationThread.tsx` (metadata-based rendering + `useQuotesForJob` + suppress nudge)

