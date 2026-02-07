

# Fix: Onboarding Step Buttons Not Working

## Root Cause

When `onboarding_phase = 'not_started'`, the `getStepStatus()` function incorrectly returns `'pending'` for the first step instead of `'current'`.

| Phase | Expected Step 1 Status | Actual Status |
|-------|----------------------|---------------|
| `not_started` | `current` | `pending` ❌ |
| `basic_info` | `current` | `current` ✓ |

The mapping is off by one because `'not_started'` isn't in the `stepToPhase` mapping.

---

## Solution

Update `getStepStatus()` to handle `'not_started'` as equivalent to "basic_info is current":

### File: `src/pages/onboarding/ProfessionalOnboarding.tsx`

**Lines 42-56** - Replace the `getStepStatus` function:

```tsx
const getStepStatus = (stepId: string) => {
  // Map phases to their corresponding step
  // 'not_started' means basic_info is the current step
  const phaseToCurrentStep: Record<string, string> = {
    'not_started': 'basic_info',
    'basic_info': 'service_area',    // basic_info done → service_area current
    'verification': 'services',       // service_area done → services current
    'service_setup': 'review',        // services done → review current
    'complete': 'done',               // all done
  };
  
  const stepOrder = ['basic_info', 'service_area', 'services', 'review'];
  const currentStepId = phaseToCurrentStep[phase] || 'basic_info';
  
  const stepIndex = stepOrder.indexOf(stepId);
  const currentIndex = stepOrder.indexOf(currentStepId);
  
  if (currentStepId === 'done') return 'complete'; // All steps complete
  if (stepIndex < currentIndex) return 'complete';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
};
```

---

## Logic Explanation

| Database Phase | Current Step | Step 1 Status | Step 2 Status |
|----------------|-------------|---------------|---------------|
| `not_started` | `basic_info` | **current** ✓ | pending |
| `basic_info` | `service_area` | complete | **current** ✓ |
| `verification` | `services` | complete | complete |
| `service_setup` | `review` | complete | complete |
| `complete` | (done) | complete | complete |

---

## Verification

After fix:
- [ ] Step 1 "About You" shows "Start" button when phase is `not_started`
- [ ] Clicking "Start" opens the BasicInfoStep form
- [ ] Completing Step 1 updates phase to `basic_info` and Step 2 becomes current
- [ ] Progress indicator shows correct step as highlighted

---

## Files to Modify

1. `src/pages/onboarding/ProfessionalOnboarding.tsx` - Fix `getStepStatus()` function

