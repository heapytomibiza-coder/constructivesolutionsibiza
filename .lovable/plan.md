

# Redesign Review Step: From Blocks to Story + Fix Budget Formatting

## Current Issues

1. **Review Step reads like a data dump** — separate bordered blocks for each section makes it feel like a form, not a summary
2. **Budget shows raw values** like `1000_2500` instead of `€1,000 – €2,500`
3. **No narrative flow** — clients can't quickly scan and understand their submission

## Design Vision

Transform the Review step into a **"Job Brief"** — a clean, scannable summary that reads like a document, not a form. Think of it as the confirmation page you'd see when booking something important.

### Before (Current)
```
┌─────────────────────────────────┐
│ Category                    [✎] │
│ Plumbing → Bathroom            │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Selected Tasks              [✎] │
│ • Shower installation          │
│ • Drain repair                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Location                    [✎] │
│ ibiza_town                     │
│ Timing                         │
│ this_week                      │
│ Budget                         │
│ 1000_2500                      │
└─────────────────────────────────┘
```

### After (Story Format)
```
┌─────────────────────────────────────────┐
│               YOUR JOB BRIEF            │
├─────────────────────────────────────────┤
│ 🔧 Plumbing → Bathroom              [✎] │
│                                         │
│ What you need:                          │
│   • Shower installation                 │
│   • Drain repair                        │
│                                         │
│ Where: Ibiza Town                   [✎] │
│ When: This week                         │
│ Budget: €1,000 – €2,500                 │
│                                         │
│ [📷 2 photos attached]              [✎] │
│ [📝 "Need work done in guest bath..."] │
└─────────────────────────────────────────┘

How would you like to send this job?
○ Send to available professionals
○ Send to a specific professional
```

## Implementation Plan

### Step 1: Create Helper Formatting Functions

Create `src/components/wizard/canonical/lib/formatDisplay.ts`:

| Function | Purpose |
|----------|---------|
| `formatBudgetRange(raw)` | Convert `1000_2500` → `€1,000 – €2,500` |
| `formatLocation(loc, custom)` | Convert `ibiza_town` → `Ibiza Town` |
| `formatTiming(preset)` | Convert `this_week` → `This week` |

### Step 2: Redesign ReviewStep Component

Replace the current block-based layout with a unified story layout:

**New Structure:**
```tsx
<div className="space-y-6">
  {/* Job Brief Card - single cohesive summary */}
  <Card className="overflow-hidden">
    {/* Header with category */}
    <div className="bg-primary/5 px-5 py-4 border-b">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="secondary">{category}</Badge>
          <span className="ml-2 text-sm">{subcategory}</span>
        </div>
        <EditButton step="category" />
      </div>
    </div>
    
    {/* Content - flows as one story */}
    <CardContent className="p-5 space-y-5">
      {/* What you need */}
      <section>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          What you need
        </h4>
        <ul className="space-y-1.5">
          {tasks.map(t => <li>• {t}</li>)}
        </ul>
        <EditLink step="micro" />
      </section>
      
      {/* Where & When - inline */}
      <section className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm text-muted-foreground">Where</span>
          <p className="font-medium">{formattedLocation}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">When</span>
          <p className="font-medium">{formattedTiming}</p>
        </div>
      </section>
      
      {/* Budget - prominent */}
      <section>
        <span className="text-sm text-muted-foreground">Budget</span>
        <p className="text-lg font-semibold text-primary">
          {formattedBudget}
        </p>
        <EditLink step="logistics" />
      </section>
      
      {/* Attachments summary (inline, compact) */}
      {(hasPhotos || hasNotes) && (
        <section className="flex flex-wrap gap-2 pt-2 border-t">
          {photos.length > 0 && (
            <Badge variant="outline">📷 {photos.length} photos</Badge>
          )}
          {notes && (
            <Badge variant="outline">📝 Notes added</Badge>
          )}
          <EditLink step="extras" />
        </section>
      )}
    </CardContent>
  </Card>
  
  {/* Dispatch mode - separate card for decision */}
  <Card>
    <CardContent>
      {/* Radio options for broadcast/direct */}
    </CardContent>
  </Card>
</div>
```

### Step 3: Budget Range Formatting

Create a proper mapping in `formatDisplay.ts`:

```typescript
const BUDGET_DISPLAY: Record<string, string> = {
  'under_500': 'Under €500',
  '500_1000': '€500 – €1,000',
  '1000_2500': '€1,000 – €2,500',
  '2500_5000': '€2,500 – €5,000',
  'over_5000': 'Over €5,000',
  'need_quote': 'Quote needed',
};

export function formatBudgetRange(raw: string | undefined): string {
  if (!raw) return 'To be discussed';
  return BUDGET_DISPLAY[raw] || raw;
}
```

### Step 4: Location Formatting

Use the existing `LOCATION_LABELS` map from `answerResolver.ts`:

```typescript
export function formatLocation(
  location: string | undefined, 
  customLocation?: string
): string {
  if (!location) return 'Not specified';
  if (location === 'other') return customLocation || 'Custom location';
  return LOCATION_LABELS[location] || location.replace(/_/g, ' ');
}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/wizard/canonical/lib/formatDisplay.ts` | **NEW** — Create formatting helpers for budget, location, timing |
| `src/components/wizard/canonical/steps/ReviewStep.tsx` | Redesign to unified story format with inline edit links |
| `src/components/wizard/canonical/lib/index.ts` | Export new formatDisplay module |

## Visual Result

The new Review step will:
- Feel like a **confirmation page**, not a form
- Show information in a **scannable, logical flow**
- Use **inline edit links** (small, unobtrusive) instead of prominent edit buttons
- Display **formatted values** (€1,000 – €2,500, not 1000_2500)
- Have a **single cohesive card** for the job brief
- Keep dispatch mode selection **separate and clear**

## Technical Details

### New File: formatDisplay.ts

```typescript
import { LOCATION_LABELS } from '@/pages/jobs/lib/answerResolver';

const BUDGET_DISPLAY: Record<string, string> = {
  'under_500': 'Under €500',
  '500_1000': '€500 – €1,000', 
  '1000_2500': '€1,000 – €2,500',
  '2500_5000': '€2,500 – €5,000',
  'over_5000': 'Over €5,000',
  'need_quote': 'Quote needed',
};

const TIMING_DISPLAY: Record<string, string> = {
  'asap': 'As soon as possible',
  'this_week': 'This week',
  'this_month': 'This month', 
  'flexible': 'Flexible',
  'specific': 'Specific date',
};

export function formatBudgetRange(raw: string | undefined): string {
  if (!raw) return 'To be discussed';
  return BUDGET_DISPLAY[raw] || raw;
}

export function formatLocation(location: string | undefined, customLocation?: string): string {
  if (!location) return 'Not specified';
  if (location === 'other') return customLocation || 'Custom location';
  return LOCATION_LABELS[location] || location.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatTiming(preset: string | undefined, date?: Date): string {
  if (!preset) return 'Flexible';
  if (preset === 'specific' && date) {
    return `Starting ${date.toLocaleDateString()}`;
  }
  return TIMING_DISPLAY[preset] || preset.replace(/_/g, ' ');
}
```

### ReviewStep Layout (Key Sections)

The card will use a single container with visual sections:
- **Header**: Category badge + subcategory (top accent bar)
- **Tasks**: Bulleted list with edit link
- **Logistics Grid**: Location + Timing side-by-side
- **Budget**: Prominent display
- **Attachments**: Compact badges for photos/notes

Edit links will be small, text-only buttons (`Edit` in muted text) that don't disrupt the reading flow.

