

# Security Hardening Sprint Plan

Based on the audit findings cross-referenced against the actual database policies and codebase, here is what needs to happen, in priority order.

---

## PHASE 1 — P0: Critical Privilege Escalation Fix

### 1. Lock down `user_roles` UPDATE policy (CRITICAL)

**The problem is real and confirmed.** The current RLS policy:

```
"Users can update their own roles"
  qual: (auth.uid() = user_id)
  with_check: <nil>
```

This means any authenticated user can run:
```js
supabase.from('user_roles').update({ roles: ['client','professional','admin'] }).eq('user_id', myId)
```
...and grant themselves admin. This is a **privilege escalation vulnerability**.

**Fix:**
- Drop the current "Users can update their own roles" policy
- Replace with a restricted policy that only allows updating `active_role`, and only to a value already present in the user's `roles` array
- Create a `SECURITY DEFINER` RPC `switch_active_role(p_new_role text)` that validates the role is in the user's existing `roles` array before updating
- Update `switchRole()` in `useSessionSnapshot.ts` to call the RPC instead of a direct `.update()`

**Acceptance criteria:** `supabase.from('user_roles').update({ roles: ['admin'] })` returns an RLS error.

### 2. Add `.env` to `.gitignore`

**Confirmed missing.** The `.gitignore` does not include `.env`. While this is a Lovable Cloud project (so `.env` is auto-managed and contains only publishable keys), it's still best practice.

**Fix:**
- Add `.env` and `.env.*` to `.gitignore`

---

## PHASE 2 — P1: Pre-Launch Hardening

### 3. Remove hardcoded admin emails from frontend bundle

**Confirmed:** `src/domain/adminAllowlist.ts` contains three email addresses in the shipped JS bundle. The database already has an `admin_allowlist` table and `is_admin_email()` function — so the DB layer is correct. The frontend file is a UX convenience but leaks PII.

**Fix:**
- Remove the hardcoded email set from `adminAllowlist.ts`
- Replace `isAdminEmail()` with a lightweight query to `user_roles` that checks if the user has the `admin` role (which is already loaded in `useSessionSnapshot`)
- The `hasRole('admin')` check from the session context is sufficient for frontend gating — no email check needed client-side
- Update `checkAccess()` in `src/guard/access.ts` to use `ctx.hasRole('admin')` only (the DB RLS + `is_admin_email()` function handles the real security)

**Acceptance criteria:** No admin emails appear in the production JS bundle. `grep -r "heapy" dist/` returns nothing.

### 4. Rename `admin2FA` access rule

**Current state:** The access rule is called `admin2FA` but there is no actual 2FA/MFA. It's an email allowlist check.

**Fix:**
- Rename `admin2FA` → `admin` across `src/app/routes/rules.ts`, `src/guard/access.ts`, and the route registry
- This is a naming clarity fix — the actual security is enforced by `is_admin_email()` at the DB level

**Note on real MFA:** Implementing TOTP-based MFA is a separate, larger effort. The current DB-level admin allowlist provides adequate protection for the current scale. Real MFA can be added as a Phase 3 item.

### 5. Error Boundary — already exists

**No action needed.** The audit flagged this, but `src/components/ErrorBoundary.tsx` already exists and wraps `<App />` in `src/main.tsx`. This finding is resolved.

---

## PHASE 3 — P2: Before Payments Go Live

### 6. Audit all admin RLS policies

**Current state:** Spot-checked and most admin policies correctly use `has_role(auth.uid(), 'admin') AND is_admin_email()`. A full audit pass should verify every admin-accessed table.

**Fix:**
- Systematic review of all tables with admin policies
- Verify no admin table has overly permissive SELECT/UPDATE
- Document results in a checklist

### 7. Add Content Security Policy headers

**Fix:**
- Add CSP meta tag to `index.html` with a sensible baseline policy
- Or configure via hosting headers if available

### 8. Auth and guard tests

**Fix:**
- Write integration tests for:
  - Role switch only changes `active_role`
  - Cannot escalate roles via direct update (after Phase 1 fix)
  - RouteGuard blocks incorrect roles
  - Admin routes blocked for non-admins

---

## PHASE 4 — P3: Cleanup

### 9. Audit unused Radix packages
- Check which of the 30+ Radix packages are actually imported
- Remove unused ones to reduce bundle size

### 10. Move `eslint-plugin-import` to devDependencies
- Currently in `dependencies`, should be in `devDependencies`

### 11. Evaluate `next-themes` replacement
- Currently used for theme switching in a Vite app
- Low priority — works fine, just not idiomatic

---

## Summary of Changes

| Priority | Item | Type | Files/Tables Affected |
|----------|------|------|-----------------------|
| P0 | Lock `user_roles` UPDATE policy | DB migration + code | RLS policy, new RPC, `useSessionSnapshot.ts` |
| P0 | `.env` in `.gitignore` | Config | `.gitignore` |
| P1 | Remove hardcoded admin emails | Code | `adminAllowlist.ts`, `access.ts` |
| P1 | Rename `admin2FA` → `admin` | Code | `rules.ts`, `access.ts`, route registry |
| P2 | Full admin RLS audit | DB review | All admin-accessed tables |
| P2 | CSP headers | Config | `index.html` |
| P2 | Auth/guard tests | Tests | New test files |
| P3 | Unused deps cleanup | Config | `package.json` |

The P0 item (user_roles privilege escalation) is the only genuine critical vulnerability. Everything else is hardening and best practice.

