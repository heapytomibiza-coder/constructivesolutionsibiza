

# Modal Layout Fix + Photo Lightbox + Pro Dashboard Upgrade

## Summary

This plan addresses three interconnected improvements:
1. **Fix modal scroll/footer layout** - Make the fixed action bar reliable across all viewport sizes
2. **Add photo lightbox** - Allow users to view job photos in a full-screen carousel
3. **Upgrade Pro Dashboard** - Apply the 2-column layout pattern for a more professional feel

---

## Part 1: Fix Modal Layout (Header Fixed / Body Scrolls / Footer Fixed)

### Current Issues

| Problem | Root Cause |
|---------|------------|
| Footer uses `-mx-6` negative margin hack | DialogContent has `p-6` but modal structure doesn't account for it |
| Scroll wrapper may not reliably work | Parent needs explicit height + `flex flex-col` for `flex-1` to work |
| `min-h-0` ineffective | Grid layout was causing issues (already fixed to flex) |

### Solution

Take full control of the layout by using `p-0` on DialogContent and managing padding in each section:

```text
DialogContent (p-0, h-[85vh], flex flex-col)
├── Header wrapper (shrink-0, border-b, p-6)
├── Scroll body (min-h-0, flex-1, overflow-y-auto, px-6 py-5)
└── Footer wrapper (shrink-0, border-t, px-6 py-4)
```

### Changes to JobDetailsModal.tsx

1. Update DialogContent className to `h-[85vh] max-h-[85vh] flex-col p-0 sm:max-w-3xl`
2. Wrap DialogHeader in a fixed header div with `shrink-0 border-b border-border/70 p-6`
3. Update scroll wrapper to use `min-h-0 flex-1 overflow-y-auto px-6 py-5`
4. Move footer outside scroll wrapper with `shrink-0 border-t border-border/70 px-6 py-4`
5. Remove `-mx-6` from JobDetailsActions (no longer needed)

---

## Part 2: Add Photo Lightbox

### Features

- Click thumbnail to open full-size image
- Keyboard navigation (Escape to close, Arrow keys for next/prev)
- Click backdrop to close
- Counter showing current position (1/6)
- Next/prev buttons for mouse users

### Implementation

1. Create `PhotoLightbox` component (same file, minimal dependencies)
2. Add `lightboxIndex` state to `JobDetailsBodyContent`
3. Convert photo `<img>` elements to `<button>` with click handler
4. Render lightbox conditionally when `lightboxIndex !== null`

### PhotoLightbox Component

```tsx
function PhotoLightbox({
  photos,
  index,
  onClose,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
}) {
  const [i, setI] = React.useState(index);

  React.useEffect(() => setI(index), [index]);

  const hasMany = photos.length > 1;
  const next = () => setI((x) => (x + 1) % photos.length);
  const prev = () => setI((x) => (x - 1 + photos.length) % photos.length);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!hasMany) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasMany, onClose, photos.length]);

  const src = photos[i];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      {/* Image + controls */}
    </div>
  );
}
```

---

## Part 3: Pro Dashboard Layout Upgrade

### Current State

- Single-column layout
- Stats cards in 3-column grid
- Matched jobs list below

### Target Layout

```text
Desktop (lg:grid-cols-[1.6fr_1fr])
┌────────────────────────┬─────────────────┐
│ Header (title + action)│                 │
├────────────────────────┴─────────────────┤
│ Stats row (3 columns)                    │
├────────────────────────┬─────────────────┤
│ Matched Jobs           │ Quick Actions   │
│ (scrollable list)      │ Profile Status  │
│                        │ Availability    │
└────────────────────────┴─────────────────┘

Mobile (stacked)
```

### Changes

1. Wrap main content in 2-column grid on desktop
2. Move matched jobs to left column
3. Add right column with:
   - Quick Actions card (Update Services, Edit Profile)
   - Profile completeness indicator (placeholder for now)
   - Availability toggle (placeholder for now)
4. Keep stats row above the grid (spans both columns)

### New Structure

```tsx
{/* Stats row - full width */}
<div className="grid gap-4 md:grid-cols-3 mb-6">
  {/* Existing stat cards */}
</div>

{/* Two-column layout */}
<div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
  {/* Left: Matched Jobs */}
  <Card>...</Card>

  {/* Right: Quick Actions + Status */}
  <div className="space-y-4">
    <Card>Quick Actions</Card>
    <Card>Profile Status</Card>
  </div>
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/jobs/JobDetailsModal.tsx` | Layout fix + lightbox component |
| `src/pages/dashboard/ProDashboard.tsx` | 2-column layout upgrade |

---

## Technical Details

### JobDetailsModal Layout Fix

```tsx
<DialogContent className="flex h-[85vh] max-h-[85vh] flex-col p-0 sm:max-w-3xl">
  {/* Fixed Header */}
  <div className="shrink-0 border-b border-border/70 p-6">
    <DialogHeader className="p-0">
      <DialogTitle>Job Details</DialogTitle>
    </DialogHeader>
  </div>

  {/* Scroll Body */}
  <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
    {isLoading ? ... : isError ? ... : jobPack ? (
      <JobDetailsBodyContent jobPack={jobPack} />
    ) : null}
  </div>

  {/* Fixed Footer */}
  {jobPack && (
    <div className="shrink-0 border-t border-border/70 bg-background/90 px-6 py-4 backdrop-blur">
      <JobDetailsActions jobPack={jobPack} onClose={() => onOpenChange(false)} />
    </div>
  )}
</DialogContent>
```

### JobDetailsActions Simplified

```tsx
function JobDetailsActions({ jobPack, onClose }: JobDetailsActionsProps) {
  // ... existing logic ...

  return (
    <div className="flex flex-wrap gap-2">
      {/* Buttons only - no wrapper styling */}
    </div>
  );
}
```

### Photo Thumbnails as Buttons

```tsx
<div className="grid grid-cols-3 gap-2">
  {jobPack.photos.slice(0, 6).map((url, i) => (
    <button
      key={url}
      type="button"
      className="aspect-square overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      onClick={() => setLightboxIndex(i)}
    >
      <img
        src={url}
        alt={`Job photo ${i + 1}`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </button>
  ))}
</div>
```

### Pro Dashboard 2-Column Grid

```tsx
{/* Stats row - spans full width */}
<div className="grid gap-4 md:grid-cols-3 mb-6">
  {/* Existing 3 stat cards */}
</div>

{/* Main content - 2 columns on desktop */}
<div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
  {/* Left column: Matched Jobs */}
  <Card className="border-border/70">
    {/* Existing matched jobs card content */}
  </Card>

  {/* Right column: Quick Actions + Status */}
  <div className="space-y-4">
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button className="w-full justify-start gap-2" asChild>
          <Link to="/professional/service-setup">
            <Wrench className="h-4 w-4" />
            Update Services
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2" asChild>
          <Link to="/professional/portfolio">
            <Settings className="h-4 w-4" />
            Edit Profile
          </Link>
        </Button>
      </CardContent>
    </Card>

    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Complete your profile to appear in search results.
        </div>
        {/* Future: Progress bar + checklist */}
      </CardContent>
    </Card>
  </div>
</div>
```

---

## Expected Outcome

After implementation:
- Modal footer stays visible at all times during scroll
- Header stays fixed at top of modal
- Only the body content scrolls
- No negative margin hacks needed
- Photos can be viewed full-size with keyboard navigation
- Pro Dashboard has clear visual hierarchy with 2-column layout
- Quick actions are always visible on desktop

---

## Verification Checklist

### Modal Layout
1. Footer stays visible while scrolling long content
2. Only body scrolls (not header or footer)
3. Works correctly on mobile Safari (address bar collapse)
4. Keyboard focus doesn't jump unexpectedly

### Photo Lightbox
1. Click thumbnail opens full-size image
2. Escape key closes lightbox
3. Arrow keys navigate between photos
4. Click backdrop closes lightbox
5. Counter shows correct position

### Pro Dashboard
1. 2-column layout on desktop (lg breakpoint)
2. Stacked layout on mobile
3. Quick Actions card has working links
4. Stats row spans full width above columns

