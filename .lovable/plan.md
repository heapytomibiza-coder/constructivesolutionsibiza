

## Plan: Tighten completion fix — two specific issues

### Context

The completion flow fix is mostly in place. Two specific loose ends need tightening before it's done.

### Issue 1: Misleading comment in `JobTicketCompletion.tsx`

Line 87: `userId: undefined, // not available here, action logs it server-side`

This is wrong — `completeJob()` does **not** log anything server-side. It only logs the `debugCtx` object client-side before the RPC call. Passing `undefined` means the debug log has no user ID for the completion-card path, reducing its diagnostic value.

**Fix:** Import `useSession` in `JobTicketCompletion` (or pass `userId` as a prop from `JobTicketDetail` which already has `user?.id`) and pass the real value. Remove the misleading comment.

The cleanest approach: add a `viewerId?: string` prop to `JobTicketCompletionProps` and pass `user?.id` from `JobTicketDetail.tsx` at both render sites (lines 437-444 and 452-459). Then use it in the `debugCtx`.

### Issue 2: `friendlyError` exact-key lookup is brittle

`completeJob.action.ts` line 14-16:
```ts
function friendlyError(raw: string): string {
  return RPC_ERROR_MAP[raw] ?? raw;
}
```

If Supabase ever wraps the exception message (e.g., `"not_authorized"` arrives as `"ERROR: not_authorized"` or with extra context), this exact-key lookup silently falls through and shows the raw database message to the user.

**Fix:** Change to a substring/includes check:

```ts
function friendlyError(raw: string): string {
  for (const [key, msg] of Object.entries(RPC_ERROR_MAP)) {
    if (raw.includes(key)) return msg;
  }
  return raw;
}
```

This is safe because the error tokens (`job_not_found`, `not_authorized`, `completion_not_requested`, etc.) are distinctive enough to not produce false matches.

### Files to change

| File | Change |
|---|---|
| `src/pages/jobs/actions/completeJob.action.ts` | Make `friendlyError` use substring matching |
| `src/pages/dashboard/client/components/JobTicketCompletion.tsx` | Add `viewerId` prop, pass real user ID in debugCtx, remove misleading comment |
| `src/pages/dashboard/client/JobTicketDetail.tsx` | Pass `viewerId={user?.id}` to both `JobTicketCompletion` render sites |

### What this does NOT change

- No backend changes
- No business logic changes  
- No component restructuring
- No new dependencies

### Verification

After these two changes, the debug log from either entry point will show the real `userId` alongside `jobOwnerId`, making ownership mismatches immediately visible in console. And the error mapping will be resilient to Supabase message format variations.

