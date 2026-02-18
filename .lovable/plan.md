

# Fix Onboarding Navigation: Bulletproof Linear Flow

## Problem

Five bugs in the onboarding wizard cause confusion, loops, and "flash of wrong step" issues:

1. Tracker view leaks into first-time onboarding via `?step=tracker` deep-links
2. Phase auto-advance effect has a stale `currentStep` closure (missing dependency)
3. Initial step is computed before profile data loads, causing flash of wrong step
4. Header/progress text references tracker in non-edit paths
5. No safety fallback to prevent tracker from ever rendering outside edit mode

## Changes (single file: `ProfessionalOnboarding.tsx`)

### Fix 1 -- Gate tracker behind edit mode in deep-link effect (line 71-77)

Replace the `allowed` list to exclude `tracker` when `editMode` is false, and add `editMode` to the dependency array.

### Fix 2 -- Add safety fallback effect

New effect that forces `currentStep` back to `basic_info` if it ever becomes `tracker` while `editMode` is false. Belt-and-suspenders guard.

### Fix 3 -- Fix stale closure in phase auto-advance (line 80-90)

Add `currentStep` to the dependency array so the comparison uses the real current value.

### Fix 4 -- Defer initial step until loading completes (line 56-57)

Initialize `currentStep` to `editMode ? 'tracker' : 'basic_info'` (safe default), then set the correct phase-based step in an effect that waits for `isLoading` to be false.

### Fix 5 -- Clean up header text (lines 159, 168-169)

Remove the `tracker` branches from the non-edit header/subtitle since tracker can no longer appear outside edit mode.

## Result

Two hard rules enforced:
- Non-edit mode can only ever show: `basic_info | service_area | services | review`
- Only `?edit=1` may render the tracker overview

No database changes. No new files. Single file edit.

