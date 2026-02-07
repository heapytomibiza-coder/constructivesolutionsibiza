

# Auto-Expand First Matching Category on Search

## Overview

Add "smart" auto-expand behavior that automatically opens the first category with matching results when the user starts typing in the search bar. This makes search feel intelligent and responsive without requiring manual clicks.

---

## Current Behavior

When searching:
1. User types in search bar
2. Categories with no matches are hidden
3. Matching categories stay collapsed until manually clicked
4. User must guess which category to expand

## New Behavior

When searching:
1. User types in search bar
2. Categories with no matches are hidden
3. **First matching category auto-expands**
4. User immediately sees results without extra clicks
5. Clearing search returns to previous state (all collapsed)

---

## Implementation Approach

### Logic: Find First Matching Category ID

Add a `useMemo` that finds the first category ID with search matches:

```tsx
const firstMatchingCategoryId = useMemo(() => {
  if (!searchQuery) return null;
  const q = searchQuery.toLowerCase();
  
  const match = categories.find((c) =>
    c.subcategories.some((s) =>
      s.micros.some((m) => 
        m.name.toLowerCase().includes(q) || 
        m.slug.toLowerCase().includes(q)
      )
    )
  );
  
  return match?.id ?? null;
}, [categories, searchQuery]);
```

### Logic: Auto-Expand Effect

Add a `useEffect` that expands the first match when searching:

```tsx
// Auto-expand first matching category when searching
useEffect(() => {
  if (searchQuery && firstMatchingCategoryId) {
    setExpandedCategoryId(firstMatchingCategoryId);
  } else if (!searchQuery) {
    // Collapse all when search is cleared
    setExpandedCategoryId(null);
  }
}, [searchQuery, firstMatchingCategoryId]);
```

### Edge Case Handling

| Scenario | Behavior |
|----------|----------|
| No search query | No auto-expand, manual control |
| Search with matches | First matching category expands |
| Search with no matches | Nothing to expand, empty state shown |
| User manually clicks different category | That category expands (override) |
| Search cleared | All categories collapse |

---

## Changes Required

### File: `src/pages/onboarding/steps/ServiceUnlockStep.tsx`

| Location | Change |
|----------|--------|
| After `hasAnySearchResults` memo (~line 137) | Add `firstMatchingCategoryId` memo |
| After cleanup effect (~line 64) | Add auto-expand effect |

---

## Detailed Edits

### 1. Add `firstMatchingCategoryId` Memo (after line 137)

```tsx
// Find first category with search matches for auto-expand
const firstMatchingCategoryId = useMemo(() => {
  if (!searchQuery) return null;
  const q = searchQuery.toLowerCase();
  
  const match = categories.find((c) =>
    c.subcategories.some((s) =>
      s.micros.some((m) => 
        m.name.toLowerCase().includes(q) || 
        m.slug.toLowerCase().includes(q)
      )
    )
  );
  
  return match?.id ?? null;
}, [categories, searchQuery]);
```

### 2. Add Auto-Expand Effect (after line 64)

```tsx
// Auto-expand first matching category when searching
useEffect(() => {
  if (searchQuery && firstMatchingCategoryId) {
    setExpandedCategoryId(firstMatchingCategoryId);
  } else if (!searchQuery) {
    // Collapse all when search is cleared
    setExpandedCategoryId(null);
  }
}, [searchQuery, firstMatchingCategoryId]);
```

---

## User Experience Flow

```text
1. User sees all categories collapsed
   ┌─ Electrical ▸ ─────────────┐
   ├─ Plumbing ▸ ───────────────┤
   └─ HVAC ▸ ───────────────────┘

2. User types "socket" in search
   ┌─ Electrical ▾ ─────────────┐  ← Auto-expands!
   │   ✓ Install sockets        │
   │   ✓ Socket repair          │
   └────────────────────────────┘
   
   (Other categories hidden or shown empty)

3. User clears search
   ┌─ Electrical ▸ ─────────────┐  ← All collapse
   ├─ Plumbing ▸ ───────────────┤
   └─ HVAC ▸ ───────────────────┘
```

---

## Verification Checklist

After implementation:
- [ ] Typing in search auto-expands first matching category
- [ ] Other matching categories remain collapsed (user can manually expand)
- [ ] Clearing search collapses all categories
- [ ] Manual category toggle still works during search
- [ ] No flickering or jarring transitions
- [ ] Works correctly with the existing `hasAnySearchResults` empty state

---

## Files to Modify

1. `src/pages/onboarding/steps/ServiceUnlockStep.tsx`

---

## Technical Notes

- Both memos use the same search logic for consistency
- Effect dependency array includes `firstMatchingCategoryId` which is derived from `searchQuery`
- No changes needed to `CategoryAccordion.tsx` - it already receives `isExpanded` as a prop
- This enhancement aligns with the "search feels smart" UX principle from the design spec

