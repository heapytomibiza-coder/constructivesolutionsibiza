
# Full Technical Audit -- CS Ibiza Platform

---

## 1. CHANGE SUMMARY (Diff Overview)

### Files touched in the latest updates

| File | What Changed |
|------|-------------|
| `src/domain/rollout.ts` | **Created** -- rollout phase system with `CURRENT_ROLLOUT = 'pipe-control'` |
| `src/app/routes/rules.ts` | Added `minRollout?: RolloutPhase` to `RouteConfig` |
| `src/app/routes/nav.ts` | Added rollout gating in `canSeeRoute()` -- hides nav links for unreleased features |
| `src/app/routes/registry.ts` | Tagged `/services` (service-layer), `/professionals` (founding-members), `/services/listing/:listingId` (service-layer) with `minRollout` |
| `src/guard/RouteGuard.tsx` | Added rollout block for protected routes; added 3s timeout to `PublicOnlyGuard`; changed client redirect from `/dashboard/client` to `/post` |
| `src/shared/components/layout/PublicNav.tsx` | Removed `hidden sm:inline-flex` from Sign In button (now visible on mobile) |

---

## 2. CRITICAL BUG: ROLLOUT GATING DOES NOT BLOCK PUBLIC ROUTES

**Severity: HIGH -- this is the #1 risk in the entire codebase right now.**

`RouteGuard` only wraps **protected routes** in `App.tsx` (line 156). But the rollout-gated routes (`/services`, `/professionals`) are rendered as **unwrapped public routes** (lines 119, 123):

```
// These are NOT inside <RouteGuard>:
<Route path="/services" element={<Services />} />
<Route path="/professionals" element={<Professionals />} />
```

**Result:** Anyone can visit `/services` or `/professionals` directly by typing the URL. The rollout gating only works for:
- Nav link hiding (works correctly)
- Protected routes inside `<RouteGuard>` (works, but these routes aren't there)

**Fix required:** Either:
- (A) Wrap public rollout-gated routes in a lightweight `RolloutGate` component, OR
- (B) Add rollout checks inside the page components themselves, OR
- (C) Move these routes inside `<RouteGuard>` with `access: 'public'` so the guard still runs

Option (A) is cleanest: create a small wrapper that checks `isRolloutActive` and redirects to `/`.

---

## 3. AUTH FLOW AUDIT

### 3.1 Sign-In Flow
- Email/password via `supabase.auth.signInWithPassword` -- **working**
- On success: navigates to `returnUrl` or `/auth/callback`
- On `email_not_confirmed` error: shows confirmation resend UI -- **good**
- Error messages shown via `toast.error` -- **good**

### 3.2 Sign-Up Flow
- Intent selector -> form -> `supabase.auth.signUp`
- If auto-confirm enabled (currently IS enabled per memory): session returned immediately, redirect to `/auth/callback`
- If not: shows confirmation UI with resend button
- **Issue:** `minLength={6}` on signup password field but `ResetPassword` enforces `minLength={8}`. Inconsistent. Memory says "minimum 8 characters" is the standard.
- **Issue:** Roles are passed as `data.intent` in metadata but the actual role assignment happens in a DB trigger (`handle_new_user`). If that trigger fails silently, user gets no role row and the app defaults to `client` from `useSessionSnapshot`. Not a crash, but could cause professional signup to lose intent.

### 3.3 Post-Auth Redirect Logic
- `AuthCallback.tsx` queries `user_roles.active_role` and `professional_profiles.onboarding_phase`
- Clients -> `/post` (wizard-first)
- Professionals with `complete` phase -> `/dashboard/pro`
- Professionals otherwise -> `/onboarding/professional`
- Pending redirect from `sessionStorage('authRedirect')` honored first
- **Consistent with `PublicOnlyGuard`** which also sends clients to `/post`

### 3.4 Session Lifecycle
- `useSessionSnapshot` listens to `onAuthStateChange` with `INITIAL_SESSION` handling -- correct pattern
- Stale refresh token detection with graceful signout -- **good**
- 3s timeout in `PublicOnlyGuard` prevents infinite spinner -- **good**
- **Issue:** `RouteGuard` (for protected routes) has NO timeout. If session never resolves, user sees spinner forever on any protected route.

### 3.5 Password Reset
- `ForgotPassword`: calls `resetPasswordForEmail` with redirect to `/auth/reset-password` -- correct
- `ResetPassword`: checks session, calls `updateUser({password})`, redirects to `/auth/callback` after 2s -- correct
- Anti-enumeration: always shows success on forgot password -- **good**
- **Issue:** `/auth/reset-password` is NOT inside `PublicOnlyGuard`, which is correct (user has session from reset link). But it's also not inside `RouteGuard`. It's a standalone public route -- this is fine.

### 3.6 Sign-In on Mobile (the reported issue)
- **Fixed:** Sign In button was `hidden sm:inline-flex`, now always visible
- **Fixed:** `PublicOnlyGuard` has 3s timeout so stale sessions don't trap users
- MobileNav hamburger also has Sign In button -- **backup path exists**

---

## 4. SECURITY AUDIT

### 4.1 RLS Policies
- All core tables have RLS enabled with granular policies
- `has_role()` security definer function used correctly to prevent recursion
- Admin actions scoped via `has_role(auth.uid(), 'admin')`
- Message privacy: participant-scoped with support ticket escalation path
- **Good:** No overly permissive `true` policies except `forum_posts` SELECT (intentionally public)

### 4.2 Linter Results
- **WARN:** Leaked password protection is DISABLED. Memory says it's enabled. This is a **contradiction** -- the linter says it's off RIGHT NOW.
- Auto-confirm email is enabled (per memory) -- acceptable for soft launch but should be disabled before public launch

### 4.3 Ghost Profile Prevention
- DB trigger `enforce_pro_public_listing_guard` forces `is_publicly_listed = false` unless `onboarding_phase = 'complete'` -- **enforced server-side**
- UI query on `/professionals` filters for `display_name` presence -- **defense in depth**

### 4.4 PII Review
- `profiles` table stores: phone, email (via auth), display_name
- `professional_profiles`: display_name, business_name, bio, service_zones
- `trackEvent` enriches with attribution (session_id, ref, utm_source) -- no PII in analytics
- **No passwords or tokens logged** in trackEvent

### 4.5 Admin Access
- Admin routes use `admin2FA` access rule but 2FA check is `// For now, just check admin role` -- admin role only, no actual 2FA
- Admin actions log all operations to `admin_actions_log` -- **good audit trail**

---

## 5. DATA INTEGRITY

### 5.1 DB Errors in Logs
- `duplicate key value violates unique constraint "attribution_sessions_session_id_key"` -- attribution upsert is racing. Not critical but indicates the edge function isn't using `ON CONFLICT` properly.

### 5.2 Phase Progression
- `phaseProgression.ts` prevents regression (phase can only advance) -- **good**
- Legacy phases (`verification`, `services`, `review`) normalized -- **good**

### 5.3 Signup Role Assignment
- Roles set via `auth.users.raw_user_meta_data.intent` -> DB trigger maps to `user_roles` table
- If trigger fails: user gets default `['client']` role from `useSessionSnapshot` fallback -- safe degradation but silent loss of professional intent

---

## 6. PERFORMANCE AND RELIABILITY

### 6.1 No Global Error Boundary
**There is NO `ErrorBoundary` component anywhere in the codebase.** If any component throws, the entire app crashes to a white screen with no recovery path. This is a **high-severity gap** for production.

### 6.2 No Offline/Network Error Handling
- No retry logic on failed API calls (React Query has defaults but no custom config visible)
- `QueryClient` created with defaults -- no `staleTime`, `gcTime`, or `retry` configuration
- No offline detection or "no connection" UI

### 6.3 Double-Submit Protection
- Sign-in/sign-up buttons disable during loading (`disabled={isLoading}`) -- **good**
- Professional onboarding review step has `isSubmitting` guard -- **good**

---

## 7. ANALYTICS AND OBSERVABILITY

### 7.1 Event Coverage
Events are tracked via `trackEvent()` RPC across:
- Wizard: started, step_viewed, step_completed, abandoned, published
- Pro onboarding: started, step_entered, step_completed, failed, published
- Marketplace: hire_initiated, job_completed
- Admin: force_completed, archived

### 7.2 Known Gaps
- **No auth events tracked:** `signup_started`, `signup_failed`, `login_started`, `login_failed` are NOT instrumented. You cannot currently diagnose signup/login failures from analytics.
- **No email delivery tracking:** No events for email_sent, email_bounced, email_opened
- **No error alerting:** No mechanism to alert on repeated auth failures or API errors
- **No page view tracking:** Only wizard/onboarding steps are tracked, not general page views

### 7.3 Monitoring
- No structured error logging beyond `console.error`
- No external monitoring service (Sentry, LogRocket, etc.)
- Admin dashboard shows platform stats but no real-time error visibility

---

## 8. ROUTE REGISTRY CONSISTENCY

### 8.1 Nav Gating vs Route Gating
- Nav hiding: Works correctly via `canSeeRoute()` in `nav.ts`
- Route blocking: **BROKEN** for public routes (see Section 2)
- Deep links: `/services` and `/professionals` are accessible despite being "gated"

### 8.2 Registry vs App.tsx Sync
- Registry has routes not in `App.tsx`: `/dashboard/jobs/:jobId`, `/dashboard/jobs/:jobId/invite` are in App.tsx but NOT in registry
- App.tsx has routes not in registry: `/launch-checklist`, `/marketplace` redirect, `/professional/service-setup` redirect
- **Not critical** but creates drift between documented routes and actual routes

---

## 9. EMAIL AND MESSAGING

### 9.1 Auth Emails
- Signup confirmation: handled by built-in auth system (auto-confirm currently ON)
- Password reset: `resetPasswordForEmail` with correct `redirectTo`
- **ISSUE:** `send-auth-email` edge function exists in config but has zero recent logs -- unclear if custom auth emails are working or if everything falls back to defaults

### 9.2 In-App Messaging
- Realtime subscriptions via Supabase channels
- `useMessageNotifications` hook for toast/sound/browser notifications
- RLS properly scopes messages to participants

### 9.3 Email Deliverability
- Cannot verify SPF/DKIM/DMARC from code alone -- requires DNS check
- Memory mentions "domain not verified" skipping for email notifications -- potential delivery gaps

---

## 10. TOP 10 RISKS (Ranked by Severity)

| # | Risk | Severity | Fix When |
|---|------|----------|----------|
| 1 | **Rollout gating broken for public routes** -- `/services` and `/professionals` accessible via direct URL despite `pipe-control` phase | CRITICAL | This week |
| 2 | **No ErrorBoundary** -- any component crash = white screen, no recovery | HIGH | This week |
| 3 | **Leaked password protection disabled** (contradicts docs saying it's enabled) | HIGH | This week |
| 4 | **No auth event tracking** -- can't diagnose signup/login failures | MEDIUM | This week |
| 5 | **Password minLength inconsistency** -- signup says 6, reset says 8 | MEDIUM | This week |
| 6 | **No timeout on RouteGuard** (only PublicOnlyGuard has 3s timeout) | MEDIUM | This week |
| 7 | **Attribution session duplicate key errors** in DB logs | LOW | Later |
| 8 | **No QueryClient configuration** -- default retry/stale behavior may cause unnecessary requests | LOW | Later |
| 9 | **Admin 2FA not implemented** -- `admin2FA` access rule just checks admin role | LOW | Later (acceptable for soft launch) |
| 10 | **Registry/App.tsx route drift** -- some routes exist in one but not the other | LOW | Later |

---

## 11. RECOMMENDED FIX PLAN

### Fix This Week
1. Create a `RolloutGate` wrapper and apply to `/services`, `/professionals`, and `/services/listing/:listingId` in `App.tsx`
2. Add a React `ErrorBoundary` at the app shell level with a user-friendly fallback
3. Enable leaked password protection in auth settings
4. Align password minLength to 8 across signup and reset
5. Add auth analytics events: `signup_started`, `signup_failed`, `login_started`, `login_failed`
6. Add timeout fallback to `RouteGuard` (same pattern as `PublicOnlyGuard`)

### Fix Later
7. Fix attribution session upsert to use `ON CONFLICT`
8. Configure `QueryClient` with sensible `staleTime`, `retry`, and `gcTime`
9. Implement actual 2FA for admin routes
10. Reconcile registry and App.tsx route definitions

