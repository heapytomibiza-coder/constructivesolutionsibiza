# ADR-004: Single Account with Role Switching

**Status:** Accepted
**Date:** 2025-Q1
**Decision maker:** Founder / Engineering Lead

## Context

Users may need to act as both a client (posting jobs) and a professional (receiving jobs). Two approaches:

1. **Separate accounts per role** — User creates one account to hire, another to work. Simple access control but poor UX.
2. **Single account with role switching** — One identity holds multiple roles. User switches active role to change their dashboard and permissions.

## Decision

Single account model. The `user_roles` table stores a `roles[]` array and `active_role` column. Users switch via `switch_active_role` RPC.

```
user_roles:
  user_id     UUID (PK, references auth.users)
  roles       TEXT[]    — e.g., ['client', 'professional']
  active_role TEXT      — current active role
```

## Consequences

### Positive
- **Single login:** User doesn't manage multiple credentials
- **Shared messaging:** All conversations live under one user ID regardless of role
- **Natural upsell:** A client can become a professional (and vice versa) without creating a new account
- **Simpler auth:** One session, one JWT, one identity

### Negative
- **UI complexity:** Dashboard must adapt to active role. Nav must show role-appropriate links.
- **RLS complexity:** Some policies check role (e.g., `role:professional`), requiring the `active_role` to be correctly set
- **Role confusion:** User might post a job while in professional role (mitigated by role-aware UI)

### Mitigations
- `useSessionSnapshot` hook centralizes role state — all components read from one source
- `RouteGuard` checks access rules per route — wrong role redirects to auth
- `RoleSwitcher` component in nav makes current role visible and switchable
- Default role is `client` — safe fallback for new users
- Pro readiness checks (`src/guard/proReadiness.ts`) are action-based, not role-based — a professional role doesn't auto-grant marketplace access

## Implementation Details

- **Role assignment:** On signup, user gets `['client']`. Professional role added during pro onboarding.
- **Admin role:** Added via `admin_allowlist` table + `is_admin_email()` function. Cannot be self-assigned.
- **Access control:** `src/guard/access.ts` → `checkAccess()` evaluates `AccessRule` against `AccessContext`
- **Session loading:** `useSessionSnapshot` loads `user_roles` + `professional_profiles` + `profiles` in parallel on auth state change

## Related
- `src/hooks/useSessionSnapshot.ts` — Session state management
- `src/guard/access.ts` — Access rule evaluation
- `src/guard/proReadiness.ts` — Pro marketplace gating
- `docs/architecture/system-overview.md` — Auth & roles section
