

# Job Board Quality Fix Plan

## Summary
Fix the StatsBar to reflect filtered data so users see accurate stats that match the jobs currently displayed.

## The Problem
When a user applies filters (e.g., "High budget" or searches for "plumbing"), the stats bar still shows totals from ALL jobs instead of the filtered subset. This makes the UI feel disconnected and confusing.

**Example:**  
- Total jobs: 50
- User filters to "Electrical" category: 8 jobs shown
- Stats bar still says "50 Active jobs" instead of "8 Active jobs"

## The Fix
Update `JobsMarketplace.tsx` to compute stats from the `filtered` array instead of the raw `jobs` array.

## File to Modify

**src/pages/jobs/JobsMarketplace.tsx**

### Current Code (lines 83-92)
```typescript
// Compute stats
const activeJobs = jobs?.length ?? 0;
const todayJobs = React.useMemo(
  () => (jobs ?? []).filter((j) => isNewToday(j.created_at)).length,
  [jobs]
);
const totalBudget = React.useMemo(
  () => (jobs ?? []).reduce((sum, j) => sum + budgetProxy(j), 0),
  [jobs]
);
```

### Updated Code
```typescript
// Compute stats from filtered jobs (so stats match what user sees)
const activeJobs = filtered.length;
const todayJobs = React.useMemo(
  () => filtered.filter((j) => isNewToday(j.created_at)).length,
  [filtered]
);
const totalBudget = React.useMemo(
  () => filtered.reduce((sum, j) => sum + budgetProxy(j), 0),
  [filtered]
);
```

## What's Already Working

| Component | Status |
|-----------|--------|
| Wizard query invalidation | Correct - uses `['jobs_board']` |
| ASAP filter | Works - `start_timing` is typed in `JobsBoardRow` |
| FiltersPanel types | Correct - `React.Dispatch<React.SetStateAction<Filters>>` |
| HeroToggles type | Correct - matches filter keys |
| Query key consistency | Correct - both use `["jobs_board"]` |

## Post-Fix Test Checklist

1. Navigate to `/jobs` and note the stats
2. Apply a filter (e.g., click "High budget")
3. Verify stats update to reflect only matching jobs
4. Clear filters and verify stats return to totals
5. Post a job via wizard and verify it appears without refresh

