# Binary Micro-Category Onboarding - IMPLEMENTED

## Status: ✅ Complete

The professional onboarding now uses a binary IN/OUT toggle system for micro-service selection.

---

## Core Principle

**"This is not a form. This is a catalogue."**

Every micro-service is a simple toggle:
- **IN** = Row in `professional_services` → receives job matches
- **OUT** = No row → no matches for this job type

---

## Implementation Summary

### Components Created

| Component | Location | Purpose |
|-----------|----------|---------|
| `ServiceUnlockStep` | `src/pages/onboarding/steps/` | Main accordion wizard with search, progress, binary toggles |
| `CategoryAccordion` | `src/pages/onboarding/components/` | Collapsible category with completion bar and bulk actions |
| `MicroToggleTile` | `src/pages/onboarding/components/` | 48px touch-friendly toggle tile |
| `ServiceSearchBar` | `src/pages/onboarding/components/` | Debounced search filter |
| `ReviewStep` | `src/pages/onboarding/steps/` | Go Live checklist with selected jobs preview |

### Hooks Created

| Hook | Location | Purpose |
|------|----------|---------|
| `useServiceTaxonomy` | `src/pages/onboarding/hooks/` | Fetches full category→subcategory→micro tree |
| `useProfessionalServices` | `src/pages/onboarding/hooks/` | Manages binary selections with optimistic updates |

---

## UX Features

### Progressive Disclosure
- 16 category accordions (collapsed by default)
- Subcategories as soft section headers within
- Never show all 296 micros at once

### Completion Cues
- Category cards show: name, total count, selected count, completion bar
- Header shows: total selected, progress bar, "Saved ✓" indicator

### Permission to Stop
- Strategic messaging: "Most professionals select 5–15 services"
- "You don't need to select everything"
- "You can always add more later"

### Search Without Breaking Context
- Results grouped under category labels
- Clear search returns to previous state

### Autosave Without Anxiety
- Quiet "Saved ✓" badge (no toast)
- Fades out automatically after 1.2s

---

## Database

Uses existing `professional_services` table (binary truth):
```sql
-- Toggle ON: insert row
INSERT INTO professional_services (user_id, micro_id, status)
VALUES (user_id, micro_id, 'offered')
ON CONFLICT (user_id, micro_id) DO NOTHING;

-- Toggle OFF: delete row
DELETE FROM professional_services
WHERE user_id = :user_id AND micro_id = :micro_id;
```

Matching algorithm unchanged - already uses `professional_services.micro_id`.

---

## Go Live Requirements

```typescript
const canGoLive = 
  displayName?.trim() !== '' &&
  phone?.trim() !== '' &&
  serviceZones.length > 0 &&
  selectedMicroIds.size >= 1;
```

On Go Live:
```sql
UPDATE professional_profiles 
SET profile_status = 'live',
    onboarding_phase = 'complete',
    submitted_at = NOW()
WHERE user_id = auth.uid();
```

---

## Onboarding Flow

1. **Basic Info** → Name, phone, bio
2. **Service Area** → Zone selection
3. **Services** → Binary tile selector (this implementation)
4. **Review & Go Live** → Checklist + confirmation

---

## Future Enhancements (V2)

- [ ] Tooltip on tiles for job descriptions
- [ ] First-time bulk action confirmation microcopy
- [ ] Number tween animation on count changes
- [ ] Category tick badge when at least one selected
