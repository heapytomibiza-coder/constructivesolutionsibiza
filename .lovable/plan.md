

# Plan: Phase 2 — Validate, Clean, and Harden

## Current State

Phase 1 stabilization is complete. The platform is materially healthier. The remaining work is validation, cleanup, and prevention.

## What This Plan Covers

Three workstreams executed in priority order:

### Workstream 1: Fix Active Console Errors

Two React warnings are firing on every wizard load:

- `CategorySelector` — "Function components cannot be given refs"
- `ServiceSearchBar` — same warning

**Root cause:** These are `default export` function components. React's internal reconciliation is attempting to pass refs. The fix is wrapping both with `React.forwardRef`.

**Files:**
- `src/features/wizard/db-powered/CategorySelector.tsx` — wrap with `forwardRef`
- `src/features/wizard/db-powered/ServiceSearchBar.tsx` — wrap with `forwardRef`
- `src/features/wizard/db-powered/SubcategorySelector.tsx` — same pattern, preemptive fix
- `src/features/wizard/db-powered/MicroStep.tsx` — same pattern, preemptive fix

### Workstream 2: Logging Cleanup

Replace empty `catch {}` blocks and noisy low-value console output with structured logging through the existing `handleSupabaseError` utility.

**Targets:**
- `src/pages/admin/sections/OperatorCockpit.tsx` — empty `catch {}` on audio/notification
- `src/guard/RouteGuard.tsx` — `.catch(() => {})` on refresh calls
- General audit: ensure Supabase errors pass through `handleSupabaseError` instead of raw `console.error`

### Workstream 3: Remaining Route Hardening

**`/messages/{id}`** — Add error and empty-state UI for when conversation ID doesn't match any conversation (currently renders nothing). Add loading state for messages fetch.

**`/forum`** — Forum upload errors already have proper logging. Low priority. Only change: ensure storage bucket exists and RLS is configured.

**`/prototype/price-calculator`** — Prototype route. If errors exist, they're from AI edge function calls. Add timeout protection and user-friendly error state if the estimate generation fails.

**`/auth`** — The auth page errors were from stale token refresh, already fixed in Phase 1. Verify no remaining issues.

### Workstream 4: Post-Fix Verification

Run TypeScript compilation check and review edge function logs to confirm:
- `daily-health-check` is executing without errors
- `saved_professionals` RPCs respond correctly
- No new 406 errors on `professional_profiles`
- Auth token refresh failures have decreased

## Files to Edit

| File | Change |
|---|---|
| `CategorySelector.tsx` | Wrap with `forwardRef` |
| `ServiceSearchBar.tsx` | Wrap with `forwardRef` |
| `SubcategorySelector.tsx` | Wrap with `forwardRef` |
| `MicroStep.tsx` | Wrap with `forwardRef` |
| `OperatorCockpit.tsx` | Replace empty catch with minimal logging |
| `Messages.tsx` | Add null-conversation guard with user-facing message |

No database or edge function changes needed.

