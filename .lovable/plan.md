

# Plan: Post-Submit → Matched Professionals Redirect

## What Changes

One small, targeted change: after a successful job post, navigate the asker to `/dashboard/jobs/:jobId/invite` instead of `/jobs`.

## Files to Change

### 1. `src/features/wizard/canonical/CanonicalJobWizard.tsx`
- **Line 873**: Change `navigate('/jobs')` → `navigate(`/dashboard/jobs/${data.id}/invite`)`
- The `data.id` is already available from the insert response on line 841

### 2. `src/pages/dashboard/client/MatchAndSend.tsx`
- Add a URL-param or location-state check for `fromPost=true`
- When detected, show a small success banner at the top: "Your job has been posted — review matched professionals below"
- The back button already navigates to the job ticket (`/dashboard/jobs/${jobId}`), so ticket access is preserved with no extra work

### 3. `public/locales/en/dashboard.json`
- Add one translation key under `matchAndSend`: `"postSuccess": "Your job has been posted — review matched professionals below"`

## What Stays the Same

- Matching query, ranking logic, scoring — untouched
- Manual path from job ticket → invite — still works
- MatchAndSend component logic, ProProfileDrawer — unchanged
- All other wizard navigation (edit mode, direct mode, duplicate) — unchanged
- Toast message `toasts.postSuccess` still fires for confirmation feeling

## Edge Cases to Check

- Edit mode submits: line 873 is inside the `!isEditMode` branch — edits navigate differently, unaffected
- Direct/pro-targeted submissions: handled in a separate branch (lines before 872), unaffected
- Unauthenticated: submit is gated by auth check, so the invite page's `user` dependency is always satisfied post-submit
- Job with no micro IDs: MatchAndSend already handles empty matches gracefully

## Verification Plan

- Post a job → confirm redirect lands on invite page with success banner
- Confirm back button goes to job ticket
- Confirm edit-mode submit still behaves as before
- Confirm the manual ticket → invite path still works independently

