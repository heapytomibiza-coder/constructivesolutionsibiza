
# Fix Professional Flow: Phase Regression, Edit Loop, and Readiness Gate

## Problems Identified

### Problem 1: BasicInfoStep always regresses phase to `basic_info`
**File**: `src/pages/onboarding/steps/BasicInfoStep.tsx` (line 96)
Every save writes `onboarding_phase: 'basic_info'` unconditionally. A professional who completed onboarding and clicks "Edit Profile" from the dashboard gets their phase reset from `complete` or `service_setup` back to `basic_info`.

### Problem 2: ServiceAreaStep saves wrong phase name
**File**: `src/pages/onboarding/steps/ServiceAreaStep.tsx` (line 64)
Saves `onboarding_phase: 'verification'` instead of `'service_area'`. This phase name is not in the canonical progression and causes confusion with the legacy mapping.

### Problem 3: ServiceUnlockStep does NOT advance phase at all
**File**: `src/pages/onboarding/steps/ServiceUnlockStep.tsx` (line 185)
The `handleContinue` function just calls `onComplete()` without writing any phase. The only way to reach `service_setup` or `complete` is through the ReviewStep "Go Live" button or the separate `ProfessionalServiceSetup.tsx` page (which writes `complete` directly).

### Problem 4: `isProReady` in useSessionSnapshot is too strict
**File**: `src/hooks/useSessionSnapshot.ts` (lines 186-189)
Currently requires `verificationStatus === 'verified'` -- but all new pros start as `unverified` and there's no self-service verification flow. This permanently blocks all new professionals from messaging.

Wait -- re-reading the code more carefully:

```typescript
const isProReady = 
  (professionalProfile?.onboardingPhase === 'service_setup' || 
   professionalProfile?.onboardingPhase === 'complete') &&
  (professionalProfile?.servicesCount ?? 0) > 0;
```

Actually this does NOT require verification. But `proReadiness.ts` has verification commented out. The real issue is that the phase never reaches `service_setup` through the onboarding wizard flow because:
- BasicInfoStep saves `basic_info`
- ServiceAreaStep saves `verification`
- ServiceUnlockStep saves nothing
- Only ReviewStep saves `complete`

So after completing services (step 3), phase is still `verification` (from step 2). The user clicks "Continue" to ReviewStep, but `isProReady` checks the DB phase which is still `verification` -- not `service_setup` or `complete`. The loop happens when the user is on the job board and tries to message: `isProReady` is false, they get redirected, but going through onboarding again just writes `verification` again.

### Problem 5: Two competing service editors
`ProfessionalServiceSetup.tsx` at `/professional/service-setup` writes `onboarding_phase: 'complete'` on its "Complete Setup" button (line 358). The `ServiceUnlockStep` in onboarding writes nothing. These are completely different code paths for the same concept.

### Problem 6: Dashboard "Edit Profile" links to onboarding
`ProDashboard.tsx` links "Edit Profile" to `/onboarding/professional?edit=1&step=basic_info` (line 282), which triggers BasicInfoStep, which regresses phase on save.

---

## Solution

### 1. Create phase progression utility

**New file**: `src/pages/onboarding/lib/phaseProgression.ts`

Defines the canonical phase order and a `nextPhase()` function that only advances forward, never regresses:

```
PHASE_ORDER: not_started -> basic_info -> service_area -> service_setup -> complete
```

`nextPhase(currentPhase, targetPhase)` returns `targetPhase` only if it's ahead of `currentPhase`, otherwise returns `currentPhase` unchanged.

### 2. Fix BasicInfoStep -- guard phase regression

Modify the save mutation to use `nextPhase()` instead of hardcoding `'basic_info'`. Read the current phase from the session and only advance if appropriate.

**Change** (line 96): `onboarding_phase: 'basic_info'` becomes `onboarding_phase: nextPhase(currentPhase, 'basic_info')`

### 3. Fix ServiceAreaStep -- correct phase name + guard regression

**Change** (line 64): `onboarding_phase: 'verification'` becomes `onboarding_phase: nextPhase(currentPhase, 'service_area')`

### 4. Fix ServiceUnlockStep -- advance to `service_setup`

Add a phase write when continuing. After the user clicks "Continue" with at least 1 service selected, update `onboarding_phase` to `service_setup` (guarded by `nextPhase()`).

This is the critical missing link that makes `isProReady` return true for messaging/applying.

### 5. Fix proReadiness.ts -- normalize legacy phases + action-based gating

Replace the current simple implementation with:
- `normalizePhase()` to handle legacy values (`verification` -> `service_area`, `services` -> `service_setup`)
- Action-based policy (MESSAGE/APPLY don't require verification; BOOK/PAYOUT do)
- `nextAction` field with deep-link href so the UI can route to the exact missing step

### 6. Fix useSessionSnapshot `isProReady` -- use normalized phase

Update the `isProReady` computation to normalize the phase before checking, so legacy values like `verification` or `services` don't permanently brick users.

### 7. Fix dashboard "Edit Profile" link

Change "Edit Profile" CTA in ProDashboard from linking to onboarding to linking to `/professional/profile` (ProfileEdit.tsx), which does NOT touch `onboarding_phase` at all. ProfileEdit already has autosave and writes to the correct tables.

Keep "Update Services" linking to `/onboarding/professional?edit=1&step=services` since that's the correct flow.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/onboarding/lib/phaseProgression.ts` | Phase ordering utility with `nextPhase()`, `normalizePhase()`, `phaseIndex()` |
| `src/pages/onboarding/lib/index.ts` | Barrel export |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/onboarding/steps/BasicInfoStep.tsx` | Use `nextPhase()` to guard regression on save |
| `src/pages/onboarding/steps/ServiceAreaStep.tsx` | Change `'verification'` to `'service_area'` + use `nextPhase()` |
| `src/pages/onboarding/steps/ServiceUnlockStep.tsx` | Add phase write (`service_setup`) on continue |
| `src/guard/proReadiness.ts` | Add `normalizePhase()`, action-based policy, `nextAction` deep-links |
| `src/hooks/useSessionSnapshot.ts` | Normalize phase in `isProReady` computation, expand `OnboardingPhase` type |
| `src/pages/dashboard/professional/ProDashboard.tsx` | Change "Edit Profile" link from onboarding to `/professional/profile` |
| `src/pages/professional/ProfessionalServiceSetup.tsx` | Change `'complete'` to `nextPhase(current, 'service_setup')` |

## No Database Changes Required

All fixes are client-side. The `onboarding_phase` column is a plain text field that accepts any value.

---

## Build Order

1. Create `phaseProgression.ts` utility (foundation for everything else)
2. Update `proReadiness.ts` with normalize + action policy + nextAction
3. Update `useSessionSnapshot.ts` isProReady computation
4. Fix `BasicInfoStep.tsx` -- guard regression
5. Fix `ServiceAreaStep.tsx` -- correct phase name + guard
6. Fix `ServiceUnlockStep.tsx` -- write `service_setup` on continue
7. Fix `ProfessionalServiceSetup.tsx` -- use `service_setup` not `complete`
8. Fix `ProDashboard.tsx` -- Edit Profile links to ProfileEdit

## Expected Result After Fix

- A new professional completes onboarding: phase progresses `not_started` -> `basic_info` -> `service_area` -> `service_setup` -> `complete`
- After step 3 (services), phase is `service_setup`, which makes `isProReady = true` (assuming services > 0)
- Editing profile via dashboard never regresses phase
- Messaging/applying works without verification (verification is a trust badge, not a gate)
- If a pro is blocked, the error toast includes a deep-link to the exact missing step
