

# Onboarding Hardening: Close Remaining Gaps

Based on the full audit, the onboarding flow is ~85% hardened. Four specific gaps remain that need fixing.

## Gap 1: ReviewStep Has Unguarded refresh() and Generic Error

**File:** `src/pages/onboarding/steps/ReviewStep.tsx`

The `handleGoLive` function (line 59-88) has:
- Bare `await refresh()` at line 79 (not in try/catch -- if it throws, the catch at line 83 fires)
- Generic "Something went wrong. Please try again." toast at line 85
- No `trackEvent` call for failure

**Fix:**
- Wrap `await refresh()` in its own try/catch (same pattern as other steps)
- Replace generic toast with actual error message
- Add `trackEvent('onboarding_step_failed', 'professional', { step: 'review', error_message })` in the catch block

## Gap 2: BasicInfoStep Missing Error Tracking

**File:** `src/pages/onboarding/steps/BasicInfoStep.tsx`

The `onError` handler (line 114-118) logs to console and shows the real error message, but does NOT call `trackEvent`. ServiceAreaStep and ServiceUnlockStep already have this.

**Fix:**
- Add `trackEvent('onboarding_step_failed', 'professional', { step: 'basic_info', error_message: msg })` to the onError handler

## Gap 3: ReviewStep Button Alignment (Mobile Consistency)

**File:** `src/pages/onboarding/steps/ReviewStep.tsx`

The navigation buttons (lines 185-216) use `justify-between` layout with `variant="ghost"` for Go Back -- inconsistent with the other steps which now use `flex gap-4` with `variant="outline"` and `flex-1 h-12`.

**Fix:**
- Change container from `justify-between` to `flex gap-4`
- Change Go Back to `variant="outline"` with `flex-1 h-12 flex items-center justify-center`
- Add `flex-1 h-12 flex items-center justify-center` to the Go Live button
- Add `shrink-0` to icons

## Gap 4: Step Entry Tracking for Drop-off Measurement

**File:** `src/pages/onboarding/ProfessionalOnboarding.tsx`

Currently tracks step completion but NOT step entry. This means we can't measure "user entered Service Area but never completed it."

**Fix:**
- Add `trackEvent` calls in the step transition handlers. Track `pro_onboarding_step_entered` with the step name when navigating TO each step (in `handleStepClick` and the initial step resolution).

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/onboarding/steps/ReviewStep.tsx` | Guard refresh(), surface real errors, add trackEvent, fix button alignment |
| `src/pages/onboarding/steps/BasicInfoStep.tsx` | Add trackEvent to onError |
| `src/pages/onboarding/ProfessionalOnboarding.tsx` | Add step entry tracking |

## What This Does NOT Change

- No database changes needed
- No RLS changes (all policies confirmed correct)
- No changes to phaseProgression.ts (logic is sound)
- No changes to proReadiness.ts (gating is correct)
- No changes to ServiceAreaStep or ServiceUnlockStep (already hardened)

## Acceptance Criteria

- All 4 onboarding steps track failures via `trackEvent`
- All 4 steps have `refresh()` guarded in try/catch
- No generic "Something went wrong" toasts remain (real error messages shown)
- Button layout is consistent across all 4 steps (flex gap-4, h-12, outline variant for Go Back)
- Step entry events allow measuring drop-off per step in analytics_events table

