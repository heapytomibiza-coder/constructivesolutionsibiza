
# Plan: Apply Design System to Professional Onboarding Wizard

## Current Issues

The onboarding wizard components I created have basic functionality but don't fully match the platform's "construction-grade professional" visual identity. Key gaps:

1. **Missing expressive animations** - IntentSelector uses staggered `animate-slide-up`; onboarding steps don't
2. **Basic checkboxes instead of TileOption cards** - ServiceAreaStep uses plain checkboxes; should use touch-friendly tile cards with 48px min height
3. **No gradient icon containers** - IntentSelector uses gradient backgrounds for icons; onboarding steps have plain icons
4. **Missing selection glow effects** - IntentSelector has `shadow-glow` on selected; zone tiles don't
5. **Form inputs lack warmth** - Plain inputs without the rounded-sm "industrial" styling
6. **Progress bar lacks accent treatment**

---

## Design Patterns to Apply

Based on existing components:

| Pattern | Source | Apply To |
|---------|--------|----------|
| Staggered entrance animations | IntentSelector | Step tracker cards, zone tiles |
| Gradient icon containers | IntentSelector | Card headers, step icons |
| TileOption selection cards | LogisticsStep | Zone selection in ServiceAreaStep |
| shadow-glow on selection | IntentSelector | Selected zones, current step |
| 48px min touch targets | TileOption | All interactive elements |
| card-grounded with inset shadow | Platform standard | Already using - keep |
| font-display for headings | Platform standard | Already using - keep |

---

## File-by-File Changes

### 1. BasicInfoStep.tsx

**Header Enhancement:**
- Add gradient icon container (like IntentSelector) for the User icon
- Use `bg-gradient-steel` background with white icon

**Form Field Styling:**
- Keep current structure but add subtle focus states
- Add character count with accent color when near limit

**Button Enhancement:**
- Primary button already uses gradient - keep
- Add subtle hover scale effect

### 2. ServiceAreaStep.tsx

**Major Refactor: Replace Checkboxes with TileOption Pattern**

Replace the checkbox-based zone selection with proper tile cards that:
- Have 48px minimum height
- Show checkmark icon on selection (like TileOption)
- Use `border-2 border-primary` when selected
- Apply `shadow-glow` when selected
- Animate on entry with staggered delays

**Island-wide Toggle:**
- Convert to a featured TileOption with accent gradient
- Make it visually distinct as the "quick select all" option

**Zone Group Headers:**
- Add subtle divider styling
- Make "Select all" button more visible

### 3. ProfessionalOnboarding.tsx (Tracker View)

**Step Cards Enhancement:**
- Add staggered animation delays (like IntentSelector)
- Use gradient icon containers for step icons
- Enhanced selection state with scale transform and glow

**Progress Card:**
- Add steel gradient accent to progress bar fill
- Animate progress changes smoothly

---

## Visual Specifications

### Tile Selection States

```text
UNSELECTED:
┌─────────────────────────────┐
│ ○ Zone Name                 │  bg-muted/30, border-border
└─────────────────────────────┘

SELECTED:
┌─────────────────────────────┐
│ ✓ Zone Name                 │  bg-primary/5, border-primary, shadow-glow
└─────────────────────────────┘  + slight scale(1.02)
```

### Step Card States (Tracker)

```text
PENDING:
┌──────────────────────────────────────────────┐
│ [○] Step Name                                │  opacity-60, no interaction
│     Description                              │
└──────────────────────────────────────────────┘

CURRENT:
┌──────────────────────────────────────────────┐
│ [gradient icon] Step Name      [Start ▶]    │  border-primary, ring-1, shadow-glow
│                 Description                  │
└──────────────────────────────────────────────┘

COMPLETE:
┌──────────────────────────────────────────────┐
│ [✓] Step Name                  [Edit ▶]     │  success checkmark
│     Description                              │
└──────────────────────────────────────────────┘
```

### Header Icons (Gradient Containers)

```tsx
<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-steel shadow-md">
  <User className="h-5 w-5 text-white" />
</div>
```

---

## Implementation Order

1. **ServiceAreaStep.tsx** - Replace checkbox tiles with proper TileOption-style cards
2. **BasicInfoStep.tsx** - Add gradient icon container and refined styling  
3. **ProfessionalOnboarding.tsx** - Add animations and enhanced step cards

---

## Technical Notes

- Reuse the existing `TileOption` component from `src/components/wizard/canonical/steps/logistics/TileOption.tsx` where possible
- Apply `animate-slide-up` with `animationDelay` like IntentSelector does
- Use `shadow-glow` CSS variable (already defined in index.css)
- Maintain 48px minimum touch targets for mobile accessibility
- Keep existing form validation logic unchanged
