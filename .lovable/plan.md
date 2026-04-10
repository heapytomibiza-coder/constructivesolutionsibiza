

# Plan: Phase 3 — Console Cleanup + Unexpected-Null Observability

## Current State

Two active console warnings remain (visible on every page load). The user also requested lightweight logging to distinguish expected nulls (new user, no profile yet) from unexpected nulls (query failure, RLS issue).

## Workstream 1: Fix RoleSwitcher forwardRef Warning

The console shows two warnings originating from `RoleSwitcher.tsx`:
- "Function components cannot be given refs" at `Select` (Radix root)
- Same warning at `SelectPortal` inside `SelectContent`

**Root cause:** Radix UI Select v2.2.5 internal components expect ref-forwarding from their children in certain render paths. The `RoleSwitcher` component is a plain function component that Radix's `Select` root tries to attach a ref to during reconciliation.

**Fix:** Wrap `RoleSwitcher` with `React.forwardRef`. This is the same pattern applied to the wizard components in Phase 2.

**File:** `src/shared/components/layout/RoleSwitcher.tsx`

## Workstream 2: Unexpected-Null Logging

Add lightweight conditional logging at key fallback points so that "expected null" (new user) is distinguishable from "unexpected null" (broken query, RLS denial).

**Pattern:**
```ts
// Instead of just:
const role = data?.active_role || 'client';

// Add after the query:
if (!data && !error) {
  console.debug('[AuthCallback] No user_roles row found — defaulting to client', { userId });
}
```

This logs only when data is null AND there was no error (meaning the row genuinely doesn't exist). If there IS an error, it's already handled by `handleSupabaseError` or explicit error logging.

**Target locations (4 sites):**
- `src/pages/auth/Auth.tsx` — roles query, professional profile query
- `src/pages/auth/AuthCallback.tsx` — roles query, professional profile query

These are the exact files where `.maybeSingle()` was just applied. The wizard file (`CanonicalJobWizard.tsx`) already has adequate context in its existing flow.

**No changes to `useSessionSnapshot`** — that hook already handles null gracefully and is called frequently; adding logs there would be noisy.

## Files to Edit

| File | Change |
|---|---|
| `src/shared/components/layout/RoleSwitcher.tsx` | Wrap with `forwardRef` |
| `src/pages/auth/Auth.tsx` | Add `console.debug` after 2 `.maybeSingle()` calls when data is null |
| `src/pages/auth/AuthCallback.tsx` | Add `console.debug` after 2 `.maybeSingle()` calls when data is null |

No database or edge function changes. No new dependencies.

