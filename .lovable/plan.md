

# Fix Role Switch to Navigate to Correct Dashboard

## Problem

When a user switches roles (e.g., Asker to Tasker), the `activeRole` updates in session state and queries are invalidated, but **no navigation occurs**. Since the Client and Professional dashboards are on separate routes (`/dashboard/client` vs `/dashboard/pro`), the user stays on the wrong dashboard after switching.

## Root Cause

Both `RoleSwitcher` (desktop) and `MobileRolePill` (mobile) call `switchRole()` + `queryClient.invalidateQueries()` but never call `navigate()`. The dashboard link in the header dropdown uses `getDashboardPath(activeRole)` which generates the correct URL, but the role switch itself doesn't trigger navigation.

## Fix

Add `useNavigate()` + `useLocation()` to both components. After a successful role switch, if the user is currently on a dashboard route, navigate them to the correct dashboard for the new role.

### Files to modify

**`src/shared/components/layout/RoleSwitcher.tsx`**
- Import `useNavigate` and `useLocation` from react-router-dom
- Import `getDashboardPath` from `@/app/routes`
- After `switchRole()` + query invalidation, check if current path starts with `/dashboard`
- If so, navigate to `getDashboardPath(newRole)`

**`src/shared/components/layout/MobileRolePill.tsx`**
- Same change: add navigate-on-switch when on a dashboard route

### Logic (same for both components)

```text
After switchRole(newRole):
  1. Invalidate queries (existing)
  2. If location.pathname starts with "/dashboard":
     navigate(getDashboardPath(newRole))
```

This is intentionally scoped to `/dashboard/*` routes only. Switching role on other pages (e.g., `/messages`, `/settings`, `/jobs`) should not force a redirect since those pages are role-agnostic or shared.

### No other files need changes

- `getDashboardPath()` already maps roles to the right path
- `SessionContext` / `useSessionSnapshot` already handles `switchRole` correctly (persists to DB)
- Route registry already has both dashboard routes configured
- `RouteGuard` already gates each dashboard to its required role

