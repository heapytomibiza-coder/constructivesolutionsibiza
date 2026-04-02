
# Professional Job Exit — Withdraw & Request Cancellation

## Two flows based on stage

### 1. Withdraw (status = `assigned`, work hasn't started)
- Professional clicks "Withdraw" → confirmation dialog
- Server-side RPC `withdraw_from_job`:
  - Validates: caller is assigned pro, status is still `open` or `assigned` (quote accepted but no work started)
  - Unassigns professional (`assigned_professional_id = NULL`)
  - Sets job status back to `open`
  - Resets `completion_requested_at/by` if set
  - Logs to `job_status_history`
- Job returns to open state so client can find someone else

### 2. Request Cancellation (status = `in_progress`)
- Professional clicks "Request Cancellation" → confirmation dialog with reason textarea
- Server-side RPC `request_job_cancellation`:
  - Validates: caller is assigned pro, status is `in_progress`
  - Sets `cancellation_requested_at`, `cancellation_requested_by`, `cancellation_reason` on jobs table
  - Does NOT change status — client must approve
- Client sees a prominent "Cancellation Requested" banner in StageHero
  - Options: "Accept Cancellation" (returns job to open, unassigns pro) or "Decline" (clears request)
- Client accepting calls existing close/reassign logic

## Database changes
- Add columns: `cancellation_requested_at`, `cancellation_requested_by`, `cancellation_reason`
- Create RPCs: `withdraw_from_job`, `request_job_cancellation`, `respond_to_cancellation`

## UI changes
- **StageHero**: Show withdrawal/cancellation state for both roles
- **JobTicketDetail**: Add withdraw button in nav for pro (assigned stage), cancellation request card for in_progress
- **New: CancellationRequestCard.tsx** — shown to client when cancellation is requested

## Files affected
| File | Action |
|------|--------|
| Migration | New columns + 3 RPCs |
| `StageHero.tsx` | Cancellation-requested state |
| `JobTicketDetail.tsx` | Withdraw in nav + cancellation card |
| `CancellationRequestCard.tsx` | New component |
