
# Fix Auth Email Delivery + Session Persistence

## Summary

**Alex's account is ✅ SORTED** — his email was confirmed on Feb 5th and he can sign in with his password now.

The bigger issue is **session persistence** ("have to resign back in a lot"). This plan addresses both the email reliability problem (for future users) and the session drops.

---

## What's Causing the Issues

### 1. Email Delivery (Partial Blocker)
- Currently using Supabase's built-in email sender (`noreply@mail.supabase.io`)
- This sender has poor deliverability and often ends up in spam
- Repeated signup attempts for existing users are suppressed by Supabase (security feature)

### 2. Session Persistence (Main Pain Point)
The session management looks correct, but there's a subtle race condition:
- The `onAuthStateChange` listener is set up correctly
- But `refresh()` is called immediately in the same effect
- If `getSession()` completes before the subscription is fully registered, auth events can be missed
- This can cause sessions to appear "lost" after page refresh on slow connections

---

## The Fix

### Phase 1: Session Persistence Fix

Update `useSessionSnapshot.ts` to:
1. Set up the auth listener FIRST and wait for initial state from it
2. Remove the immediate `refresh()` call that races with the listener
3. Add `INITIAL_SESSION` event handling (Supabase emits this on load)
4. Add error boundary for token refresh failures

This prevents the "race condition" logout issue.

### Phase 2: Custom Email Delivery via Resend

Create an edge function that sends confirmation and password reset emails through Resend (API key already added). This ensures:
- Emails come from your verified domain (not `mail.supabase.io`)
- Better deliverability, no spam folder issues
- Custom branding in email templates

The function will:
1. Receive email type, recipient, and action link from the app
2. Send via Resend with CS Ibiza branding
3. Return success/failure status

### Phase 3: Update Auth Flow

Modify the signup and password reset flows to:
1. Use `supabase.auth.admin.generateLink()` to get verification URLs
2. Call the Resend edge function to deliver the email
3. Show clear feedback to users

---

## Files to Change

| File | Change |
|------|--------|
| `src/hooks/useSessionSnapshot.ts` | Fix auth listener race condition |
| `supabase/functions/send-auth-email/index.ts` | New edge function for Resend |
| `supabase/config.toml` | Register new edge function |
| `src/pages/auth/Auth.tsx` | Use custom email sending for signup |
| `src/pages/auth/ForgotPassword.tsx` | Use custom email sending for reset |

---

## Technical Details

### Session Fix (useSessionSnapshot.ts)

```typescript
useEffect(() => {
  let mounted = true;
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, newSession) => {
      if (!mounted) return;
      
      // Handle INITIAL_SESSION - this fires on page load
      if (event === 'INITIAL_SESSION') {
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          await loadUserData(newSession.user.id);
        }
        setIsLoading(false);
        setIsReady(true);
        return;
      }
      
      // Handle other events...
    }
  );

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, [loadUserData]);
```

### Edge Function (send-auth-email)

```typescript
// Receives: { type: 'signup' | 'recovery', email, actionLink }
// Uses Resend to send branded email
// Returns: { success: boolean }
```

---

## Immediate Action for Alex

Alex's account works right now. If he can't sign in:
1. Have him try **Forgot Password** → he'll get a reset link
2. Or clear his browser cache/localStorage and sign in fresh

---

## Timeline

- **Phase 1 (Session fix)**: ~15 min
- **Phase 2 (Resend function)**: ~20 min  
- **Phase 3 (Auth flow update)**: ~25 min

Ready to implement?
