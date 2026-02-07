

# Fix: Wizard State Loss When Navigating via URL Step Parameter

## Problem Analysis

When a user navigates directly to `/post?step=logistics`, the wizard resets to Step 1 (Category) instead of respecting the URL step parameter.

### Root Cause

The issue stems from a **race condition** between two systems:

1. **Mode Resolution** (`resolveWizardMode`) — runs on mount, determines wizard mode and sets `initialStep`
2. **URL Step Sync** (`useWizardUrlStep`) — reads step from URL on mount and tries to set it

The race happens because:

```text
┌─────────────────────────────────────────────────────────────────┐
│  User navigates to /post?step=logistics                        │
├─────────────────────────────────────────────────────────────────┤
│  1. resolveWizardMode() runs:                                   │
│     - Parses URL params                                         │
│     - ?step= is NOT in hasExplicitIntent() check               │
│     - Returns mode='fresh', initialStep=Category               │
│                                                                 │
│  2. Wizard sets currentStep = Category (from resolution)       │
│                                                                 │
│  3. useWizardUrlStep runs:                                      │
│     - Reads ?step=logistics from URL                           │
│     - Tries to set currentStep = logistics                     │
│     - BUT state is empty (EMPTY_WIZARD_STATE)                  │
│     - AND the URL is immediately overwritten with step=category │
│                                                                 │
│  Result: Wizard shows Category step with empty state           │
└─────────────────────────────────────────────────────────────────┘
```

### The Key Insight

The `?step=` parameter serves **two different purposes**:

| Purpose | Use Case | State Expectation |
|---------|----------|-------------------|
| URL sync | Reflects current position as user progresses | State exists (user is actively filling) |
| Direct navigation | User bookmarks/shares URL with step | Draft must exist to hydrate state |

Currently, mode resolution ignores `?step=` entirely, treating it as a cosmetic URL parameter.

---

## Solution Design

The fix has two parts:

### Part 1: Treat `?step=` as intent to restore draft

When a user navigates to `/post?step=logistics`:
- If a draft exists in sessionStorage → restore it and jump to the specified step
- If no draft exists → fall back to Category (can't show Logistics with no data)

This makes `?step=` a **soft intent** that works only when state exists.

### Part 2: Prevent useWizardUrlStep from racing

The URL sync hook should NOT try to set the step on mount. Mode resolution handles initial step. The hook should only:
- Write step to URL when it changes
- NOT read step from URL on mount (remove the read effect)

---

## Implementation Steps

### Step 1: Update `resolveWizardMode` to handle `?step=` parameter

**File:** `src/components/wizard/canonical/lib/resolveWizardMode.ts`

Add new priority between resume and fresh start:

```typescript
// After Priority 3 (deep-link), before Priority 4 (draft prompt):

// === PRIORITY 3.5: Step-only navigation (restore draft to reach step) ===
if (params.step && isValidStep(params.step)) {
  const draft = getDraft();
  if (draft) {
    // Draft exists - restore it and navigate to requested step
    // But only if the step is reachable given the draft's state
    const maxReachableStep = deriveStepFromState(draft);
    const requestedStepIndex = getStepIndex(params.step as WizardStep);
    const maxStepIndex = getStepIndex(maxReachableStep);
    
    // Allow navigation to any step up to the max reachable
    const targetStep = requestedStepIndex <= maxStepIndex 
      ? params.step as WizardStep 
      : maxReachableStep;
    
    return {
      mode: 'resume',
      initialState: draft,
      initialStep: targetStep,
      shouldPromptDraft: false,
    };
  }
  // No draft - can't navigate to step, fall through to fresh
}
```

### Step 2: Remove mount-time URL read from `useWizardUrlStep`

**File:** `src/components/wizard/canonical/hooks/useWizardUrlStep.ts`

Remove the effect that reads step from URL on mount:

```typescript
export function useWizardUrlStep(
  currentStep: WizardStep,
  setCurrentStep: (step: WizardStep) => void
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // REMOVED: Don't read step from URL on mount
  // Mode resolution handles initial step determination

  // Write step to URL on change (keep this)
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('step', currentStep);
    setSearchParams(newParams, { replace: true });
  }, [currentStep, searchParams, setSearchParams]);
}
```

### Step 3: Import step utilities in resolveWizardMode

**File:** `src/components/wizard/canonical/lib/resolveWizardMode.ts`

Add missing imports:

```typescript
import { 
  WizardStep, 
  EMPTY_WIZARD_STATE, 
  isValidStep, 
  getStepIndex 
} from '../types';
```

---

## Behavior After Fix

| Scenario | Result |
|----------|--------|
| `/post` (no params) | Fresh start or draft prompt |
| `/post?step=logistics` (draft exists) | Restore draft, jump to Logistics |
| `/post?step=logistics` (no draft) | Fresh start at Category |
| `/post?step=review` (draft only reaches Questions) | Restore draft, jump to Questions (max reachable) |
| `/post?category=xxx` | Deep-link mode (bypass draft) |
| `/post?resume=true` | Resume from auth callback |
| Search selection | Jump to Questions (bypass draft) |

---

## Technical Notes

### Why not treat `?step=` as explicit intent like `?category=`?

The `?step=` parameter cannot trigger a fresh wizard at an arbitrary step because:
- Steps 2-7 require data from previous steps
- Without draft restoration, there's no data to show
- It would create an inconsistent/broken UI

The `?step=` parameter is only meaningful when combined with existing draft state.

### Edge case: Direct link to early step with complete draft

If a user has a complete draft (ready for Review) but navigates to `/post?step=category`:
- This should work — they're jumping back to an earlier step
- The `requestedStepIndex <= maxStepIndex` check handles this

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/components/wizard/canonical/lib/resolveWizardMode.ts` | Add step-aware draft restoration logic |
| `src/components/wizard/canonical/hooks/useWizardUrlStep.ts` | Remove mount-time URL reading (prevent race) |

