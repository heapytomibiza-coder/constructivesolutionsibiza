
# Audit: Remaining Issues After Phase Progression Fix

## What's Already Working (Correctly Implemented)

- `phaseProgression.ts` -- canonical phases, `normalizePhase()`, `nextPhase()`, `isPhaseReady()` all correct
- `proReadiness.ts` -- action-based gating, MESSAGE/APPLY don't require verification, uses `isPhaseReady()`
- `useSessionSnapshot.ts` -- `isProReady` uses `isPhaseReady()` + servicesCount, no verification gate
- `BasicInfoStep.tsx` -- uses `nextPhase(currentPhase, 'basic_info')` to guard regression
- `ServiceAreaStep.tsx` -- saves `'service_area'` (not `'verification'`), uses `nextPhase()` guard
- `ServiceUnlockStep.tsx` -- writes `service_setup` on continue, guarded by `nextPhase()`
- `ProfessionalOnboarding.tsx` -- phase-to-step mapping includes legacy aliases (`verification`, `service_setup`, `services`)
- `ProDashboard.tsx` -- "Edit Profile" links to `/professional/profile` (not onboarding)
- `ProfessionalServiceSetup.tsx` -- writes `service_setup` (not `complete`)
- No remaining `verificationStatus === 'verified'` checks in readiness logic

## Issues That Still Need Fixing

### Issue 1: `edit=1` in `buildNextAction` service link (proReadiness.ts line 60)

The `NO_SERVICES` deep-link includes `?edit=1` which historically caused phase regression. While the regression itself is now guarded by `nextPhase()`, using `edit=1` for a "fix readiness" flow is semantically wrong -- the user isn't editing, they're completing setup for the first time.

**File**: `src/guard/proReadiness.ts` line 60
**Change**: Remove `edit=1` from the services href:
```
"/onboarding/professional?edit=1&step=services"  -->  "/onboarding/professional?step=services"
```

### Issue 2: `edit=1` in JobListingCard smart CTA (line 136)

Same issue -- when a pro with 0 services clicks the CTA on a job listing, they're sent into edit mode unnecessarily.

**File**: `src/pages/jobs/JobListingCard.tsx` line 136
**Change**: Remove `edit=1`:
```
"/onboarding/professional?edit=1&step=services"  -->  "/onboarding/professional?step=services"
```

### Issue 3: `edit=1` in ProDashboard service setup links (lines 103, 130, 211)

The "Complete Setup" alert, the "Edit" button on services count, and the empty matched jobs CTA all use `edit=1`. The first two (lines 103, 211) are for pros with 0 services who haven't completed setup yet, so `edit=1` is wrong. Line 130 and 276 are for existing pros editing services -- `edit=1` is correct there.

**File**: `src/pages/dashboard/professional/ProDashboard.tsx`
- **Line 103**: Remove `edit=1` (this is the "complete setup" alert for new pros)
- **Line 211**: Remove `edit=1` (this is the empty matched jobs CTA)
- **Lines 130, 276**: Keep `edit=1` (these are "edit existing services" actions for live pros)

### Issue 4: `ProfessionalServiceSetup.tsx` doesn't use `nextPhase()` guard (line 358)

The `handleComplete()` function hardcodes `onboarding_phase: 'service_setup'` without guarding against regression. If a user is already at `complete`, clicking "Complete Setup" on this page would regress them to `service_setup`.

**File**: `src/pages/professional/ProfessionalServiceSetup.tsx` lines 349-369
**Change**: Import and use `nextPhase()`:
```typescript
import { nextPhase } from '@/pages/onboarding/lib/phaseProgression';

// In handleComplete():
const newPhase = nextPhase(professionalProfile?.onboardingPhase, 'service_setup');
await supabase
  .from('professional_profiles')
  .update({ onboarding_phase: newPhase })
  .eq('user_id', user?.id);
```

### Issue 5: `nextPhase()` return type should be `CanonicalPhase` (not `string`)

Currently returns `string`, which allows non-canonical values to leak downstream. Tightening the return type prevents future mistakes.

**File**: `src/pages/onboarding/lib/phaseProgression.ts` line 53-62
**Change**: Return type from `string` to `CanonicalPhase`

### Issue 6: LinkMapSection has stale `edit=1` reference (line 53)

Documentation/reference table has the old link pattern. Not functional but should match the actual behavior.

**File**: `src/pages/admin/sections/LinkMapSection.tsx` line 53
**Change**: Remove `edit=1` from the route string

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/guard/proReadiness.ts` | 60 | Remove `edit=1` from NO_SERVICES href |
| `src/pages/jobs/JobListingCard.tsx` | 136 | Remove `edit=1` from service completion CTA |
| `src/pages/dashboard/professional/ProDashboard.tsx` | 103, 211 | Remove `edit=1` from setup alerts (keep on lines 130, 276) |
| `src/pages/professional/ProfessionalServiceSetup.tsx` | 349-369 | Use `nextPhase()` guard instead of hardcoded string |
| `src/pages/onboarding/lib/phaseProgression.ts` | 53-62 | Tighten `nextPhase()` return type to `CanonicalPhase` |
| `src/pages/admin/sections/LinkMapSection.tsx` | 53 | Update route string to match |

## No Database Changes Required

All fixes are client-side string and import changes.

## Build Order

1. Fix `phaseProgression.ts` return type (foundation)
2. Fix `proReadiness.ts` href
3. Fix `JobListingCard.tsx` href
4. Fix `ProDashboard.tsx` hrefs (lines 103, 211 only)
5. Fix `ProfessionalServiceSetup.tsx` with `nextPhase()` guard
6. Fix `LinkMapSection.tsx` documentation
