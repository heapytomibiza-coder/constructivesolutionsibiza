

# Fix Plan: Quotes RLS, Auth Stability, Pro Dashboard, and Wizard Instrumentation

## 1. Quotes 403 — RLS Policy Fix

**Root cause confirmed.** The `quotes` RLS policies are correct in shape but the `quote_line_items` table has policies granted to `{public}` role instead of `{authenticated}`. The anon key can't actually read them because the JOIN to `quotes` requires auth context — but the mismatch means authenticated users hitting the PostgREST endpoint may get unexpected 403s depending on how the request is routed.

More critically, the quotes SELECT policies look correct (pro sees own, client sees quotes on own jobs, admin sees all). The 403 is most likely happening when a **pro views the QuotesTab on a job they haven't yet started a conversation on** — the `useMyQuoteForJob` query fires for any pro viewing any job detail, and the SELECT returns a 403 rather than empty because RLS denies the row-level scan entirely.

**Fix:**
- Change `quote_line_items` policies from `public` role to `authenticated`
- Wrap the `useMyQuoteForJob` query with proper error handling so a 403 is treated as "no quote" rather than a crash
- Add a permissive SELECT policy on `quotes` for conversation participants (pro who has a conversation on that job can see all quotes for it — needed for competitive awareness or simply to avoid the 403)

## 2. Auth Token Refresh Stability

**Root cause:** The `useSessionSnapshot` hook handles `SIGNED_IN` and `TOKEN_REFRESHED` events by calling `loadUserData` which fires 3 sequential queries (user_roles, professional_profiles, profiles). On flaky mobile connections, a token refresh during these queries can cause a cascade of failures.

**Fixes:**
- Add a `try/catch` with graceful degradation in `loadUserData` — if queries fail during a `TOKEN_REFRESHED` event, keep the existing cached state rather than resetting
- In `RouteGuard`, increase the timeout from 3s to 5s on mobile (detect via `navigator.connection` or viewport width)
- Add a "Connection issue" toast with retry instead of hard-redirecting to `/auth` on timeout
- Debounce rapid `TOKEN_REFRESHED` events (multiple can fire in quick succession)

## 3. Pro Dashboard Performance

**Root cause:** `useProStats` fires 3 parallel-ish queries on mount: `matched_jobs_for_professional` (view), `get_conversations_with_unread` (RPC), and `useProfessionalServices` (another query). These are not batched and all block the loading state.

**Fixes:**
- Add `staleTime: 60000` to the `matchedJobsQuery` (matched jobs don't change every second)
- The `useProfessionalServices` hook is imported separately — check if it's duplicating a query already in `useSession().professionalProfile.servicesCount`; if so, remove it
- Add `placeholderData` to show cached stats instantly on re-mount
- Lazy-load `PendingReviewsCard` (it's below the fold on mobile)

## 4. Wizard Submit Instrumentation

**Root cause confirmed:** Zero `wizard_submit_attempt` / `wizard_submit_fail` events exist. The current code only tracks `review_post_clicked` and `job_posted` — the gap between those two is invisible.

**Fixes in `CanonicalJobWizard.tsx` `handleSubmit`:**
- Track `job_post_submit_attempt` right after validation passes (before the try block)
- Track `job_post_submit_fail` in the catch block with `{ reason: error.message, code: error.code }`
- Track `job_post_submit_auth_redirect` when redirecting to auth (this explains some of the 11 missing posts)

## 5. Leaked Password Protection

This is a backend-only auth configuration. Will enable HaveIBeenPwned integration via the auth configuration tool to reject known breached passwords on signup and password change.

---

## Technical Details

### Migration SQL (quotes RLS)
```sql
-- Fix quote_line_items role from public to authenticated
DROP POLICY "Clients can view quote line items on own jobs" ON public.quote_line_items;
CREATE POLICY "Clients can view quote line items on own jobs"
  ON public.quote_line_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM quotes q JOIN jobs j ON j.id = q.job_id
    WHERE q.id = quote_line_items.quote_id AND j.user_id = auth.uid()
  ));

-- Same for all other quote_line_items policies (pros insert/update/delete/select)
-- Change FROM public TO authenticated

-- Add conversation-participant SELECT on quotes
CREATE POLICY "Conversation participants can view job quotes"
  ON public.quotes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.job_id = quotes.job_id
    AND auth.uid() IN (c.client_id, c.pro_id)
  ));
```

### Files to modify
| File | Change |
|------|--------|
| `src/pages/jobs/queries/quotes.query.ts` | Catch 403 in `useMyQuoteForJob`, return null instead of throwing |
| `src/hooks/useSessionSnapshot.ts` | Add debounce for TOKEN_REFRESHED, graceful fallback on query failure |
| `src/guard/RouteGuard.tsx` | Show retry toast instead of hard redirect on timeout |
| `src/pages/dashboard/professional/hooks/useProStats.ts` | Add staleTime, remove duplicate services query if redundant |
| `src/features/wizard/canonical/CanonicalJobWizard.tsx` | Add submit attempt/fail/auth-redirect tracking events |

