

# Fix: Robust `getStepStatus()` with Backwards Compatibility

## Problem

The current `getStepStatus()` implementation is missing key phase mappings:

| Phase in DB | Current Mapping | Result |
|------------|-----------------|--------|
| `not_started` | ✅ `basic_info` | Works |
| `basic_info` | `service_area` | Works |
| `verification` | ✅ `services` | Works |
| `service_area` | ❌ Missing | Falls back to `basic_info` → **WRONG** |
| `services` | ❌ Missing | Falls back to `basic_info` → **WRONG** |
| `service_setup` | ✅ `review` | Works |
| `complete` | ✅ `done` | Works |

If someone manually sets `onboarding_phase = 'service_area'` (matching step ID), the UI breaks.

---

## Solution

Replace `getStepStatus()` with a more robust version that:
1. Uses TypeScript types for step IDs
2. Maps ALL possible phase names (current + future + legacy)
3. Has a defensive null check
4. Is well-documented

---

## File: `src/pages/onboarding/ProfessionalOnboarding.tsx`

### Changes at lines 42-63

Replace the current `getStepStatus` function with:

```tsx
type StepStatus = "complete" | "current" | "pending";

const stepOrder = ["basic_info", "service_area", "services", "review"] as const;
type StepId = (typeof stepOrder)[number];

/**
 * Returns status for a step based on onboarding phase.
 *
 * Rules:
 * - not_started => basic_info is current
 * - otherwise current step is derived from phase
 * - steps before current are complete, after are pending
 */
const getStepStatus = (stepId: StepId): StepStatus => {
  // Defensive: normalize phase just in case it comes back null/undefined
  const p = (phase ?? "not_started") as string;

  /**
   * Map a stored onboarding phase to "what step should be current now"
   * This is a "phase -> current step" mapping (not "phase -> completed step").
   */
  const phaseToCurrentStep: Record<string, StepId | "done"> = {
    // start state
    not_started: "basic_info",

    // MVP phases (matching step completion)
    basic_info: "service_area",
    service_area: "services",
    services: "review",
    review: "done",
    complete: "done",

    // Backwards-compatible aliases (if older names exist in DB)
    verification: "services",
    service_setup: "review",
  };

  const currentStepId = phaseToCurrentStep[p] ?? "basic_info";

  if (currentStepId === "done") return "complete";

  const stepIndex = stepOrder.indexOf(stepId);
  const currentIndex = stepOrder.indexOf(currentStepId);

  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) return "current";
  return "pending";
};
```

---

## Phase Mapping Table (After Fix)

| `onboarding_phase` | Current Step | Step 1 | Step 2 | Step 3 | Step 4 |
|--------------------|--------------|--------|--------|--------|--------|
| `not_started` | basic_info | **current** | pending | pending | pending |
| `basic_info` | service_area | complete | **current** | pending | pending |
| `verification` | services | complete | complete | **current** | pending |
| `service_area` | services | complete | complete | **current** | pending |
| `services` | review | complete | complete | complete | **current** |
| `service_setup` | review | complete | complete | complete | **current** |
| `review` | done | complete | complete | complete | complete |
| `complete` | done | complete | complete | complete | complete |

---

## Why This Is Better

1. **TypeScript safety** - `StepId` type prevents typos
2. **Defensive fallback** - Handles null/undefined phases
3. **Backward compatible** - Works with `verification` and `service_setup` still in DB
4. **Future proof** - Easy to add new phases if needed
5. **Well documented** - Clear comments explain the mapping logic

---

## Verification Checklist

After implementation:
- [ ] Step 1 shows "Start" when phase is `not_started`
- [ ] Completing Step 1 makes Step 2 "current"
- [ ] Progress through all steps works smoothly
- [ ] Old DB values (`verification`, `service_setup`) still work correctly

