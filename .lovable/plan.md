
# Visual Design Refresh: Construction-Grade Professional Look

## Current State Analysis

The existing design system uses a "Mediterranean luxury" theme with:
- **Colors**: Ocean blues, warm sand, golden accents (more resort-like than construction)
- **Typography**: Playfair Display (serif) + Inter (sans) - good pairing but underutilized
- **Imagery**: No real photos - just placeholder.svg in `/public`
- **Cards**: Very light, minimal shadow/border presence
- **Overall feel**: SaaS-generic, polite but bland - doesn't convey "trusted trades"

## Target Design Direction

**Vibe**: "Trusted local builders, modern system" - solid, human, confident, grounded in real work.

**NOT**: Corporate consultancy, startup SaaS, DIY marketplace chaos

---

## Phase 1: Core Design System Overhaul

### 1.1 Color Palette Shift

**Current → New**

```text
LIGHT MODE
--------------------------------------------
Background:   #f8fafb (cool white)    → #f7f5f3 (warm concrete)
Foreground:   #1a1f2e (near black)    → #2d2a26 (warm charcoal)
Primary:      hsl(205 80% 45%) blue   → hsl(210 45% 28%) steel blue
Accent:       hsl(38 70% 55%) gold    → hsl(25 70% 50%) clay/terracotta
Muted:        hsl(210 15% 93%)        → hsl(35 15% 90%) warm stone
Card:         pure white              → #fefdfb (cream-white)
--------------------------------------------

DARK MODE  
--------------------------------------------
Background:   #14181e               → #1c1a17 (warm dark)
Primary:      hsl(205 75% 50%)     → hsl(210 50% 55%) muted steel
--------------------------------------------
```

**Files to modify**:
- `src/index.css` - CSS variables for both light/dark modes

### 1.2 Typography Enhancement

Keep Playfair Display + Inter, but add weight and confidence:

**Changes**:
- Headings: Increase font-weight to 600-700 (currently 400-500)
- Add letter-spacing: -0.02em for display text (tighter = more solid)
- Body text: Slightly larger base (16px) with 1.6 line-height
- Add a new utility class `.text-display-lg` for hero headlines

**Files to modify**:
- `src/index.css` - base layer typography rules
- `tailwind.config.ts` - add `fontWeight` extensions

### 1.3 Component Visual Weight

**Cards** - more presence, less "floating":
- Increase border opacity (currently barely visible)
- Add subtle inset shadow for "grounded" feel
- Slightly reduce border-radius (0.5rem instead of 0.75rem)

**Buttons** - more confident:
- Primary: deeper color, subtle shadow on hover
- Larger touch targets on mobile (h-12 instead of h-10)

**Badges** - trade-appropriate:
- Less rounded (rounded-sm instead of rounded-full for some)
- Stronger border for outline variants

**Files to modify**:
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`

---

## Phase 2: Page-by-Page Refresh

### 2.1 Homepage (`src/pages/Index.tsx`)

**Hero Section**:
- Replace gradient background with a subtle construction texture/pattern OR photo
- Stronger headline hierarchy
- Add a "hero image" slot (placeholder initially, real photo later)
- Trust badge row: "Verified trades | Same-day response | Ibiza-based"

**Categories Grid**:
- Replace circular icon containers with square/rounded-square (more "tool-like")
- Add subtle hover state with left border accent (like a tab highlight)

**Trust Signals**:
- Increase icon size and prominence
- Add a subtle horizontal rule between each

**CTA Section**:
- Use terracotta/clay gradient instead of ocean blue
- More confident copy

### 2.2 Auth Page (`src/pages/auth/Auth.tsx`)

**Changes**:
- Add blurred background image (construction site silhouette or tools pattern)
- Reassurance line under logo: "Used by verified trades across Ibiza"
- Role choice buttons: "I'm hiring" / "I'm a professional" (clearer)
- Remove decorative gradient, use warm stone background

### 2.3 Job Board (`src/pages/jobs/JobBoardPage.tsx`, `JobListingCard.tsx`)

**Job Cards**:
- Stronger left border accent on hover
- Status badges with more contrast
- Budget displayed more prominently
- Urgency indicators that feel useful, not spammy

**Hero Section** (`JobBoardHeroSection.tsx`):
- Replace gradient with solid warm stone
- Larger, bolder headline
- Filter toggles with more visual weight

### 2.4 Job Wizard (`CanonicalJobWizard.tsx`)

**Changes**:
- Progress bar: thicker (h-3), with segment markers
- Step headers: stronger typography, helper text below
- Question cards: more padding, clear dividers between questions
- "You're building a proper brief" reassurance microcopy

### 2.5 Messages (`src/pages/messages/Messages.tsx`)

**Changes**:
- Conversation list: stronger selected state (solid background, not just border)
- Thread: WhatsApp-like message bubbles (more familiar)
- Sender differentiation: left/right alignment, different background colors

### 2.6 Client/Pro Dashboard (`ClientDashboard.tsx`, `ProDashboard.tsx`)

**Changes**:
- Stats cards: larger numbers, subtle icon backgrounds
- Job list: stronger hover states, clear action buttons
- More "workbench" feel - less "admin portal"

### 2.7 Navigation (`PublicNav.tsx`)

**Changes**:
- Logo mark: square with subtle depth (shadow or gradient)
- Nav links: underline on hover (not color change only)
- CTA button: terracotta/clay accent color

---

## Phase 3: Imagery & Assets

### 3.1 Placeholder Image Strategy

Create a set of CSS-based placeholder patterns (no external images needed):
- Concrete texture (CSS gradient noise)
- Tool silhouettes (inline SVG)
- Blueprint grid (CSS pattern)

### 3.2 Real Photo Guidance (for later upload)

Document the photo requirements:
- Real people working (not posed)
- Hands, tools, mid-task moments
- Natural light, slight grit is good
- Ibiza-relevant context (Mediterranean architecture, stone walls)

---

## Phase 4: Utility Classes & Components

### 4.1 New CSS Utilities

Add to `src/index.css`:

```css
.bg-texture-concrete {
  /* Subtle noise pattern */
}

.border-accent-left {
  border-left: 3px solid hsl(var(--accent));
}

.card-grounded {
  box-shadow: inset 0 -2px 0 hsl(var(--border));
}
```

### 4.2 Consistent Pattern Components

Create or refine:
- `HeroSection` - reusable hero block
- `StatCard` - dashboard stat display
- `ServiceCard` - category/service display

---

## Implementation Order

1. **Core CSS Variables** (index.css) - color palette shift
2. **Tailwind Config** - typography extensions
3. **UI Components** (button, card, badge) - visual weight
4. **Homepage** - hero + categories refresh
5. **Auth Page** - background + reassurance copy
6. **Navigation** - logo + CTA styling
7. **Job Board** - cards + hero section
8. **Wizard** - progress bar + step headers
9. **Dashboard** - stats + job list
10. **Messages** - thread styling

---

## Technical Summary

### Files to Create
- None (all changes are modifications)

### Files to Modify
- `src/index.css` - color variables, typography, utilities
- `tailwind.config.ts` - font weights, new utilities
- `src/components/ui/button.tsx` - sizing, shadows
- `src/components/ui/card.tsx` - border, shadow treatment
- `src/components/ui/badge.tsx` - less rounded variants
- `src/pages/Index.tsx` - hero, categories, trust signals
- `src/pages/auth/Auth.tsx` - background, reassurance copy
- `src/components/layout/PublicNav.tsx` - logo, CTA styling
- `src/pages/jobs/JobBoardPage.tsx` - page header
- `src/pages/jobs/JobListingCard.tsx` - card styling
- `src/pages/jobs/components/JobBoardHeroSection.tsx` - hero styling
- `src/components/wizard/canonical/CanonicalJobWizard.tsx` - progress bar, step styling
- `src/pages/dashboard/ClientDashboard.tsx` - stats, job list
- `src/pages/messages/Messages.tsx` - thread styling

### Dependencies
- No new packages required
- All changes use existing Tailwind + CSS

---

## Expected Outcome

After implementation, the platform will feel:
- **Solid**: Grounded colors, weighted typography, substantial components
- **Professional**: Clean but not sterile, confident not flashy
- **Trade-appropriate**: Warm materials palette (stone, terracotta, steel blue)
- **Trustworthy**: Real-work aesthetic that builders and clients recognize

The overall impression shifts from "generic SaaS" to "serious construction network with a modern digital layer."
