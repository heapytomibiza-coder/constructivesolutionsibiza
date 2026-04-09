

# Plan: Polish Resilient Query + Recovery UI

Six targeted fixes based on the user's feedback. No new features — just tightening existing logic.

## Changes

### 1. Fix stale `retryCount` race in `useResilientQuery.ts`

Replace the current `manualRetry` with a functional state update to avoid race conditions on rapid clicks:

```typescript
const manualRetry = useCallback(() => {
  setRetryCount(prev => {
    const next = prev + 1;
    trackEvent('wizard_retry_pressed', 'client', {
      step: stepName,
      retry_count: next,
    });
    if (next < 2) {
      query.refetch();
    }
    return next;
  });
}, [stepName, query]);
```

### 2. Replace `JSON.stringify(queryKey)` with stable reset key

```typescript
const resetKey = Array.isArray(queryKey) ? queryKey.join('|') : String(queryKey);

useEffect(() => {
  timeoutFiredRef.current = false;
  setTimedOut(false);
  setRetryCount(0);
}, [resetKey]);
```

### 3. Remove auto-skip on `retryCount >= 2` from SubcategorySelector and MicroStep

The auto-skip effect that fires when `retryCount >= 2` is redundant — the user always clicks "Keep going" explicitly at `retryCount >= 1`. Remove those `useEffect` blocks entirely. Recovery is user-driven only.

### 4. Render based on `hasOptions` not `isError` in SubcategorySelector and MicroStep

Change the condition from `(isError || filtered.length === 0) && !isLoading` to just `!hasOptions && !isLoading` after computing `const hasOptions = filtered.length > 0`. This prevents swallowing future Plan B fallback data.

### 5. Disable retry buttons while refetching

Add `disabled={query.isFetching}` and a loading indicator to retry buttons in CategorySelector, SubcategorySelector, and MicroStep to prevent click-spam.

### 6. Attach `_pack_source` tracking metadata in QuestionsStep

Already implemented — the `determinePackTracking` function writes `_pack_source`, `_pack_slug`, and `_pack_missing` into answers. No change needed here, just confirming it's covered.

## Files to Edit

| File | Change |
|---|---|
| `useResilientQuery.ts` | Fix manualRetry race, replace JSON.stringify reset key, expose `isFetching` |
| `SubcategorySelector.tsx` | Remove auto-skip effect, use `hasOptions` condition, disable button while fetching |
| `MicroStep.tsx` | Same as SubcategorySelector |
| `CategorySelector.tsx` | Disable button while fetching |

No database or edge function changes.

