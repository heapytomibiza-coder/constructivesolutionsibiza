

# Design System Refinement: Construction-Grade Polish

## Current State Assessment

After reviewing the codebase, the implementation is **actually solid**:
- No broken JSX or `return ;` placeholders
- No dangerous global `span` styles
- No Tailwind config pasted inside button.tsx
- All components compile correctly

**However**, the user's feedback highlights valid UX concerns that need addressing:

### Issues to Fix

1. **Button `outline` variant** uses `hover:bg-accent` which makes outline buttons look like CTAs on hover
2. **Missing reusable layout components** (PageHeader, StatTile, EmptyState)
3. **fontWeight extension in tailwind.config** uses non-standard string keys (`display: '600'`) instead of numeric
4. **Accent variant** is used inconsistently - should be reserved for Post Job / ASAP / Urgent only

---

## Implementation Plan

### Phase 1: Fix Button Hover Behavior

**File**: `src/components/ui/button.tsx`

**Change**: `outline` variant should hover to muted concrete, not accent clay

```text
Current:  hover:bg-accent hover:text-accent-foreground hover:border-accent
Fixed:    hover:bg-muted/60 hover:text-foreground hover:border-border
```

**Change**: `ghost` variant should also use muted, not accent

```text
Current:  hover:bg-accent/10 hover:text-accent-foreground  
Fixed:    hover:bg-muted/60 hover:text-foreground
```

This keeps accent reserved for intentional CTAs (Post Job, ASAP urgency).

---

### Phase 2: Fix Tailwind Config

**File**: `tailwind.config.ts`

**Remove** the non-standard fontWeight extension:
```typescript
// Remove this - doesn't work as expected
fontWeight: {
  display: '600',
  'display-bold': '700',
},
```

Use standard Tailwind classes (`font-semibold`, `font-bold`) instead.

---

### Phase 3: Create Reusable Layout Components

These ensure every page feels consistent without copy-pasting styles.

#### 3.1 PageHeader Component

**File**: `src/components/layout/PageHeader.tsx`

A standardized page header with:
- Title (h1 with display font)
- Optional subtitle
- Optional right-side action slot
- Optional trust badge

```text
Usage: 
<PageHeader 
  title="Job Board" 
  subtitle="Browse open jobs with full specs" 
  action={<Button>Post a Job</Button>}
/>
```

#### 3.2 StatTile Component

**File**: `src/components/ui/stat-tile.tsx`

Dashboard stats with:
- Icon circle
- Label
- Big number
- Optional "new" indicator

```text
Usage:
<StatTile 
  icon={<Briefcase />} 
  label="Active Jobs" 
  value={12} 
  isNew 
/>
```

#### 3.3 EmptyState Component

**File**: `src/components/ui/empty-state.tsx`

Consistent empty state with:
- Icon
- Message
- CTA button

```text
Usage:
<EmptyState 
  icon={<Inbox />} 
  message="No jobs posted yet" 
  action={<Button>Post Your First Job</Button>}
/>
```

---

### Phase 4: Polish Job Board (High-Visibility Surface)

This is where builders decide if the platform is worth their time.

#### 4.1 JobListingCard Enhancements

**File**: `src/pages/jobs/JobListingCard.tsx`

- Add `card-grounded` class for stronger visual presence
- Make budget more prominent (larger text, accent color for high values)
- ASAP timing should use accent badge variant
- Add subtle left border accent on hover

#### 4.2 JobBoardHeroSection Polish

**File**: `src/pages/jobs/components/JobBoardHeroSection.tsx`

- Add trust signal row: "Real specs • Less back-and-forth • Ibiza only"
- Toggle buttons: when active, use `accent` variant for ASAP (urgency indicator)
- Others use `default` when active

---

### Phase 5: Badge Variant Refinement

**File**: `src/components/ui/badge.tsx`

- Change `rounded-sm` to `rounded-md` (less "label printer", more professional)
- Add `gap-1` to base styles for icon+text badges
- Ensure outline variant has subtle background

---

## Files to Modify

1. `src/components/ui/button.tsx` - Fix outline/ghost hover
2. `tailwind.config.ts` - Remove non-standard fontWeight
3. `src/components/ui/badge.tsx` - Polish rounding and gap

## Files to Create

4. `src/components/layout/PageHeader.tsx` - Reusable page header
5. `src/components/ui/stat-tile.tsx` - Dashboard stat component
6. `src/components/ui/empty-state.tsx` - Empty state component

## Files to Polish

7. `src/pages/jobs/JobListingCard.tsx` - Add grounded styling
8. `src/pages/jobs/components/JobBoardHeroSection.tsx` - Add trust signal

---

## Implementation Order

1. **Fix button hover** → immediate UX improvement, low risk
2. **Fix tailwind config** → removes unused/broken extension
3. **Add PageHeader** → enables consistent page structure
4. **Add StatTile + EmptyState** → dashboard building blocks
5. **Polish Job Board** → high-visibility validation of new system

---

## Accent Usage Rules (Guardrail)

After this change, accent should **only** appear in:
- "Post a Job" CTA buttons
- ASAP/Urgent badges and toggles
- Primary call-to-action in marketing sections

Everything else uses `default` / `outline` / `secondary` / `ghost`.

---

## Expected Outcome

- Outline buttons no longer flash orange on hover
- Pages have consistent header structure
- Dashboards use unified stat display
- Empty states guide users to action
- Job board feels professional and "worth checking daily"
- Accent color remains special (urgency/CTA only)

