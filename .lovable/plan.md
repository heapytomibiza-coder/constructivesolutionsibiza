

# Plan: Route Validation — /auth, /post, /messages

## Findings

### 1. Auth: `.single()` still used in Auth.tsx and AuthCallback.tsx (MEDIUM)

Both `Auth.tsx` (lines 92, 101) and `AuthCallback.tsx` (lines 66, 80) query `user_roles` and `professional_profiles` using `.single()`. The session snapshot was fixed to use `.maybeSingle()`, but these two files were missed. New users who haven't had their trigger-created `user_roles` row yet, or non-professional users, will get 406 errors here.

**Fix:** Replace `.single()` with `.maybeSingle()` in both files (4 call sites total). The fallback defaults (`'client'`, `'not_started'`) already handle null correctly.

**Files:** `src/pages/auth/Auth.tsx`, `src/pages/auth/AuthCallback.tsx`

### 2. Auth: Deep-link professional profile query in wizard uses `.single()` (LOW)

`CanonicalJobWizard.tsx` line 216 uses `.single()` for the target professional lookup. If the professional doesn't exist, this throws instead of returning null.

**Fix:** Change to `.maybeSingle()`. The fallback name `'Professional'` is already handled.

**File:** `src/features/wizard/canonical/CanonicalJobWizard.tsx`

### 3. Messages: `useMemo` missing dependency (LOW)

Line 35: `useMemo` for `selectedConversation` depends on `conversations` but the dependency array only lists `[conversationId, conversations]` — this is actually correct as written. No change needed.

### 4. PublicOnlyGuard: no retry mechanism (LOW)

`PublicOnlyGuard` times out after 3s but has no retry. If session hydration is slow (mobile, poor connection), authenticated users see the /auth page instead of being redirected to their dashboard. This is unlikely to cause real issues since the auth page itself handles sign-in, but it's inconsistent with `RouteGuard`.

**Fix:** Not critical — note for future hardening. No change now.

## Files to Edit

| File | Change |
|---|---|
| `src/pages/auth/Auth.tsx` | Replace 2x `.single()` with `.maybeSingle()` (lines 92, 101) |
| `src/pages/auth/AuthCallback.tsx` | Replace 2x `.single()` with `.maybeSingle()` (lines 66, 80) |
| `src/features/wizard/canonical/CanonicalJobWizard.tsx` | Replace `.single()` with `.maybeSingle()` (line 216) |

No database or edge function changes. Five one-line replacements total.

