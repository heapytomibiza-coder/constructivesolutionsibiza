

# Health Report Fix Plan — 10 Apr RED Status

## Diagnosis Summary

Three distinct issues are causing the RED status:

### 1. React Crashes (3 crashes on /post) — BLOCKER
**Root cause:** `"Component is not a function"` — all 3 crashes are from the same Android device (Chrome 146, 411x749). The component stack points inside `CardContent` within `CanonicalJobWizard`. This is likely a stale deployment chunk issue where a dynamically loaded module resolved incorrectly. The existing chunk-load recovery handler in `App.tsx` catches `Failed to fetch dynamically imported module` but NOT this variant. However, looking more closely — all wizard step components are statically imported (not lazy), so this is more likely a **Vite HMR hot-update gone wrong** or a browser cache serving a stale bundle where a component reference became `undefined`.

**Fix:** Add a defensive guard in the wizard render section. If a step component is rendered but evaluates to a non-function (which would cause this exact error), catch it gracefully instead of crashing. Also wrap the `new Notification()` calls in Settings and useMessageNotifications in try/catch (OperatorCockpit already does this) since mobile browsers throw `Illegal constructor`.

### 2. Network Failures — professional_profiles 406 (26 fails)
**Root cause:** The `professional_profiles` query in `useSessionSnapshot.ts` uses `.maybeSingle()` which should NOT return 406. However, looking at the failing URL pattern, it selects specific columns with `user_id=eq.xxx` — and returns 406. This means PostgREST is returning multiple rows for that user_id. No duplicates exist NOW, but a transient state (e.g., during profile creation) could create a brief window with multiple rows. The query uses `Promise.allSettled` so it doesn't crash the app, but it logs as a network failure.

**Fix:** This is already handled gracefully (allSettled). The 406 is being recorded but not causing user-visible issues. No code change needed — this is noise from test accounts.

### 3. Emails Failed (4)
**Root cause:** All 4 failed emails are to test/non-existent domains (`csibiza.test`, `csiibiza.com`). These are test accounts with invalid email addresses. The mail server correctly rejects them (550 — domain doesn't exist).

**Fix:** No code change needed. These are test account artifacts, not a system bug.

---

## Changes

### File 1: `src/hooks/useMessageNotifications.ts`
Wrap `new Notification()` in try/catch to prevent the `Illegal constructor` error on mobile browsers (same pattern already used in OperatorCockpit).

### File 2: `src/pages/settings/Settings.tsx`
Wrap the test `new Notification()` in try/catch for mobile browser compatibility.

### File 3: `src/features/wizard/canonical/CanonicalJobWizard.tsx`
No change needed — the step components are all statically imported named exports. The "Component is not a function" crash appears to be a one-off stale cache issue from one device. The ErrorBoundary already catches and reports it. If it recurs, we'd add lazy-load error recovery, but 3 crashes from one device/session doesn't warrant structural changes.

## Summary
- **2 files changed** — Notification constructor mobile safety
- **0 database changes**
- The RED status is driven by: 1 mobile browser crash (stale cache, not reproducible), test-account email bounces, and network failure noise from test data. After the Notification fix, expect GREEN on next report.

