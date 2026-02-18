

# Complete the Drip-Feed: AuthCallback Routing + Invite-Only Pro Signup

Two remaining changes to finish the pipe-control phase.

## 1. AuthCallback.tsx -- Fix post-login routing

Two changes in one file:

**A) Clients route to `/post` (wizard-first habit)**

Change line 74 from:
```
navigate('/dashboard/client');
```
to:
```
navigate('/post');
```

**B) Pros forced into onboarding until fully complete**

Change line 67 from:
```
if (onboardingPhase === 'complete' || onboardingPhase === 'service_setup') {
```
to:
```
if (onboardingPhase === 'complete') {
```

This ensures pros land in `/onboarding/professional` until they finish -- no shortcut via `service_setup`.

## 2. IntentSelector.tsx -- Hide "Professional" unless `?pro=1`

**A) Add `allowProfessional` prop**

Add an optional prop to the component:
```
allowProfessional?: boolean  (defaults to false)
```

**B) Filter options**

When `allowProfessional` is false, filter out the `'professional'` intent option. The "Both" option stays visible (it still gives pro role but doesn't telegraph the full marketplace).

**C) Wire it in Auth.tsx**

Read `searchParams.get('pro') === '1'` and pass as `allowProfessional` to `IntentSelector`.

## How you use it day-to-day

- WhatsApp group (clients): send `yourdomain.com/post` or `yourdomain.com/auth?mode=signup` -- they only see "I need help" and "Both"
- Invited pros: send `yourdomain.com/auth?mode=signup&pro=1` -- they see all three options
- After login: clients land on the wizard; pros land on onboarding until complete

## Files changed

| File | Change |
|------|--------|
| `src/pages/auth/AuthCallback.tsx` | Client route to `/post`; pro route strict `complete` check |
| `src/components/auth/IntentSelector.tsx` | Add `allowProfessional` prop + filter |
| `src/pages/auth/Auth.tsx` | Read `?pro=1` param + pass to IntentSelector |

No database changes. No new files.
