

# Lifecycle Actions + Timeline in Conversation Thread

## What we're building

Two new components inside the conversation thread that give both parties visibility into job progress and the ability to act on it without leaving chat.

## Current state

- `job_status_history` table exists and is populated by RPCs (`accept_quote_and_assign`, `complete_job`)
- `complete_job` RPC exists and works (validates ownership + status server-side)
- `QuoteCard` already has Accept/Withdraw buttons that call `acceptQuote.action.ts`
- `QuoteNudgeBanner` handles the pre-quote nudge for pros
- `JobTicketCompletion` exists in the job ticket detail but not in the conversation thread
- `JobTicketReview` exists in the job ticket detail but not in the conversation thread
- `jobStatus` is already passed as a prop to `ConversationThread`

## New components

### 1. `JobLifecycleBar.tsx`

A compact status-aware bar that replaces `QuoteNudgeBanner`. Sits between message area and compose bar.

**Logic by state:**

| `jobStatus` | Condition | Role | Display |
|---|---|---|---|
| `open` | No quote, < 2 msgs | pro | Nothing (too early) |
| `open` | No quote, 2+ msgs | pro | Nudge: "Ready to send a quote?" + CTA |
| `open` | Quote submitted | pro | "Quote sent — waiting for response" |
| `open` | Quote submitted | client | "You received a quote — review it above" |
| `in_progress` | — | both | "Work in progress" |
| `in_progress` | — | client | + "Mark Complete" button |
| `completed` | — | both | "Job completed" + "Leave a review" link |

Absorbs all `QuoteNudgeBanner` logic. `QuoteNudgeBanner.tsx` gets deleted.

Props: `jobId`, `jobStatus`, `userRole`, `messageCount`, `hasQuote` (boolean), `onStartQuote`, `onComplete`, `hidden`

"Mark Complete" calls `completeJob(jobId)` with confirmation dialog, then invalidates queries and inserts a system message.

"Leave a review" navigates to `/dashboard/client/jobs/{jobId}` where `JobTicketReview` already renders.

### 2. `JobTimeline.tsx`

A collapsible vertical timeline. Queries `job_status_history` for the job.

**Display:** Collapsed by default as a small chip in the conversation header ("View progress"). Expands to show:

```text
● Job posted
● Quote sent
● Quote accepted — work begins
● Completed
● Review left
```

Each row: icon + label + relative timestamp. Maps `to_status` values from `job_status_history` to human labels.

Query: `supabase.from('job_status_history').select('*').eq('job_id', jobId).order('created_at', { ascending: true })`

### 3. Updates to `ConversationThread.tsx`

- Replace `QuoteNudgeBanner` import/render with `JobLifecycleBar`
- Add `JobTimeline` as a collapsible section in the header area (below job title)
- Derive `hasQuote` from `allQuotes` (any quote with status `submitted` or `revised` for this conversation's pro)
- After `completeJob` success: invalidate `['messages', conversationId]` + job queries, insert system message with metadata `{ event: 'job_completed' }`
- After quote accepted (already handled by `QuoteCard` internally): `jobStatus` prop updates via parent re-render — lifecycle bar transitions automatically

### 4. Delete `QuoteNudgeBanner.tsx`

All its logic is absorbed into `JobLifecycleBar`.

## Files

| File | Change |
|---|---|
| `src/pages/messages/components/JobLifecycleBar.tsx` | **New** |
| `src/pages/messages/components/JobTimeline.tsx` | **New** |
| `src/pages/messages/ConversationThread.tsx` | Replace nudge banner, add timeline, wire complete action |
| `src/pages/messages/components/QuoteNudgeBanner.tsx` | **Delete** |
| `public/locales/en/messages.json` | Add lifecycle + timeline keys |
| `public/locales/es/messages.json` | Spanish equivalents |

## What does NOT change

- Database schema — `job_status_history` already exists
- `completeJob.action.ts` — reused as-is
- `QuoteCard` — untouched (Accept button already works + invalidates)
- `JobTicketCompletion` / `JobTicketReview` — remain in job ticket detail
- RPCs — unchanged

## Build order

1. `JobTimeline.tsx` (query + render)
2. `JobLifecycleBar.tsx` (absorb nudge + add lifecycle states)
3. Update `ConversationThread.tsx` (integrate both, wire complete action)
4. Delete `QuoteNudgeBanner.tsx`
5. Add translation keys (en + es)

