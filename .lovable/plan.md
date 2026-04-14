

## Verification Result: Two Bugs Still Live

### Check 1 — Fallback Matching: ❌ STILL BROKEN
Line 46 queries `.eq('slug', subcategorySlug)` and line 59 queries `.eq('slug', categorySlug)`. Jobs store display names (e.g. `"Handyman & General"`), not slugs (`"handyman-general"`). The resolver never finds a match.

### Check 2 — `?posted=1`: ❌ STILL BROKEN  
No `useEffect` or `history.replaceState` exists. The param persists on refresh, reopening the interstitial every time.

### Check 3 — Core Journey UI: ✅ PASS
Button labels, interstitial layout, and empty-state messaging are correct in the code.

### Check 4 — Build: ✅ CURRENT
Code matches what's deployed — the issue is the fixes were never written to the file.

---

## Fix (single file: `src/pages/dashboard/client/MatchAndSend.tsx`)

### Fix 1: Query by `name` instead of `slug`

**Line 46**: `.eq('slug', subcategorySlug)` → `.eq('name', subcategorySlug)`  
**Line 59**: `.eq('slug', categorySlug)` → `.eq('name', categorySlug)`

### Fix 2: Add `useEffect` to clear `?posted=1`

**Line 16**: Add `useEffect` to the import from `react`  
**After line 80**: Add:
```ts
useEffect(() => {
  if (fromPost) {
    const url = new URL(window.location.href);
    url.searchParams.delete('posted');
    window.history.replaceState({}, '', url.toString());
  }
}, []);
```

### Files changed
| File | Change |
|------|--------|
| `src/pages/dashboard/client/MatchAndSend.tsx` | Two `.eq('slug')` → `.eq('name')`, add `useEffect` to clear URL param |

No other files affected. Both fixes are minimal and safe.

