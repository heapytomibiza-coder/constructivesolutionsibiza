

## Add 3-State Preference Selector to Edit Mode

### What You Want

- **Onboarding**: Keep it binary (IN/OUT) - fast, no friction
- **Edit Mode**: Add a preference dropdown for selected services - shows ranking power without visual noise
- **3 states only**: Love (push first) / Like (happy to receive) / Neutral (available if needed)
- **No Avoid**: If they don't want it, they just untick it

### How It Will Look

When in edit mode (`?edit=1`), selected tiles show a preference pill:

```text
┌────────────────────────────────────────────────────────────────────┐
│ [ ✓ ] Pipe Repairs                              Neutral ▾   [✓]  │
│ [ ✓ ] Drain Unblocking                          Like ▾      [✓]  │
│ [ ✓ ] Boiler Service                            ❤️ Love ▾   [✓]  │
│ [   ] Emergency Callouts                                    [+]  │
└────────────────────────────────────────────────────────────────────┘
```

Tap the pill → opens dropdown:
- ❤️ Love - Push these to me first
- 👍 Like - Happy to receive  
- ◻ Neutral - I'll do it if available

### Technical Implementation

---

**Step 1: Create PreferencePill Component**

New file: `src/pages/onboarding/components/PreferencePill.tsx`

A small dropdown button that shows current preference and allows changing it:

```typescript
type Preference = 'love' | 'like' | 'neutral';

const PREFERENCE_OPTIONS: Record<Preference, { icon: string; label: string; color: string }> = {
  love: { icon: '❤️', label: 'Love', color: 'text-destructive' },
  like: { icon: '👍', label: 'Like', color: 'text-primary' },
  neutral: { icon: '◻', label: 'Neutral', color: 'text-muted-foreground' },
};
```

Uses Popover for the dropdown menu. Calls `onPreferenceChange(preference)` when selected.

---

**Step 2: Create Extended MicroToggleTile for Edit Mode**

New file: `src/pages/onboarding/components/MicroToggleTileWithPreference.tsx`

Extends `MicroToggleTile` to show preference pill when:
- `showPreference={true}` prop is passed
- The tile is selected

```typescript
interface MicroToggleTileWithPreferenceProps extends MicroToggleTileProps {
  showPreference?: boolean;
  preference?: Preference;
  onPreferenceChange?: (preference: Preference) => void;
}
```

When `showPreference && isSelected`, renders the PreferencePill between the name and the checkmark.

---

**Step 3: Add Preference Hook**

New file: `src/pages/onboarding/hooks/useMicroPreferences.ts`

```typescript
export function useMicroPreferences() {
  // Fetch current preferences from professional_micro_preferences
  const preferencesQuery = useQuery({...});
  
  // Update preference mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ microId, preference }) => {
      await supabase
        .from('professional_micro_preferences')
        .upsert({ user_id, micro_id: microId, preference });
    }
  });
  
  return {
    preferences: Map<string, Preference>, // microId -> preference
    updatePreference: (microId, preference) => void,
    isUpdating: boolean
  };
}
```

---

**Step 4: Update CategoryAccordion**

Modify: `src/pages/onboarding/components/CategoryAccordion.tsx`

Add new props:
```typescript
interface CategoryAccordionProps {
  // ... existing props
  showPreferences?: boolean;
  preferences?: Map<string, Preference>;
  onPreferenceChange?: (microId: string, preference: Preference) => void;
}
```

When `showPreferences` is true, use `MicroToggleTileWithPreference` instead of `MicroToggleTile` and pass through the preference data.

---

**Step 5: Update ServiceUnlockStep**

Modify: `src/pages/onboarding/steps/ServiceUnlockStep.tsx`

Add props to detect edit mode:
```typescript
interface ServiceUnlockStepProps {
  onComplete: () => void;
  onBack: () => void;
  editMode?: boolean;  // New prop
}
```

When `editMode`:
- Import and use `useMicroPreferences` hook
- Pass `showPreferences={true}` to CategoryAccordion
- Pass preferences map and change handler

---

**Step 6: Pass editMode from ProfessionalOnboarding**

Modify: `src/pages/onboarding/ProfessionalOnboarding.tsx`

The wizard already detects `editMode` from URL params. Pass it down:

```typescript
{currentStep === 'services' && (
  <ServiceUnlockStep
    onComplete={handleServicesComplete}
    onBack={() => setCurrentStep('service_area')}
    editMode={editMode}  // Add this
  />
)}
```

---

**Step 7: Remove "Avoid" from Database Schema**

The `professional_micro_preferences.preference` column currently allows any text value. The matching scores view already handles love/like/neutral. No schema change needed - just don't offer "avoid" in the UI.

---

### Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/onboarding/components/PreferencePill.tsx` | Create | 3-option dropdown pill component |
| `src/pages/onboarding/components/MicroToggleTileWithPreference.tsx` | Create | Extended tile with preference support |
| `src/pages/onboarding/hooks/useMicroPreferences.ts` | Create | Hook for preference CRUD |
| `src/pages/onboarding/components/CategoryAccordion.tsx` | Modify | Add preference props + conditional tile |
| `src/pages/onboarding/steps/ServiceUnlockStep.tsx` | Modify | Add editMode prop + preference integration |
| `src/pages/onboarding/ProfessionalOnboarding.tsx` | Modify | Pass editMode to ServiceUnlockStep |
| `src/pages/onboarding/components/index.ts` | Modify | Export new components |
| `src/pages/onboarding/hooks/index.ts` | Modify | Export new hook |

---

### Matching Logic (Already Works)

The `professional_matching_scores` view already calculates:
- love = 30 points
- like = 15 points (needs to be added to view)
- neutral = 10 points

The matching query orders by `match_score DESC`, so pros who love a job type get shown first.

---

### Result

**During Onboarding:**
- Binary selection (unchanged)
- Fast, friendly, no decisions
- Services created with `preference = 'neutral'` default

**In Edit Mode:**
- Same beautiful tiles
- Small preference pill appears on selected items
- Tap pill → choose Love/Like/Neutral
- Autosaves immediately with "Saved" badge
- Matching algorithm uses preferences to rank pros

**User Experience:**
- "I'd do this job to help out if I'm available" = Neutral
- "This is my specialty, send me these first" = Love
- "Happy to take these" = Like

