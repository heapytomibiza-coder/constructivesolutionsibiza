

# Job Feed Page Implementation Plan

## Summary
Implement the job board at `/jobs` using the provided component skeletons, with minor adjustments for the cut-off `JobDetailsModal` and integration with existing `PublicLayout`.

## Files to Create (5 new files)

### 1. `src/pages/jobs/types.ts`
Type definitions for `JobLocation`, `JobAnswers`, `JobsBoardRow`, and `JobDetailsRow` as provided.

### 2. `src/pages/jobs/JobBoardPage.tsx`
Main page wrapper - will add `PublicLayout` wrapper to match existing pages like `/professionals`.

### 3. `src/pages/jobs/JobsMarketplace.tsx`
Feed container with:
- React Query fetch from `jobs_board`
- Client-side filters (search, categories, location, toggles)
- Featured/regular job split
- Grid layout with sidebar filters

### 4. `src/pages/jobs/JobListingCard.tsx`
Job card component with:
- Budget/timing display helpers
- Highlights rendering
- Click handler to open modal
- State management for selected job

### 5. `src/pages/jobs/JobDetailsModal.tsx`
Details modal that:
- Fetches from `job_details` on open
- Renders structured sections (not JSON dump):
  - Header with badges
  - Summary cards (Area, Budget, Timing)
  - Services list from `answers.selected.microNames`
  - Scope & Specifications from `answers.microAnswers`
  - Logistics from `answers.logistics`
  - Extras from `answers.extras` (notes, photos, permits)
  - Action buttons (Message disabled, Share placeholder)

## Files to Modify (3 files)

### 1. `src/app/routes/registry.ts`
Add to `publicRoutes`:
```typescript
{ path: '/jobs', access: 'public' },
```

### 2. `src/App.tsx`
Add import and route:
```typescript
import JobBoardPage from "./pages/jobs/JobBoardPage";
// In Routes:
<Route path="/jobs" element={<JobBoardPage />} />
```

### 3. `src/components/layout/PublicNav.tsx`
Add "Jobs" link between "Services" and "Professionals":
```tsx
<Link to="/jobs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
  Jobs
</Link>
```

## Component Architecture

```text
JobBoardPage
└── PublicLayout (existing wrapper)
    └── JobsMarketplace
        ├── Search + filter toggles
        ├── Featured jobs grid
        │   └── JobListingCard[]
        ├── Regular jobs grid
        │   └── JobListingCard[]
        ├── Sidebar filters
        └── JobDetailsModal (rendered once, controlled by selected job ID)
```

## Data Flow

```text
┌─────────────────────────────────────────────────────────────┐
│  JobsMarketplace                                            │
│  ┌─────────────────┐                                        │
│  │ useQuery        │──► jobs_board ──► JobsBoardRow[]       │
│  │ queryKey:       │                                        │
│  │ ["jobs_board"]  │                                        │
│  └─────────────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ applyFilters()  │──► filtered jobs                       │
│  └─────────────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │ JobListingCard  │────►│ JobDetailsModal │               │
│  │ onClick: set    │     │ useQuery        │               │
│  │ selectedJobId   │     │ queryKey:       │               │
│  └─────────────────┘     │ ["job_details", │               │
│                          │  selectedJobId] │               │
│                          └────────┬────────┘               │
│                                   │                         │
│                                   ▼                         │
│                          job_details ──► JobDetailsRow      │
│                          (includes answers JSONB)           │
└─────────────────────────────────────────────────────────────┘
```

## Key Implementation Details

### Budget Display Helper
```typescript
function formatBudget(j: JobsBoardRow): string {
  if (j.budget_type === "range" && j.budget_min != null && j.budget_max != null) {
    return `€${j.budget_min}–€${j.budget_max}`;
  }
  if (j.budget_type === "fixed" && j.budget_value != null) {
    return `€${j.budget_value}`;
  }
  return "Budget: TBD";
}
```

### Featured Jobs Predicate
```typescript
function featuredPredicate(j: JobsBoardRow): boolean {
  const recent = Date.now() - new Date(j.created_at).getTime() < 24 * 60 * 60 * 1000;
  return recent && budgetProxy(j) >= 500 && !!j.has_photos;
}
```

### Completing JobDetailsModal
The provided code was cut off at the Logistics section. I'll complete it with:
- Remaining `InfoRow` components for logistics fields
- Extras section (notes, photos grid, permits concern)
- Action buttons row (Message disabled, Share placeholder)

### Modal State Management
The `JobListingCard` will manage modal state locally:
```typescript
const [open, setOpen] = React.useState(false);
// Modal rendered inline, enabled when open && jobId exists
```

## Dependencies Used
All already installed:
- `@tanstack/react-query` - data fetching
- `date-fns` - relative time formatting
- `lucide-react` - icons (MapPin, Euro, Calendar, Image, Loader2, FilterX)
- shadcn/ui components (Card, Badge, Button, Dialog, Input, Separator)

## Implementation Order

1. Create `types.ts` (no dependencies)
2. Create `JobDetailsModal.tsx` (standalone, needs types)
3. Create `JobListingCard.tsx` (imports JobDetailsModal)
4. Create `JobsMarketplace.tsx` (imports JobListingCard)
5. Create `JobBoardPage.tsx` (imports JobsMarketplace + PublicLayout)
6. Update `registry.ts` (add route config)
7. Update `App.tsx` (add route)
8. Update `PublicNav.tsx` (add nav link)

## Post-Implementation Verification

After implementation:
1. Navigate to `/jobs` - should show job feed with 2 seeded jobs
2. Click a job card - should open detail modal
3. Verify structured sections render (not raw JSON)
4. Test filters (search, category, location, toggles)
5. Verify featured jobs logic (budget >= 500, has_photos, recent)

