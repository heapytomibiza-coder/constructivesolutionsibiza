

# Clear Explanation Copy + Auto-Advance UX

## Overview

Add clear, idiot-proof explanation copy to the ServiceCategory page explaining the difference between "Post a Job" (broadcast) and "Browse Professionals" (direct/search), while confirming the existing auto-advance behavior on single-choice steps is working correctly.

---

## Current State (Already Working ✓)

The wizard **already auto-advances** on single-choice steps:

| Step | Type | Behavior |
|------|------|----------|
| Category | Single-select | Auto-advances on click ✓ |
| Subcategory | Single-select | Auto-advances on click ✓ |
| Micro | Multi-select | Shows Continue button ✓ |
| Questions → Review | Multi-field | Shows Continue button ✓ |

This is confirmed in the code at lines 760-769: the Continue button only appears from Micro step onwards (Category and Subcategory don't show it).

---

## Changes Needed

### 1. ServiceCategory Page - Clear CTA Section

Replace the current simple CTA buttons with an explanation section that makes the choice crystal clear.

**Current (unclear):**
```
[Post a Carpentry Job →]  [Browse Carpentry Professionals]
```

**New (clear):**
```
┌─────────────────────────────────────────────────────────────────┐
│ How would you like to find help?                                │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│ │ 🚀 Post a Job               │ │ 🔍 Browse Professionals     │ │
│ │ ─────────────               │ │ ─────────────────────────── │ │
│ │ Get quotes fast from        │ │ Choose who you want to      │ │
│ │ available professionals     │ │ work with first             │ │
│ │                             │ │                             │ │
│ │ • Send to matching pros     │ │ • Browse profiles & reviews │ │
│ │ • Get multiple quotes       │ │ • Pick the right person     │ │
│ │ • Fastest response          │ │ • Start a conversation      │ │
│ │                             │ │                             │ │
│ │    [Post Job →]             │ │    [Browse Pros →]          │ │
│ └─────────────────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2. File Changes

**File: `src/pages/public/ServiceCategory.tsx`**

Replace the current CTA section (lines 219-239) with a new explanatory card layout:

| Element | Content |
|---------|---------|
| Section header | "How would you like to find help?" |
| Card 1 - Post Job | Icon: Megaphone/Zap, Title: "Post a Job", Subtitle: "Get quotes fast", Bullet points explaining broadcast, Primary CTA button |
| Card 2 - Browse Pros | Icon: Search/Users, Title: "Browse Professionals", Subtitle: "Choose who you work with", Bullet points explaining direct search, Outline CTA button |

### 3. Copy Details

**Post a Job Card:**
- **Title:** "Post a Job"
- **Subtitle:** "Get quotes fast from available professionals"
- **Benefits:**
  - Send your request to matching pros
  - Receive multiple quotes to compare
  - Fastest way to get responses
- **Button:** "Post Job →" (primary)
- **Micro-copy:** "Same 7-step form, broadcast to all matching pros"

**Browse Professionals Card:**
- **Title:** "Browse Professionals"  
- **Subtitle:** "Choose who you want to work with"
- **Benefits:**
  - View profiles, ratings & reviews
  - Pick the right person for you
  - Start a private conversation
- **Button:** "Browse Pros →" (outline)
- **Micro-copy:** "Same 7-step form, sent to the pro you choose"

### 4. Auto-Advance Confirmation

The wizard already implements auto-advance correctly:

1. **Category step:** User clicks a category → `handleCategorySelect` fires → state updates → `setCurrentStep(WizardStep.Subcategory)` auto-navigates
2. **Subcategory step:** User clicks a subcategory → `handleSubcategorySelect` fires → state updates → `setCurrentStep(WizardStep.Micro)` auto-navigates
3. **Micro step onwards:** Continue button appears (multi-select/multi-field steps need explicit confirmation)

No code changes needed for auto-advance - it's already working as designed.

---

## Implementation

### Step 1: Update ServiceCategory.tsx CTA Section

Replace the simple button row with a two-card layout using clear copy and visual hierarchy:

```typescript
{/* How to Find Help - Clear Choice */}
<div className="space-y-4">
  <h3 className="font-display text-lg font-semibold text-center">
    How would you like to find help?
  </h3>
  
  <div className="grid gap-4 sm:grid-cols-2">
    {/* Option 1: Post Job (Broadcast) */}
    <Card className="relative overflow-hidden border-primary/20 hover:border-primary/50 transition-colors">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold">Post a Job</h4>
            <p className="text-sm text-muted-foreground">Get quotes fast</p>
          </div>
        </div>
        
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
            Send to matching professionals
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
            Receive multiple quotes
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
            Fastest response time
          </li>
        </ul>
        
        <Button asChild className="w-full">
          <Link to={postHref}>
            Post Job
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>

    {/* Option 2: Browse Pros (Direct) */}
    <Card className="relative overflow-hidden hover:border-primary/30 transition-colors">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-semibold">Browse Professionals</h4>
            <p className="text-sm text-muted-foreground">Choose who you work with</p>
          </div>
        </div>
        
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            View profiles & reviews
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            Pick the right person
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            Start a private conversation
          </li>
        </ul>
        
        <Button variant="outline" asChild className="w-full">
          <Link to={prosHref}>
            Browse Pros
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  </div>
  
  {/* Bottom helper text */}
  <p className="text-xs text-muted-foreground text-center">
    Both options use the same 7-step form — the difference is who receives your request
  </p>
</div>
```

### Step 2: Add Required Imports

Add to the import statement at the top:
- `Zap` icon (for broadcast/speed)
- `Search` icon (for browse)
- `CheckCircle` icon (for benefit bullets)

---

## Summary

| Change | Status |
|--------|--------|
| Auto-advance on Category click | Already works ✓ |
| Auto-advance on Subcategory click | Already works ✓ |
| Continue button only from Micro onwards | Already works ✓ |
| Clear CTA explanation on ServiceCategory | New implementation |

This creates crystal-clear UX where:
1. Users understand the difference between broadcast and direct
2. Single-choice steps auto-advance (no friction)
3. Multi-select/form steps require explicit Continue (prevents accidents)

