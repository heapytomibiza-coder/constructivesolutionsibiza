

## Admin Security Audit — Current State

### What is already locked down (strong)

**1. Database-level dual-gate (the real security)**
Every admin RLS policy requires BOTH checks:
- `has_role(auth.uid(), 'admin')` — user must have the admin role in `user_roles`
- `is_admin_email()` — user's email must appear in the `admin_allowlist` table

This means even if someone somehow gets the `admin` role injected, their email must also be on the allowlist. The allowlist currently contains 3 emails and has no INSERT/UPDATE/DELETE policies, so it cannot be modified via the API.

**2. Frontend route gating**
All `/dashboard/admin/*` routes use `access: 'admin'` in the registry. The `RouteGuard` checks `hasRole('admin')` from the session context before rendering. Non-admins are redirected to `/auth`.

**3. Admin RPCs**
Functions like `admin_verify_professional` check `has_role(auth.uid(), 'admin')` inside the RPC body and raise exceptions if unauthorized.

**4. No hardcoded emails in frontend**
`adminAllowlist.ts` is a no-op stub. Admin status is purely DB-driven.

**5. Admin actions logged**
All administrative interventions write to `admin_actions_log` for auditability.

---

### What could be tightened (minor gaps)

**1. Leaked password protection is disabled** (flagged by linter)
- This is a backend auth setting, not admin-specific, but affects all accounts including admin ones.
- Enabling it would check passwords against known breach databases.

**2. Settings page shows "Admin Panel" link based on client-side role check**
- Line 130 in `Settings.tsx`: `const isAdmin = roles.includes('admin')` — this is fine for UX gating (showing/hiding the button), and the real guard is at the route + RLS level. No action needed, but worth noting the distinction.

**3. `professional_documents` storage policy uses only `has_role()` without `is_admin_email()`**
- One early migration (Feb 14) created admin policies on `professional_documents` and its storage bucket using only `has_role(auth.uid(), 'admin')` without the `is_admin_email()` double-check that was added later (Feb 19). This is a minor inconsistency.

**4. No rate limiting on admin actions**
- The `rate_limit_events` system exists for user actions but admin operations (verify pro, archive job, etc.) are not rate-limited. Low risk since admin access is tightly controlled, but worth noting.

---

### Verdict

Your admin security is solid. The dual-gate pattern (`has_role` + `is_admin_email`) across all admin RLS policies is the correct approach, and the allowlist table being read-only via API is a strong design. The only actionable item is the `professional_documents` policy inconsistency — adding `is_admin_email()` to those 2 older policies would make the pattern fully consistent.

No plan needed — this is a research/audit answer. No code changes required unless you want the `professional_documents` policy fix applied.

