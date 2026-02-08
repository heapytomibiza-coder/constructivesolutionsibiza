

# Plan: Living Profile — Bringing Onboarding Energy to the Edit Experience

## The Core Insight (Product Principle)

You identified something foundational: **the onboarding isn't just good UI — it's setting an emotional standard the rest of the app doesn't match.**

| Onboarding Experience | Edit Experience |
|----------------------|-----------------|
| Feels guided, supportive | Feels administrative |
| "You're doing great!" | "Update your data" |
| Touch-friendly 56px tiles | Standard form inputs |
| Gradient icons, progress bars | Plain cards, small icons |
| **Inspires confidence** | **Triggers maintenance mode** |

This is now documented as a design principle:

> *"The onboarding experience sets the emotional tone of the platform. Future editing should feel like continuing the journey, not fixing a form."*

---

## What Makes Onboarding Special (The Design DNA)

### 1. Visual Components
- **56px touch-friendly tiles** (`ZoneTile`, `MicroToggleTile`)
- **Gradient icon containers** (`bg-gradient-steel`, 14×14 rounded-xl)
- **Progress indicators** with encouraging copy ("You're doing great!")
- **Quiet autosave** with "Saved" badge flash (no modal interruption)

### 2. Emotional Architecture
- **Permission to stop**: "You don't need to select everything"
- **Progress celebration**: "Great selection!" when threshold met
- **Clear checklist**: Visual ✓ states that feel rewarding
- **Forward momentum**: "Next Step" vs just "Save"

### 3. Reusable Components (Already Built)
```text
src/pages/onboarding/components/
├── CategoryAccordion.tsx   ← Service selection UI
├── MicroToggleTile.tsx     ← 56px toggle tiles
├── ServiceSearchBar.tsx    ← Search with clear
└── index.ts

src/pages/onboarding/steps/
├── BasicInfoStep.tsx       ← Profile form with gradient header
├── ServiceAreaStep.tsx     ← Zone selection with ZoneTile
├── ServiceUnlockStep.tsx   ← Binary service picker
└── ReviewStep.tsx          ← Checklist + Go Live
```

---

## What's Missing in Edit Sections

### ProfileEdit.tsx (Currently)
- Standard `h-4 w-4` icons
- Plain Card headers
- Technical language ("Display Name *")
- No character counters with encouraging copy
- No gradient visual anchors
- Missing: Zone editing, service editing

### ProfessionalServices.tsx (Currently)
- Placeholder stub only
- "Add Service" button does nothing
- No actual service management

---

## Implementation Plan

### Phase 1: Shared Component Library
Extract onboarding components to a shared location so both onboarding and edit can use them:

```text
src/shared/components/professional/
├── GradientIconHeader.tsx     ← Reusable 14×14 gradient icon with title/desc
├── ZoneTile.tsx               ← Move from ServiceAreaStep
├── MicroToggleTile.tsx        ← Already in onboarding/components
├── CategoryAccordion.tsx      ← Already in onboarding/components
├── QuietSaveIndicator.tsx     ← "Saved" badge flash pattern
└── index.ts
```

### Phase 2: Upgrade ProfileEdit
Transform the current form-based ProfileEdit to match onboarding energy:

1. Add `GradientIconHeader` to each card section
2. Increase touch targets (larger inputs)
3. Add character counters with encouraging copy
4. Replace "Save" with "Update Profile ✓" 
5. Add quiet autosave with "Saved" flash

### Phase 3: Complete ProfessionalServices
Build out the stub with onboarding-style components:

1. Reuse `CategoryAccordion` and `MicroToggleTile`
2. Add same search bar from onboarding
3. Include "X jobs selected" progress indicator
4. Quiet autosave pattern

### Phase 4: Add Zone Editing
Create a ServiceArea section in profile management:

1. Reuse `ZoneTile` component
2. Same "Island-wide" toggle
3. Same group selection logic

### Phase 5: Optional — "Re-run Onboarding" (Dev/Demo)
Add ability to re-experience onboarding for demos:

- Button in Settings (dev mode only) or
- URL parameter: `/onboarding/professional?preview=true`

---

## File Changes Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `src/shared/components/professional/GradientIconHeader.tsx` | Reusable gradient icon + title pattern |
| Create | `src/shared/components/professional/QuietSaveIndicator.tsx` | "Saved" badge flash component |
| Move | `ZoneTile` → `src/shared/components/professional/` | Shared zone selection tile |
| Refactor | `src/pages/professional/ProfileEdit.tsx` | Upgrade to onboarding-style design |
| Implement | `src/pages/professional/ProfessionalServices.tsx` | Full service management UI |
| Create | Service area editing section in profile | Zone management for established pros |

---

## Technical Notes

### Component Reuse Strategy
The onboarding components are already well-architected. The main work is:
1. Moving them to a shared location
2. Ensuring hooks work outside onboarding context
3. Adding "edit mode" props where needed (e.g., no "onComplete" callback)

### Database Considerations
No schema changes needed — all the same tables and fields are used:
- `professional_profiles.service_zones` (zone array)
- `professional_services` (micro selections)
- `profiles.phone`, `professional_profiles.display_name`, etc.

### Estimated Scope
- Phase 1 (Shared Library): 2-3 components
- Phase 2 (ProfileEdit Upgrade): 1 file refactor
- Phase 3 (Services Page): 1 file implementation
- Phase 4 (Zone Editing): 1 section addition
- Phase 5 (Demo Access): Optional, 1 small addition

---

## Expected Outcome

After implementation, the professional journey will feel like:

> "I finished onboarding, and now my dashboard and settings feel like a continuation of that same supportive experience — not like I've been handed a clipboard and told to maintain my own paperwork."

The entire Tasker lane becomes "ongoing onboarding" with the same:
- Gradient visual anchors
- 56px touch-friendly tiles
- Encouraging copy
- Progress celebration
- Quiet autosave

