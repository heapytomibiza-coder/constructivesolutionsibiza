

# Publish Blocker Fixes — 3 Patch Batches

## Batch 1 — State Alignment

### New file: `src/pages/jobs/utils/jobActions.ts`
Create a shared helper module with pure functions:
- `canCancelJob(status: string, isClient: boolean): boolean` — clients: only `draft | ready | open`; pros: only `in_progress` (via cancellation request)
- `canPostJob(status: string): boolean` — `draft` or `ready`
- `canWithdrawQuote(status: string, isAssigned: boolean): boolean` — `open` only (remove dead `assigned` reference)
- Exported for use in `JobTicketDetail.tsx` and `StageHero.tsx`

### Edit: `src/pages/dashboard/client/JobTicketDetail.tsx`

**Cancel button (line 690):** Change condition from `!['completed', 'cancelled'].includes(job.status)` to use `canCancelJob(job.status, isClient)` — hides for `in_progress`. Add a text hint directing client to "Raise Issue" for in-progress disputes.

**Post to board (line 207):** Change `.eq('status', 'draft')` to `.in('status', ['draft', 'ready'])` so `ready` jobs can also post.

**Withdraw button (line 654):** Remove `'assigned'` from the condition. Keep only `'open'`.

### Edit: `src/pages/dashboard/client/components/StageHero.tsx`

**`resolveStage` (line 66-78):** Add explicit handling:
- `status === 'draft'` → new `'draft'` stage
- `status === 'ready'` → new `'ready'` stage
- `status === 'cancelled'` → new `'cancelled'` stage

**`buildStageConfig`:** Add config entries for `draft` (pill: "Draft", message: "Complete your job details and post when ready"), `ready` (pill: "Ready to post", message: "Your job is saved. Post it to the board or invite professionals"), and `cancelled`.

**`JobStage` type:** Add `'draft' | 'ready' | 'cancelled'` to the union.

---

## Batch 2 — Action Safety

### Edit: `src/pages/dashboard/client/JobTicketDetail.tsx`

Add `const [isCompleting, setIsCompleting] = useState(false);` at the component level.

Wrap `handleMarkComplete` with `isCompleting` guard:
```
if (isCompleting) return;
setIsCompleting(true);
try { ... } finally { setIsCompleting(false); }
```

Pass `isCompleting` as a prop to:
- `StageHero` (disable "Confirm Completion" button)
- `JobTicketCompletion` (disable its "Confirm Completion" button)

### Edit: `src/pages/dashboard/client/components/StageHero.tsx`

Add `isCompleting?: boolean` to `StageHeroProps`. When `isCompleting` is true, disable the `onMarkComplete` action button and show a spinner.

### Edit: `src/pages/dashboard/client/components/JobTicketCompletion.tsx`

Add `externalDisabled?: boolean` prop. When true, disable the confirm button even if local `isSubmitting` is false. This prevents the card from firing while `StageHero` already triggered completion.

---

## Batch 3 — Trust + Routing

### Edit: `src/pages/auth/Auth.tsx` (line 106)
Change `navigate('/')` to `navigate('/dashboard/client')`.

### Edit: `src/pages/auth/AuthCallback.tsx` (line 96)
Change `navigate('/')` to `navigate('/dashboard/client')`.

### Edit: `src/guard/RouteGuard.tsx` (line 138-141)
In `PublicOnlyGuard`, change the non-professional redirect from `'/'` to `'/dashboard/client'`.

### Edit: `src/pages/dashboard/client/JobTicketDetail.tsx` (line 422)
Remove the `isClient &&` condition from AgreementCard rendering. Change to:
```tsx
{acceptedQuote && <AgreementCard quote={acceptedQuote} />}
```
Both clients and professionals see the same agreement reference.

### Client cancellation on `in_progress`
In the footer actions section (line 690), for `in_progress` jobs where `isClient` is true, instead of showing "Cancel Job", show a clear text link: "Need to cancel? Raise an issue" pointing to `/disputes/raise?job=${jobId}`. This gives the client a real path without building a new RPC.

---

## Files changed summary

| File | Batch | Change |
|------|-------|--------|
| `src/pages/jobs/utils/jobActions.ts` | 1 | New — shared action helpers |
| `src/pages/dashboard/client/JobTicketDetail.tsx` | 1,2,3 | Cancel visibility, post-to-board fix, withdraw fix, isCompleting state, agreement for both roles, in-progress cancel guidance |
| `src/pages/dashboard/client/components/StageHero.tsx` | 1,2 | draft/ready/cancelled stages, isCompleting prop |
| `src/pages/dashboard/client/components/JobTicketCompletion.tsx` | 2 | externalDisabled prop |
| `src/pages/auth/Auth.tsx` | 3 | Client redirect to dashboard |
| `src/pages/auth/AuthCallback.tsx` | 3 | Client redirect to dashboard |
| `src/guard/RouteGuard.tsx` | 3 | PublicOnlyGuard redirect fix |

## What does NOT change
- No database migrations
- No RPC changes
- No new components
- No styling redesigns
- Existing pro flows, forum, admin — untouched

