

# Redirect Lifecycle Actions from Chat to Job Ticket Page

## What's happening now
The `JobLifecycleBar` in the messaging thread duplicates lifecycle actions (Mark Complete, Leave Review) that already exist on the dedicated `JobTicketDetail` page (`/dashboard/jobs/:jobId`). This clutters the conversation with structured workflow actions.

## What should happen
The messaging thread stays informal. The lifecycle bar in chat should **link to the Job Ticket page** for structured actions instead of handling them inline.

## Changes

### 1. `JobLifecycleBar.tsx` — replace inline actions with links to Job Ticket
- **`in_progress` state**: Instead of an inline "Mark Complete" button with confirmation dialog, show a "View Job" button that navigates to `/dashboard/jobs/${jobId}`
- **`completed` state**: Already links to the Job Ticket — no change needed
- **`open` + quote nudge (professional)**: Keep "Start your quote" as-is — quote composition is inherently a chat action
- **`open` + quote received (client)**: Keep as-is — reviewing the quote card happens in the thread naturally
- Remove the `AlertDialog` confirmation for completion (no longer needed in chat)
- Remove the `onComplete` prop entirely — chat no longer handles completion

### 2. `ConversationThread.tsx` — simplify props
- Remove the `onComplete` handler and `complete_job` RPC call from the thread
- `JobLifecycleBar` no longer needs `onComplete`

### 3. Job Ticket page already has everything
- `JobTicketCompletion` handles mark complete with `complete_job` RPC
- `JobTicketReview` handles the review form
- `StatusTimeline` shows progress
- `JobActivityPanel` shows recent activity
- No changes needed here

## Result
- Chat = informal conversation + quote exchange
- Job Ticket = structured lifecycle control centre
- Lifecycle bar becomes a signpost, not a duplicate control panel

