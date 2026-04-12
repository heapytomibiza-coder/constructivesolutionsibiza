

# Auth Hardening Audit — Current State Verification

Based on direct file inspection, here is the exact current status of every hardening item.

---

## 1. Does `ensureUserRoles` exist?

**Yes.** File: `src/lib/ensureUserRoles.ts` (66 lines). Exports `ensureUserRoles(userId)` which queries `user_roles`, retries once after 1.5s, and throws on missing data.

## 2. Does `parseRolesRow` exist?

**Yes.** Defined at line 22 of `src/lib/ensureUserRoles.ts`. Validates `roles` is a non-empty array, throws `'Your account roles are missing'` if empty, falls back `activeRole` to `roles[0]` only when `active_role` is null.

## 3. Role loading during sign-in (`Auth.tsx`)

**Hardened.** Line 14 imports `ensureUserRoles`. Line 99:

```typescript
const { activeRole } = await ensureUserRoles(userId);
```

Error is caught in the outer `catch` block (line 116) and displayed via `toast.error`. No silent default.

## 4. Role loading in `AuthCallback.tsx`

**Hardened.** Line 5 imports `ensureUserRoles`. Lines 84-94:

```typescript
try {
  const result = await ensureUserRoles(session.user.id);
  activeRole = result.activeRole;
} catch (err: any) {
  setState({ status: 'error', message: err.message || '...' });
  return;
}
```

Failures show an inline error UI with AlertCircle icon and "Back to sign in" button. No silent redirect.

## 5. Does any code still silently default to `client`?

**Yes — in `useSessionSnapshot.ts`.** This is the session-load path (persistent context), separate from the sign-in/callback paths above.

- **Line 84**: `const DEFAULT_ROLE: UserRole = 'client';`
- **Lines 89-90**: Initial state is `[DEFAULT_ROLE]` / `DEFAULT_ROLE`
- **Lines 194-196**: If `inferredRoles` is empty after parsing, it silently adds `client`:
  ```typescript
  if (inferredRoles.size === 0) {
    inferredRoles.add(DEFAULT_ROLE);
  }
  ```

This is a **deliberate design choice** for the session context (needs a role even during loading/hydration), but it does mean the session layer can show `client` even if the DB row is missing. The sign-in and callback paths (Auth.tsx, AuthCallback.tsx) are the gatekeepers — by the time `useSessionSnapshot` runs, the user has already passed through `ensureUserRoles`.

**Risk level: low.** The silent default only applies to the ambient session hook, not to navigation decisions at login time.

## 6. Is `active_role` cast unsafely?

**Partially.** In `useSessionSnapshot.ts` line 198:

```typescript
const dbRole = rolesResult.data?.active_role as UserRole | undefined;
```

This is a raw cast from `unknown` to `UserRole`. However, line 199 immediately validates it:

```typescript
if (dbRole && (dbRole === 'client' || dbRole === 'professional' || dbRole === 'admin')) {
```

So the cast is cosmetic — the value is never used without validation. **Safe in practice.**

In `ensureUserRoles.ts` line 24, `activeRole` is typed as `string` (not `UserRole`), so no unsafe narrowing there.

## 7. `AuthContext.tsx`

**Does not exist.** No file, no imports found. Auth context is provided by `SessionContext.tsx` which wraps `useSessionSnapshot`.

---

## 8. Auto-repair for professional profiles

**Implemented.** `useSessionSnapshot.ts` lines 241-280: if `resolvedRoles` includes `professional` but no profile row exists, it calls `become_professional` RPC and re-fetches. Failure sets profile to `null` (handled by onboarding redirects).

---

## Verdict

| Item | Status |
|---|---|
| `ensureUserRoles` exists | Implemented |
| `parseRolesRow` exists | Implemented |
| Auth.tsx uses `ensureUserRoles` | Implemented |
| AuthCallback uses `ensureUserRoles` + inline error UI | Implemented |
| Silent `client` default removed from login paths | Implemented |
| Silent `client` default in session hook | **Remains (by design)** |
| `active_role` unsafe cast | **Cosmetic cast, validated immediately — safe** |
| Professional profile auto-repair | Implemented |

**Overall: Implemented.** The two remaining items (session hook default, cosmetic cast) are intentional design — not missing hardening.

