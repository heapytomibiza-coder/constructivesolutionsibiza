

# Gold+ Auto-Expand: Respect User's Manual Override

## The Problem

Current behavior is frustrating:

| User Action | Current Result | Expected Result |
|-------------|---------------|-----------------|
| Type "socket" | Electrical expands | Electrical expands |
| Click Plumbing | **Electrical re-expands!** | Plumbing stays open |
| Continue typing | **Keeps jumping back** | User's choice respected |

The effect fires on every `searchQuery` change, forcing the first match to expand even when the user explicitly chose another category.

---

## Solution: Track Manual Override

Add a `userExpandedDuringSearch` flag that:
- Sets `true` when user manually clicks a category while searching
- Prevents auto-expand while set
- Resets when search is cleared

---

## Changes Required

### File: `src/pages/onboarding/steps/ServiceUnlockStep.tsx`

| Location | Change |
|----------|--------|
| Line 35 | Add `userExpandedDuringSearch` state |
| Lines 83-90 | Update auto-expand effect to respect manual override |
| Lines 249-251 | Update `onToggle` handler to set override flag |

---

## Detailed Edits

### 1. Add Override State (after line 35)

```tsx
const [userExpandedDuringSearch, setUserExpandedDuringSearch] = useState(false);
```

### 2. Update Auto-Expand Effect (lines 83-90)

Replace the current effect with:

```tsx
// Auto-expand first matching category when searching (respects manual override)
useEffect(() => {
  if (!searchQuery) {
    // Search cleared → collapse all + reset override
    setExpandedCategoryId(null);
    setUserExpandedDuringSearch(false);
    return;
  }

  // Search active: only auto-expand if user hasn't manually toggled
  if (!userExpandedDuringSearch && firstMatchingCategoryId) {
    setExpandedCategoryId(firstMatchingCategoryId);
  }
}, [searchQuery, firstMatchingCategoryId, userExpandedDuringSearch]);
```

### 3. Update onToggle Handler (lines 249-251)

Replace:
```tsx
onToggle={() => setExpandedCategoryId(
  expandedCategoryId === category.id ? null : category.id
)}
```

With:
```tsx
onToggle={() => {
  const next = expandedCategoryId === category.id ? null : category.id;
  setExpandedCategoryId(next);
  // Mark that user manually overrode during search
  if (searchQuery) setUserExpandedDuringSearch(true);
}}
```

---

## User Experience Flow

```text
1. User types "socket"
   ┌─ Electrical ▾ ─────────────┐  ← Auto-expands (first match)
   │   ✓ Install sockets        │
   └────────────────────────────┘

2. User clicks HVAC (different category)
   ┌─ Electrical ▸ ─────────────┐
   ├─ HVAC ▾ ───────────────────┤  ← User's choice respected!
   │   (HVAC services)          │
   └────────────────────────────┘

3. User continues typing "socket repair"
   ┌─ HVAC ▾ ───────────────────┤  ← Stays on HVAC, no jump!
   └────────────────────────────┘

4. User clears search
   ┌─ Electrical ▸ ─────────────┐  ← All collapse, override resets
   ├─ HVAC ▸ ───────────────────┤
   └────────────────────────────┘

5. User types again
   ┌─ First match ▾ ────────────┐  ← Auto-expand works again
   └────────────────────────────┘
```

---

## Why This Works

| Scenario | `userExpandedDuringSearch` | Behavior |
|----------|---------------------------|----------|
| Start typing | `false` | Auto-expands first match |
| User clicks category | `true` | Auto-expand disabled |
| Keep typing | `true` (persists) | No fighting |
| Clear search | `false` (reset) | Ready for next search |
| Type again | `false` | Auto-expand works again |

---

## Verification Checklist

After implementation:
- [ ] Type "plumb" → first matching category auto-expands
- [ ] Click a different category → it stays open (no jump back)
- [ ] Continue typing → user's category choice persisted
- [ ] Clear search → all collapse, override resets
- [ ] Type new query → auto-expand works again
- [ ] No flickering or jarring transitions

---

## Files to Modify

1. `src/pages/onboarding/steps/ServiceUnlockStep.tsx`

---

## Technical Notes

- Simple boolean state is sufficient (no need for ref tracking previous search)
- Override resets when search is cleared, allowing auto-expand on next search session
- Minimal code change, maximum UX improvement
- No changes needed to `CategoryAccordion.tsx`

