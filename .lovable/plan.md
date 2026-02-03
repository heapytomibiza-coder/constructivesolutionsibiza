
# Job Card "Construction Spec Sheet" Upgrades

## Summary

Upgrade the job listing cards to feel like professional construction spec sheets with three high-impact improvements: make cards fully clickable, add a "spec quality" indicator, and polish the highlights with proper bullet formatting.

---

## Current State

| Feature | Status |
|---------|--------|
| Accent rail on hover | Done |
| Status badges with semantic colors | Done |
| Location/Budget/Timing spec strip | Done |
| Photos badge | Done |
| ASAP badge | Missing |
| Whole card clickable | Not implemented |
| Spec quality indicator | Not implemented |
| Highlights with bullet styling | Plain text |
| Matched badge for pros | Not implemented |

---

## Implementation Plan

### 1. Make the Whole Card Clickable

Add click and keyboard handlers to the Card component, with `stopPropagation` on the View button to prevent double-firing.

```text
Before: Only "View" button opens modal
After:  Entire card is clickable, button still works independently
```

Changes:
- Add `onClick`, `onKeyDown`, `tabIndex`, `role` to Card
- Add `cursor-pointer` to card className
- Add `e.stopPropagation()` to Button onClick

### 2. Add "Spec Quality" Indicator Badge

Compute a simple score based on available data to help builders identify well-specified jobs:

```tsx
const specScore =
  (job.highlights?.length ?? 0) +
  (job.has_photos ? 2 : 0) +
  (budgetProxy(job) > 0 ? 1 : 0);

// Score thresholds:
// >= 4: "Good spec" (success badge)
// >= 2: "Basic spec" (outline badge)
// < 2:  "Needs detail" (warning badge)
```

Display as a small badge in the badges row, after status.

### 3. Add ASAP Badge

When `job.start_timing === "asap"`, show an accent-colored "ASAP" badge in the badges row (before Photos badge).

### 4. Style Highlights as a Spec List

Add bullet points to make highlights read like a proper job brief:

```tsx
// Before:
<li className="text-muted-foreground">{h}</li>

// After:
<li className="text-muted-foreground flex items-start gap-2">
  <span className="text-primary/60 mt-1.5">•</span>
  <span>{h}</span>
</li>
```

### 5. Format Status Text Properly

Add a helper to format unknown status values (replace underscores with spaces, capitalize):

```tsx
function prettyStatus(s: string | null): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
}
```

### 6. Optional: Add "Matched" Badge for Professionals

Pass a new `isMatched` prop to `JobListingCard` when rendering from the matched jobs list. This requires a small change to `JobsMarketplace.tsx` to track which view is active and pass it down.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/jobs/JobListingCard.tsx` | All card upgrades |
| `src/pages/jobs/JobsMarketplace.tsx` | Pass `isMatched` prop when in matched view |

---

## Technical Details

### JobListingCard.tsx Changes

```tsx
// New helper functions
function prettyStatus(s: string | null): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
}

function getSpecBadge(job: JobsBoardRow): { label: string; variant: "success" | "outline" | "warning" } {
  const score =
    (job.highlights?.length ?? 0) +
    (job.has_photos ? 2 : 0) +
    (budgetProxy(job) > 0 ? 1 : 0);
  
  if (score >= 4) return { label: "Good spec", variant: "success" };
  if (score >= 2) return { label: "Basic spec", variant: "outline" };
  return { label: "Needs detail", variant: "warning" };
}

// Updated component props
interface JobListingCardProps {
  job: JobsBoardRow;
  isMatched?: boolean;
}

// Updated Card with click handling
<Card 
  data-job-id={job.id} 
  role="button"
  tabIndex={0}
  onClick={() => setOpen(true)}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }}
  className="group relative overflow-hidden hover:shadow-md transition-all hover:border-accent/30 cursor-pointer"
>

// Updated Button with stopPropagation
<Button 
  onClick={(e) => {
    e.stopPropagation();
    setOpen(true);
  }} 
  variant="outline" 
  size="sm"
>
  View
</Button>

// Badge row additions (in order)
{job.category && <Badge variant="secondary">{job.category}</Badge>}
{job.subcategory && <Badge variant="outline">{job.subcategory}</Badge>}
{job.status && <Badge variant={statusVariant(job.status)}>{prettyStatus(job.status)}</Badge>}
{isMatched && <Badge variant="accent">Matched</Badge>}
{job.start_timing === "asap" && <Badge variant="accent">ASAP</Badge>}
<Badge variant={specBadge.variant}>{specBadge.label}</Badge>
<JobFlagBadges ... />
{job.has_photos && <Badge variant="outline" className="gap-1">...</Badge>}

// Updated highlights with bullets
<ul className="grid gap-1.5 text-sm">
  {job.highlights.slice(0, 5).map((h, idx) => (
    <li key={`${job.id}-h-${idx}`} className="text-muted-foreground flex items-start gap-2">
      <span className="text-primary/60 mt-0.5">•</span>
      <span>{h}</span>
    </li>
  ))}
</ul>
```

### JobsMarketplace.tsx Changes

```tsx
// In featured jobs mapping
{featured.map((job) => (
  <JobListingCard key={job.id} job={job} isMatched={showMatchedOnly && isProfessional} />
))}

// In regular jobs mapping
{regular.map((job) => (
  <JobListingCard key={job.id} job={job} isMatched={showMatchedOnly && isProfessional} />
))}
```

---

## Expected Outcome

After implementation:
- Builders can click anywhere on the card to view details
- Spec quality badge helps identify serious vs vague jobs at a glance
- ASAP badge provides urgency signal
- Highlights read like a proper job brief
- Professionals see "Matched" badge when viewing their matched jobs
- Status text is human-readable (no underscores)

---

## Verification Checklist

1. Card click opens modal correctly
2. Pressing Enter/Space on focused card opens modal
3. "View" button still works independently
4. "Good spec" badge shows for jobs with photos + highlights + budget
5. "ASAP" badge shows with accent color for urgent jobs
6. "Matched" badge appears only in matched view for professionals
7. Highlights have consistent bullet styling
8. Status badges show formatted text (e.g., "In progress" not "in_progress")
