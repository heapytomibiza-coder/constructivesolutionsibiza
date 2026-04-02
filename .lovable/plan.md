

# Fix Timeline Query Scoping + Add Quote Acceptance Event

## Two confirmed bugs

### 1. Timeline messages query is unscoped
`JobTimeline` queries ALL system messages platform-wide with `quote_submitted` or `quote_accepted` events. No conversation or job filter. This means timelines can show events from other jobs.

### 2. `quote_accepted` event is never written
`acceptQuote.action.ts` calls the RPC and fires an analytics event, but never inserts a system message. The timeline queries for `quote_accepted` messages that don't exist.

## Fixes

### Fix 1: Scope the messages query to the job's conversation

In `JobTimeline.tsx`, the component receives `jobId` but needs the conversation ID to scope the messages query. Two options:

**Option A (no prop change):** Query `conversations` table first to get the conversation ID for this job, then filter messages by `conversation_id`. Adds one extra query but keeps the component interface clean.

**Option B (simpler):** Skip the messages table entirely for `quote_accepted`. The `accept_quote_and_assign` RPC already writes to `job_status_history` with `to_status = 'in_progress'`. The dedupe logic already handles this overlap. For `quote_submitted`, scope by joining through `conversations.job_id`.

**Recommended: Option A** — pass `conversationId` as a prop (it's already available in `ConversationThread`), then filter: `.eq("conversation_id", conversationId)`.

Changes:
- `JobTimeline.tsx`: Add `conversationId` prop. Filter messages query with `.eq("conversation_id", conversationId)`.
- `ConversationThread.tsx`: Pass `conversationId` to `JobTimeline`.

### Fix 2: Insert `quote_accepted` system message on acceptance

When a client accepts a quote from the in-thread `QuoteCard`, insert a system message with `metadata: { event: 'quote_accepted', quote_id }`.

The challenge: `QuoteCard` doesn't know the `conversationId` or `senderId`. It's rendered inside `ConversationThread` which does have this context.

Approach: Add an `onAccepted` callback prop to `QuoteCard`. When acceptance succeeds, `ConversationThread` handles inserting the system message (same pattern as `handleCompleteJob`).

Changes:
- `QuoteCard.tsx`: Add optional `onAccepted?: (quoteId: string) => void` prop. Call it after successful acceptance.
- `ConversationThread.tsx`: Pass `onAccepted` handler that inserts a system message with `{ event: 'quote_accepted', quote_id }` metadata, then invalidates `messages` and `job_timeline` queries.

### Fix 3: Handle `QuoteComparison` acceptance path

`QuoteComparison.tsx` also calls `acceptQuote` but lives outside the conversation thread. For now, no system message is inserted from that path — the `in_progress` status history entry (written by the RPC) will represent acceptance in the timeline. The dedupe logic already collapses `quote_accepted` + `in_progress` when they're close together, so this is safe.

## Files

| File | Change |
|---|---|
| `src/pages/messages/components/JobTimeline.tsx` | Add `conversationId` prop, scope messages query |
| `src/pages/messages/ConversationThread.tsx` | Pass `conversationId` to timeline, add `onAccepted` handler for QuoteCard |
| `src/pages/jobs/components/QuoteCard.tsx` | Add optional `onAccepted` callback prop |

## Build order

1. `QuoteCard.tsx` — add `onAccepted` prop
2. `JobTimeline.tsx` — add `conversationId` prop + scope query
3. `ConversationThread.tsx` — wire both together

