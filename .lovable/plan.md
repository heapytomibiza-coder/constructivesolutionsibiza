

# Simplified Professional Onboarding: Binary Micro-Category Selection

## Executive Summary

Transform the professional onboarding from a complex multi-step preference system (love/like/neutral/avoid) into a streamlined **binary IN/OUT toggle selection** that feels engaging, is idiot-proof, and directly feeds the matching algorithm.

The goal: **Make selecting 296 micro-services feel like scrolling through a catalog, not filling out a form.**

---

## Current State Analysis

### What Exists
- **16 categories** → **88 subcategories** → **296 micro-services**
- Current flow: Category → Subcategory → Micros → Preferences (love/like/neutral/avoid)
- `professional_services` table stores selections
- `professional_micro_preferences` table stores preference levels
- Matching view already uses `professional_services.micro_id` to match jobs

### Problems with Current Approach
1. **Too many steps**: Category → Subcategory → Micro → Preferences → Save
2. **Preference complexity**: Love/Like/Neutral/Avoid adds cognitive load without clear value
3. **No visual momentum**: Plain checkboxes, no satisfaction
4. **Hidden progress**: User doesn't know what "done" looks like
5. **Fragmented UI**: Separate pages, lose context

---

## The New Approach: "Toggle to Unlock"

### Core Principle
**Every micro-service is a simple toggle: IN or OUT.**

- **IN** = "I take on this type of job" (row in `professional_services`)
- **OUT** = "I don't do this" (no row)

No percentages. No love/like scores. Just binary.

### Why This Works for Matching
The matching algorithm only needs:
1. Does this pro offer this micro-service? (binary filter)
2. Is the pro in a matching zone? (location filter)
3. Is the pro live? (status filter)

Love/like preferences can become V2 **scoring signals** later—but for matching, IN/OUT is sufficient.

---

## UI Architecture: Progressive Reveal with Dopamine Hits

### Layout: Three-Panel Collapsed Flow

```text
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: Progress bar + "Selected: 7 services"                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 📦 ELECTRICAL                                    ▸ 24 items │  │
│  │    ✓ 3 selected                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 🔧 PLUMBING                                      ▸ 18 items │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ⚡ HVAC                                          ▸ 12 items │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [ ... more categories as accordion cards ... ]                   │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  FOOTER: [Continue] - Disabled until ≥1 selected                  │
└────────────────────────────────────────────────────────────────────┘
```

### When Category is Expanded

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 📦 ELECTRICAL                                        [Collapse ▾]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Installations (tap to expand)                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ ✓ Install       │  │   Install       │  │   Consumer      │     │
│  │   sockets       │  │   light         │  │   unit          │     │
│  │                 │  │   fittings      │  │   replacement   │     │
│  │   [SELECTED]    │  │                 │  │                 │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ ✓ Full         │  │   EV charger    │  │   Smart home    │     │
│  │   rewire        │  │   install       │  │   systems       │     │
│  │                 │  │                 │  │                 │     │
│  │   [SELECTED]    │  │                 │  │                 │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Repairs & Fault Finding                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Fault         │  │   Emergency     │  │   Socket        │     │
│  │   finding       │  │   callout       │  │   repair        │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  [Select all Electrical]  [Clear Electrical]                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Interaction Design: Making 296 Items Feel Light

### 1. Accordion Categories (Progressive Disclosure)
- Show 16 category cards initially (collapsed)
- Click to expand → reveals subcategory groups inside
- Each subcategory group shows its micro-services as tiles
- **Never show all 296 at once**

### 2. Tile Toggle Behavior
- **Unselected**: Light grey, subtle border
- **Tap/Click**: Instant toggle with micro-animation (tick appears, subtle glow)
- **Selected**: Primary color border, checkmark, subtle pulse on first select

### 3. Smart Progress Indicators
- **Header**: "Selected: 7 services" (updates live)
- **Category cards**: Show "✓ 3 selected" badge when collapsed
- **Minimum gate**: "Select at least 1 to continue"

### 4. Bulk Actions (Scoped)
Within each expanded category:
- "Select all [Category]" → selects all micros in that category
- "Clear [Category]" → deselects all in that category
- **No global "Select all 296"** (too risky, defeats personalization)

### 5. Search (Quick Filter)
- Sticky search bar: "Search services..."
- Typing filters across all categories inline
- Results show with category context preserved

---

## Database Simplification

### Current Tables (Keep)
- `professional_services` (user_id, micro_id) — **This is the binary truth**

### Table to Deprecate (Later)
- `professional_micro_preferences` — Love/like/neutral/avoid becomes optional V2 scoring

### Logic Change
Instead of checking preferences, matching uses only:
```sql
WHERE EXISTS (
  SELECT 1 FROM professional_services ps 
  WHERE ps.micro_id = m.id 
  AND ps.user_id = pro.user_id
)
```

This is **already how the current view works**, so no matching logic changes needed!

---

## New Component Architecture

### 1. ServiceUnlockWizard (Main Container)
```text
/src/pages/onboarding/steps/ServiceUnlockStep.tsx

State:
- selectedMicroIds: Set<string>
- expandedCategoryId: string | null
- searchQuery: string

Features:
- Fetches all categories/subcategories/micros in one query (denormalized)
- Groups by category → subcategory → micro
- Renders accordion with tile grid
- Handles bulk actions per category
- Shows live selection count
```

### 2. CategoryAccordion
```text
/src/pages/onboarding/components/CategoryAccordion.tsx

Props:
- category: { id, name, subcategories: [...] }
- selectedMicroIds: Set<string>
- isExpanded: boolean
- onToggle: () => void
- onMicroToggle: (microId: string) => void
- onSelectAll: () => void
- onClearAll: () => void

Features:
- Collapsible header with selection count badge
- Grid of subcategory groups when expanded
- Staggered animation on expand
```

### 3. MicroToggleTile
```text
/src/pages/onboarding/components/MicroToggleTile.tsx

Props:
- micro: { id, name, slug }
- isSelected: boolean
- onToggle: () => void
- animationDelay?: number

Features:
- 48px min touch target
- Checkmark appears on selection
- Subtle glow/scale on selected
- Click anywhere to toggle
```

### 4. ServiceSearchBar
```text
/src/pages/onboarding/components/ServiceSearchBar.tsx

Props:
- value: string
- onChange: (value: string) => void

Features:
- Instant filter as you type
- Clear button
- Debounced for performance
```

---

## Onboarding Flow Integration

### Updated Step Order
1. **Basic Info** (name, phone, business name) — ✅ exists
2. **Service Area** (zone selection) — ✅ exists
3. **Services** (new binary tile selector) — **THIS IS THE CHANGE**
4. **Review & Go Live** (new confirmation screen)

### Go Live Requirements (Minimum Viable)
```typescript
const canGoLive = 
  displayName.trim() !== '' &&
  phone.trim() !== '' &&
  serviceZones.length > 0 &&
  selectedMicroIds.size >= 1;
```

### Profile Status After Go Live
```sql
UPDATE professional_profiles 
SET 
  profile_status = 'live',
  onboarding_phase = 'complete',
  submitted_at = NOW()
WHERE user_id = auth.uid();
```

---

## Copy & Messaging (Making It Informative)

### Page Header
**"What work do you want?"**
*"Pick the jobs you're happy to take. We'll only send you matches for these."*

### Category Card (Collapsed)
**"Electrical"** — 24 services available
*"✓ 3 selected"*

### Category Card (Expanded Header)
**"Electrical"**
*"Toggle the jobs you take on. You can change these anytime."*

### Micro Tile
**"Install sockets & switches"**
*(No extra text — clean and scannable)*

### Selected Summary
**"7 services selected"**
*"Most professionals select 5-15"*

### Continue Button States
- Disabled: "Select at least 1 service"
- Enabled: "Continue →"

### Review Screen
**"You'll receive job requests for:"**
- Install sockets & switches
- Light fittings
- Consumer unit replacement
- ...

*"You can edit this anytime in your dashboard."*

**[Go Live]**

---

## Technical Implementation

### Phase 1: Service Selection Component
1. Create `ServiceUnlockStep.tsx` with accordion layout
2. Create `CategoryAccordion.tsx` with collapsible groups
3. Create `MicroToggleTile.tsx` with binary toggle
4. Integrate search filter
5. Connect to `professional_services` table (insert on toggle, delete on untoggle)
6. Add autosave with debounce (300ms)

### Phase 2: Review & Go Live Step
1. Create `ReviewStep.tsx` showing selected services
2. Add Go Live button with requirements check
3. Update `profile_status` and `onboarding_phase` on submit
4. Redirect to `/dashboard/pro` on success

### Phase 3: Cleanup
1. Hide/remove preference step from flow
2. Keep `professional_micro_preferences` table for future scoring
3. Update matching view to only use `professional_services` (already does)

---

## Animations & Polish

### Tile Selection Animation
- On select: `scale(1.02)` + `shadow-glow` + checkmark fade-in (150ms)
- On deselect: Smooth return to base state (100ms)

### Category Expand Animation
- Accordion opens with `max-height` transition
- Tiles stagger in with 30ms delays
- Smooth, not jarring

### Progress Updates
- Selection count updates with number animation (120 → 121)
- "Saved ✓" toast appears briefly on each save

### Continue Button
- Disabled: Grey, no hover effect
- Enabled: Primary gradient, subtle pulse to draw attention

---

## Summary

| Before | After |
|--------|-------|
| Category → Subcategory → Micro → Preferences | Single page with accordion |
| Love/Like/Neutral/Avoid | Binary toggle (IN/OUT) |
| Checkboxes in lists | Touch-friendly tile cards |
| No visible progress | Live counter + category badges |
| Multi-step save | Autosave on every toggle |
| Complex mental model | "Toggle = I do this job" |

The result: **An idiot-proof, satisfying service selection experience that feeds clean binary data into your matching algorithm.**

