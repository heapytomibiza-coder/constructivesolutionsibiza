

# Admin Email Allowlist - Two-Layer Security Hardening

## Current State

Admin access currently relies on a single mechanism: the `user_roles` table containing `'admin'` in the `roles` array, checked via `has_role(auth.uid(), 'admin')` in RLS policies and `roles.includes('admin')` in the frontend `RouteGuard`.

This means anyone who somehow gets the `admin` role in `user_roles` has full admin access. The user wants a second, independent layer: an email-based allowlist.

## Plan

### Layer 1: Database (real security)

**New table: `admin_allowlist`**

Create via migration:

```text
- Table: admin_allowlist
  - email (text, primary key) 
  - created_at (timestamptz, default now())
- Seed with 3 emails:
  - heapytomibiza@gmail.com
  - constructivesolutionsibiza@gmail.com  
  - heapymagic@googlemail.com
- RLS: admin-only SELECT, no public INSERT/UPDATE/DELETE
```

**New function: `is_admin_email()`**

A stable SQL function that checks if the current JWT email is in the allowlist. This does NOT replace `has_role()` -- it supplements it. Admin access now requires BOTH:
- `has_role(uid, 'admin')` (role in user_roles table)
- `is_admin_email()` (email in allowlist)

**Update existing admin RLS policies**

All tables that currently use `has_role(auth.uid(), 'admin')` will be updated to also require `is_admin_email()`. The affected tables are:

- `admin_actions_log` (SELECT, INSERT)
- `support_requests` (SELECT, UPDATE for admin policies)
- `job_notifications_queue` (SELECT)
- `analytics_events` (SELECT)
- `attribution_sessions` (SELECT)
- `conversation_participants` (INSERT, UPDATE, SELECT for admin policies)
- `professional_profiles` (SELECT, UPDATE for admin policies)
- `professional_documents` (SELECT, UPDATE for admin policies)
- `service_views` (SELECT for admin policy)
- `service_listings` (SELECT for admin policy)
- `job_status_history` (SELECT for admin policy)
- `forum_posts` (SELECT, DELETE for admin policies)
- `user_roles` (SELECT, UPDATE for admin policies)
- `messages` (SELECT for support/admin policy)

The pattern changes from:
```text
has_role(auth.uid(), 'admin'::text)
```
to:
```text
(has_role(auth.uid(), 'admin'::text) AND public.is_admin_email())
```

All admin DB functions (`admin_health_snapshot`, `admin_metric_drilldown`, `admin_operator_alerts`, etc.) already use `has_role()` internally. These will also be updated to require `is_admin_email()`.

### Layer 2: Frontend (UX guard)

**New file: `src/domain/adminAllowlist.ts`**

A simple module exporting:
- `ADMIN_EMAIL_ALLOWLIST` -- Set of allowed emails
- `isAdminEmail(email)` -- check function

**Update `src/guard/access.ts`**

The `admin2FA` access rule will additionally check the user's email against the allowlist. This requires passing the user email into the `AccessContext`.

**Update `src/guard/RouteGuard.tsx`**

Pass `user?.email` into the access check context so the admin2FA rule can verify email.

**Update nav visibility**

The `canSeeRoute` function in `src/app/routes/nav.ts` will also check admin email for `admin2FA` routes, ensuring admin nav links are hidden from non-allowlisted users.

### Technical Details

**Migration SQL** (single migration):
1. Create `admin_allowlist` table with RLS
2. Seed 3 emails
3. Create `is_admin_email()` function (STABLE, SECURITY DEFINER, search_path = public)
4. Drop and recreate all admin-related RLS policies to include `is_admin_email()` check
5. Update all admin RPC functions to add `is_admin_email()` check

**Frontend files to modify:**
- `src/domain/adminAllowlist.ts` (new)
- `src/guard/access.ts` -- add `userEmail` to `AccessContext`, check in `admin2FA` case
- `src/guard/RouteGuard.tsx` -- pass `user?.email` to `checkAccess`
- `src/app/routes/nav.ts` -- add email check for admin2FA visibility
- `src/hooks/useSessionSnapshot.ts` -- no changes needed (already exposes `user.email`)

**Security model after this change:**
```text
Admin access = has_role('admin') AND email in admin_allowlist
```
Both layers must pass. Even if someone manipulates `user_roles` to add `admin`, they still can't access admin data without a matching email in the JWT.

