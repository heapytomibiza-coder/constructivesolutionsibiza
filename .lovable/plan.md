
# Fix Mobile Sign-In: Visibility + Guard Issue

## Problem

Two issues preventing smooth mobile sign-in:

1. **"Sign in" is invisible on mobile** -- the button is hidden behind the hamburger menu (`hidden sm:inline-flex`), so users can't find it
2. **Stale session redirect** -- if a user has any previous session in localStorage, `PublicOnlyGuard` redirects them away from `/auth` to `/dashboard/client` before the sign-in page loads. On a slow mobile connection, this can appear as "page doesn't load"

## Fix 1: Make "Sign in" visible on mobile nav bar

**File:** `src/shared/components/layout/PublicNav.tsx`

Change the Sign in button from `hidden sm:inline-flex` to always visible when not authenticated. On mobile, show a compact text link instead of a full button to save space.

Replace:
```tsx
<Button variant="ghost" asChild className="hidden sm:inline-flex">
  <Link to="/auth">{t('nav.signIn')}</Link>
</Button>
```

With:
```tsx
<Button variant="ghost" asChild>
  <Link to="/auth">{t('nav.signIn')}</Link>
</Button>
```

This makes "Sign in" visible on all screen sizes when the user is not authenticated.

## Fix 2: Improve PublicOnlyGuard resilience

**File:** `src/guard/RouteGuard.tsx`

The `PublicOnlyGuard` currently redirects authenticated users to `/dashboard/client` (for clients). Two problems:
- It should redirect to `/post` to match the wizard-first habit (consistent with AuthCallback)
- It should handle loading state with a timeout so the page never gets stuck

Changes:
1. Update the client redirect from `/dashboard/client` to `/post` (matching AuthCallback behavior)
2. Add a safety timeout: if session check takes longer than 3 seconds, assume unauthenticated and show the auth page (better to let them sign in than show a spinner forever)

## Technical Details

### PublicOnlyGuard changes (RouteGuard.tsx)

```tsx
export function PublicOnlyGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, activeRole, isLoading, isReady } = useSessionSnapshot();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // If still loading but timed out, show page anyway (let user sign in)
  if ((isLoading || !isReady) && !timedOut) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    const dashboardPath = activeRole === 'professional'
      ? '/dashboard/pro'
      : '/post';  // Wizard-first for clients
    return <Navigate to={dashboardPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
```

### PublicNav changes

Remove `hidden sm:inline-flex` from the "Sign in" button so it's visible on mobile.

## Files changed

| File | Change |
|------|--------|
| `src/shared/components/layout/PublicNav.tsx` | Remove `hidden sm:inline-flex` from Sign in button |
| `src/guard/RouteGuard.tsx` | Add 3s loading timeout to PublicOnlyGuard; change client redirect to `/post` |

## Result

- Users on mobile will see "Sign in" directly in the top bar (no need to open hamburger)
- If a stale session causes the guard to hang, the auth page shows after 3 seconds instead of spinning forever
- Clients who are already logged in and visit `/auth` get sent to the wizard (consistent with post-login flow)
