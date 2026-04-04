

# Fix: AI Bio Builder Edge Function Auth Bug

## Problem
The `generate-bio` edge function uses `_authClient.auth.getClaims()` (line 23), which **does not exist** on the Supabase JS client. This causes every request to fail silently with an auth error, resulting in the "Failed to generate bio" toast.

## Root cause
When the edge function was created, `getClaims` was used instead of the standard `getUser()` pattern used by every other edge function in the project.

## Fix

### `supabase/functions/generate-bio/index.ts`
Replace lines 23-31:

```typescript
// Before (broken)
const { error: claimsErr } = await _authClient.auth.getClaims(
  authHeader.replace("Bearer ", "")
);
if (claimsErr) { ... }

// After (correct — matches existing edge function pattern)
const { data: { user }, error: userErr } = await _authClient.auth.getUser();
if (userErr || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

## What changes
| File | Change |
|------|--------|
| `supabase/functions/generate-bio/index.ts` | Replace `getClaims()` with `getUser()` on lines 23-31 |

## After fix
- Deploy the edge function
- Re-test the full flow: click "Generate now" or "Generate my bio" and confirm the bio appears in the textarea

## What does NOT change
- No frontend changes
- No new files
- No database changes

