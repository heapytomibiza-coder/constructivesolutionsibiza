

# Fix: Onboarding Wizard Navigation Trap

## Problem
The auto-advance effect in `ProfessionalOnboarding.tsx` (line 128) overrides explicit user navigation from the Review checklist. Users clicking "Where you Work" get snapped back to Review immediately, making it impossible to edit service area.

## Root Cause
Two effects fight user intent:
- **Line 97-100**: Sets step from phase on load — re-fires on phase change and overrides manual navigation
- **Line 128-137**: Auto-advances forward whenever phase-derived step is ahead of current step

Neither distinguishes system-driven sync from user-driven backward navigation.

## Fix (3 changes in one file)

**File**: `src/pages/onboarding/ProfessionalOnboarding.tsx`

### 1. Add navigation refs (after existing state declarations ~line 57)
```typescript
const userNavigatedRef = useRef(false);
const lastPhaseRef = useRef<string | null>(null);
```

### 2. Guard both auto-advance effects

**Line 97-100** (phase-based initial step): Add `userNavigatedRef.current` guard so it only fires on first load, not after manual navigation.

**Line 128-137** (phase auto-advance): Add `if (userNavigatedRef.current) return` at the top of the effect body.

### 3. Set the ref on explicit navigation, clear on phase change

- **Line 277** (`onNavigate` callback): Set `userNavigatedRef.current = true` before `setCurrentStep`
- **New effect**: Reset `userNavigatedRef.current = false` when `phase` actually changes (tracked via `lastPhaseRef`), so forward sync resumes after a save

### 4. Review step safeguards (already in place)
Confirmed: `ReviewStep.tsx` already checks `hasServiceArea = effectiveZones.length > 0` and blocks "Go Live" when false. The checklist item correctly shows incomplete state and routes via `onNavigate`. No changes needed there.

## Files Changed
| File | Change |
|------|--------|
| `ProfessionalOnboarding.tsx` | Add 2 refs, guard 2 effects, set ref on navigate, add phase-change reset effect |

## Risk
Low — scoped to navigation logic only. No data flow, no DB changes, no new components.

