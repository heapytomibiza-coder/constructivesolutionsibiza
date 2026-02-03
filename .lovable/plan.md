
# Job Board Layout Components Integration

## Summary

Wire the new reusable layout components (`PageHeader`, `StatTile`, `EmptyState`) into the Job Board to complete the construction-grade polish. This consolidates the design system and eliminates inline styling duplication.

---

## Current State

| Component | Status |
|-----------|--------|
| `PageHeader` | Created, not used in JobBoardPage |
| `StatTile` | Created, not used (manual cards in JobBoardStatsBar) |
| `EmptyState` | Created, not used (inline div in JobsMarketplace) |
| `JobBoardPage` | Uses hardcoded header instead of PageHeader |
| `JobBoardStatsBar` | Manual Card implementation, doesn't use StatTile |
| `JobsMarketplace` | Uses inline empty state div |

---

## Implementation Plan

### 1. Update JobBoardPage.tsx

Replace the hardcoded header with `PageHeader` component:

```text
Before: Inline div with h1, p, border-b, bg-gradient-concrete
After:  <PageHeader title="..." subtitle="..." action={CTA} trustBadge="..." />
```

Add a "Post a Job" CTA button in the action slot using `variant="accent"`.

### 2. Update JobBoardStatsBar.tsx to use StatTile

Replace the 3 manual Card implementations with StatTile:

```text
Before: 3 inline Card + CardContent blocks with hardcoded styling
After:  3 StatTile components with iconClassName for color variants
```

Benefits:
- Icon containers use `rounded-sm` (construction-grade)
- Consistent spacing across all stat displays
- "New" badge support built-in for todayJobs

### 3. Update JobsMarketplace.tsx to use EmptyState

Replace the inline empty state div (lines 267-279) with the `EmptyState` component:

```text
Before: <div className="rounded-xl border p-6 ...">No jobs match...</div>
After:  <EmptyState icon={...} message="..." action={...} />
```

Two scenarios to handle:
- **Matched filter active**: Show "No matched jobs" + link to view all
- **Regular filter**: Show "No jobs match your filters" + clear filters button

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/jobs/JobBoardPage.tsx` | Replace inline header with PageHeader |
| `src/pages/jobs/components/JobBoardStatsBar.tsx` | Replace inline Cards with StatTile |
| `src/pages/jobs/JobsMarketplace.tsx` | Replace inline empty div with EmptyState |

---

## Technical Details

### PageHeader Integration

```tsx
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// In component:
const navigate = useNavigate();

<PageHeader
  title="Job Board"
  subtitle="Browse open jobs with full specs from the wizard."
  trustBadge="Real specs • Less back-and-forth • Ibiza only"
  action={
    <Button variant="accent" onClick={() => navigate("/post")}>
      Post a Job
    </Button>
  }
/>
```

### StatTile in JobBoardStatsBar

```tsx
import { StatTile } from "@/components/ui/stat-tile";
import { Briefcase, Clock, Euro } from "lucide-react";

<div className="grid grid-cols-3 gap-3 mb-6">
  <StatTile
    icon={<Briefcase className="h-5 w-5 text-primary" />}
    iconClassName="bg-primary/10"
    label="Active jobs"
    value={activeJobs}
  />
  <StatTile
    icon={<Clock className="h-5 w-5 text-amber-500" />}
    iconClassName="bg-amber-500/10"
    label="Posted today"
    value={todayJobs}
    isNew={todayJobs > 0}
  />
  <StatTile
    icon={<Euro className="h-5 w-5 text-green-500" />}
    iconClassName="bg-green-500/10"
    label="Total budget"
    value={`€${Math.round(totalBudget).toLocaleString()}`}
  />
</div>
```

### EmptyState in JobsMarketplace

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { Search } from "lucide-react";

// For matched jobs scenario:
<EmptyState
  icon={<Search className="h-8 w-8" />}
  message="No matched jobs found."
  action={
    <Button variant="link" className="p-0 h-auto" onClick={toggleMatchedFilter}>
      View all jobs
    </Button>
  }
/>

// For filter scenario:
<EmptyState
  icon={<Search className="h-8 w-8" />}
  message="No jobs match your filters. Try removing some filters or searching a broader term."
  action={
    <Button variant="outline" onClick={clearFilters}>
      Clear filters
    </Button>
  }
/>
```

---

## Expected Outcome

After implementation:
- Job Board uses consistent `PageHeader` with trust badge and accent CTA
- Stats bar uses `StatTile` with construction-grade `rounded-sm` icons
- Empty states guide users to action with professional styling
- No more inline styling duplication
- Design system components are validated in a high-visibility context

---

## Verification Checklist

1. `/jobs` page header matches construction-grade styling
2. Stats row shows "New" badge when todayJobs > 0
3. Empty state appears when filters return 0 results
4. "Post a Job" button uses accent variant
5. All icon containers use `rounded-sm` (not rounded-full)
