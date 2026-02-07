

# Plan: Fix Professional Signup → Correct Dashboard Redirect

## Problem Summary

When users sign up as a **professional**, the system correctly:
- ✅ Stores `intent: professional` in user metadata
- ✅ Creates `user_roles` with `active_role: professional` 
- ✅ Creates `professional_profiles` stub with `onboarding_phase: not_started`

But then **fails** to redirect them correctly because:
- ❌ `AuthCallback.tsx` hardcodes redirect to `/dashboard/client` (line 33)
- ❌ `Auth.tsx` defaults `returnUrl` to `/dashboard/client` (line 44)
- ❌ The session data isn't checked to determine the correct landing page

## Root Cause Analysis

```text
┌─────────────────────────────────────────────────────────────────┐
│  User signs up as "Professional"                                 │
│  → email sent with callback to /auth/callback                    │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  User clicks email confirmation link                             │
│  → Lands on /auth/callback                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  AuthCallback.tsx executes:                                      │
│  • Gets session ✓                                                │
│  • IGNORES user's active_role ✗                                  │
│  • Redirects to hardcoded /dashboard/client ✗                    │
└─────────────────────────────────────────────────────────────────┘
```

## Solution

### 1. Update AuthCallback to respect user role

Modify `src/pages/auth/AuthCallback.tsx` to:
- Query the user's `active_role` from `user_roles` table
- Redirect professionals to `/onboarding/professional` (since they're new)
- Redirect clients to `/dashboard/client`

### 2. Update Auth.tsx default returnUrl

Modify `src/pages/auth/Auth.tsx` to:
- When signing in, query user's role to determine correct dashboard
- Remove hardcoded `/dashboard/client` default

### 3. Add role-based dashboard helper function

Create a utility function `getDashboardForRole(role)` that returns the correct path:
- `professional` → `/onboarding/professional` (for new pros) or `/dashboard/pro` (for existing)
- `client` → `/dashboard/client`

---

## Technical Implementation

### File 1: `src/pages/auth/AuthCallback.tsx`

**Changes:**
- After getting session, query `user_roles` table to get `active_role`
- Check `professional_profiles.onboarding_phase` for professionals
- Route to correct destination:
  - New professionals → `/onboarding/professional`
  - Established professionals → `/dashboard/pro`  
  - Clients → `/dashboard/client`

```typescript
// Pseudocode logic
if (session) {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('active_role')
    .eq('user_id', session.user.id)
    .single();
  
  const activeRole = roles?.active_role || 'client';
  
  if (activeRole === 'professional') {
    // Check onboarding status
    const { data: profile } = await supabase
      .from('professional_profiles')
      .select('onboarding_phase')
      .eq('user_id', session.user.id)
      .single();
    
    if (profile?.onboarding_phase === 'complete' || profile?.onboarding_phase === 'service_setup') {
      navigate('/dashboard/pro');
    } else {
      navigate('/onboarding/professional');
    }
  } else {
    navigate('/dashboard/client');
  }
}
```

### File 2: `src/pages/auth/Auth.tsx`

**Changes:**
- Remove hardcoded `/dashboard/client` from line 44
- The returnUrl should only be used when explicitly provided via query params
- Default navigation after sign-in should also check active_role

```typescript
// Line 44 change
const returnUrl = searchParams.get('returnUrl');  // No default

// In handleSignIn, after successful auth:
if (returnUrl) {
  navigate(returnUrl);
} else {
  // Query role and navigate to correct dashboard
  navigate('/auth/callback'); // Let callback handle it
}
```

Alternatively, add the same role-checking logic to `handleSignIn`.

### File 3: `src/guard/RouteGuard.tsx` (PublicOnlyGuard)

The `PublicOnlyGuard` already has correct logic:
```typescript
const dashboardPath = activeRole === 'professional' 
  ? '/dashboard/pro' 
  : '/dashboard/client';
```

But this only triggers when an authenticated user visits `/auth`. The issue is the **callback** page.

---

## Testing Checklist

After implementation:
1. Sign up as professional → confirm email → should land on `/onboarding/professional`
2. Sign up as client → confirm email → should land on `/dashboard/client`
3. Sign in as existing professional → should go to `/dashboard/pro`
4. Sign in as existing client → should go to `/dashboard/client`
5. Visit `/auth` while logged in as professional → redirects to `/dashboard/pro`

---

## Edge Cases Handled

| Scenario | Expected Behavior |
|----------|-------------------|
| New professional signup | → `/onboarding/professional` |
| Established professional (onboarding complete) | → `/dashboard/pro` |
| Client signup | → `/dashboard/client` |
| User with `returnUrl` param | → Respect that URL |
| Professional accessing `/auth` | → Redirect to `/dashboard/pro` |

