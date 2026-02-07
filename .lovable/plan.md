

# Polish: Apply "Gold" Version Refinements to Onboarding Components

## Overview

The current components are **95% complete and functional**. This plan applies the final polish from the "gold" version to ensure the UI is idiot-proof and slick.

---

## Changes Summary

| File | Change | Impact |
|------|--------|--------|
| `MicroToggleTile.tsx` | Add `+` indicator on unselected tiles | Clearer affordance that tiles are additive |
| `ServiceUnlockStep.tsx` | Extract `flashSaved` to `useCallback` | Cleaner timer management, no memory leaks |
| `ServiceUnlockStep.tsx` | Memoize `hasAnySearchResults` | Cleaner code, better performance |

---

## Detailed Changes

### 1. MicroToggleTile.tsx - Add `+` Indicator

**Current behavior:** Unselected tiles show nothing on the right side, only showing a checkmark when selected.

**New behavior:** Unselected tiles show a muted `+` symbol, making it crystal clear that clicking will add this service.

```tsx
// Unselected: shows + in muted circle
// Selected: shows ✓ in primary circle
<span className={cn(
  "ml-3 inline-flex h-6 w-6 items-center justify-center rounded-full transition",
  isSelected 
    ? "bg-primary text-primary-foreground" 
    : "bg-muted text-muted-foreground"
)}>
  {isSelected ? <Check className="h-4 w-4" /> : <span className="text-xs">+</span>}
</span>
```

Also adds a subtle ring effect on first selection:
```tsx
{isSelected && isFirstSelection && (
  <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-primary/40" />
)}
```

---

### 2. ServiceUnlockStep.tsx - Clean `flashSaved` Pattern

**Current:** Timer is created inline in each handler, could leak on unmount.

**New:** Extract to `useCallback` with proper pattern:
```tsx
const flashSaved = useCallback(() => {
  setShowSaved(true);
  window.setTimeout(() => setShowSaved(false), 1200);
}, []);
```

Then use `flashSaved()` in handlers instead of repeating the timer logic.

---

### 3. ServiceUnlockStep.tsx - Memoize Search Results Check

**Current:** Complex nested `.every()` check inline in JSX.

**New:** Memoized for clarity:
```tsx
const hasAnySearchResults = useMemo(() => {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return categories.some((c) =>
    c.subcategories.some((s) =>
      s.micros.some((m) => 
        m.name.toLowerCase().includes(q) || 
        m.slug.toLowerCase().includes(q)
      )
    )
  );
}, [categories, searchQuery]);
```

---

## Verification Checklist

After implementation, verify:

- [ ] Unselected tiles show a `+` symbol on the right
- [ ] Selected tiles show a `✓` checkmark on the right
- [ ] First selection has subtle ring animation
- [ ] "Saved ✓" appears quietly and disappears after ~1.2s
- [ ] Search filters categories correctly
- [ ] "No jobs found" message appears when search has no results
- [ ] Category shows `✓ X` badge when collapsed with selections
- [ ] Category shows progress bar only when selections > 0
- [ ] Continue button disabled until at least 1 selected
- [ ] All touch targets are 48px minimum height

---

## Files to Modify

1. `src/pages/onboarding/components/MicroToggleTile.tsx`
2. `src/pages/onboarding/steps/ServiceUnlockStep.tsx`

---

## Technical Notes

- All CSS animations already exist in `index.css`
- Hook signature is already correct: `toggleService({ microId, isSelected })`
- No database changes required
- No new dependencies needed

