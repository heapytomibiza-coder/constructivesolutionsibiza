

## Refinements: Add `isPreferenceUpdating` Prop + Edit Mode Helper Text

Based on your feedback, there are two small fixes needed to fully complete the preference system implementation.

---

### Issue 1: Missing `isPreferenceUpdating` Prop

**Current state:** `CategoryAccordion` doesn't accept or pass `isPreferenceUpdating` to the preference tile, so users can spam preference changes during a mutation.

**Fix:** Add the prop to CategoryAccordion interface and wire it through to `MicroToggleTileWithPreference`.

---

### Issue 2: Static Helper Text

**Current state:** The bulk actions bar always shows "Tap any job you're happy to do" even in edit mode.

**Fix:** Show contextual text based on mode:
- **Normal mode:** "Tap any job you're happy to do"
- **Edit mode:** "Tap a selected job to set priority"

---

### Technical Changes

**File: `src/pages/onboarding/components/CategoryAccordion.tsx`**

1. Add `isPreferenceUpdating?: boolean` to `CategoryAccordionProps` interface
2. Add it to the destructured props with default `false`
3. Pass it to `MicroToggleTileWithPreference`
4. Update helper text to be conditional on `showPreferences`

```typescript
// In interface
isPreferenceUpdating?: boolean;

// In destructured props
isPreferenceUpdating = false,

// In MicroToggleTileWithPreference
isPreferenceUpdating={isPreferenceUpdating}

// Helper text
{showPreferences 
  ? "Tap a selected job to set priority" 
  : "Tap any job you're happy to do"}
```

---

### Files Changed

| File | Changes |
|------|---------|
| `src/pages/onboarding/components/CategoryAccordion.tsx` | Add `isPreferenceUpdating` prop + conditional helper text |
| `src/pages/onboarding/steps/ServiceUnlockStep.tsx` | Pass `isUpdatingPreference` to CategoryAccordion |

---

### Behaviour After Fix

- Preference pill becomes disabled while mutation is pending (prevents spam clicks)
- Edit mode shows "Tap a selected job to set priority" for clearer UX
- Normal onboarding shows "Tap any job you're happy to do" (unchanged)

