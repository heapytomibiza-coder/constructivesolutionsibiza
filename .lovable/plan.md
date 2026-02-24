

# Fix: ASAP detection uses localized display string (breaks in Spanish)

## Problem

Line 233 of `JobDetailsModal.tsx`:
```typescript
const isAsap = jobPack.timing?.display?.toLowerCase().includes("asap");
```

In Spanish, `timing.display` is `"Urgente"` (not "ASAP"), so this check silently fails and the ASAP badge never appears for Spanish users.

## Fix

Replace with a data-driven check against the timing preset:
```typescript
const isAsap = jobPack.timing?.preset === "asap";
```

This is language-agnostic and matches the value stored in the database.

## Files Modified

| File | Change |
|------|--------|
| `src/pages/jobs/JobDetailsModal.tsx` | Line 233: use `preset` instead of `display` for ASAP detection |

## Note

All other suggestions from the user's message (imports, `translateStatus`, `getSpecBadge` budget check, lightbox sr-only, `buildJobPack(row, packs, t)`, all section labels, toast strings, action buttons) have already been implemented in previous passes. This is the single remaining bug.

