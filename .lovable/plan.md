

# Redesign Logistics Step for Quick, Easy, Informative Flow

## Current Problems

Looking at the screenshot, the Logistics step has **7 different inputs** all visible at once:
1. Location (select)
2. When to start (select) 
3. Completion date (date picker)
4. Contact preference (3 radio options)
5. Budget range (6 radio options)
6. Access details (textarea)

This creates:
- **Visual overwhelm** — too much to process at once
- **Decision fatigue** — budget has 6 choices stacked vertically  
- **Inconsistent UX** — Step 4 uses beautiful one-at-a-time tiles, Step 5 reverts to a dense form
- **Mobile scroll pain** — requires significant scrolling to complete

## Proposed Solution: Focused Card Flow

Restructure Logistics into **4 focused sections** with a logical conversational flow:

```text
┌─────────────────────────────────────────┐
│  Section 1: WHERE                       │
│  ┌───────────────────────────────────┐  │
│  │ 📍 Where is the work needed?      │  │
│  │     [Location Tiles - Top 5]      │  │
│  │     + "Other area" option         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  Section 2: WHEN                        │
│  ┌───────────────────────────────────┐  │
│  │ 🗓️ When do you need this?         │  │
│  │     [ASAP] [This week]            │  │
│  │     [This month] [Flexible]       │  │
│  │     [Specific date →]             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  Section 3: BUDGET                      │
│  ┌───────────────────────────────────┐  │
│  │ 💰 What's your budget range?      │  │
│  │     [Under €500] [€500-1k]        │  │
│  │     [€1k-2.5k]  [€2.5k-5k]        │  │
│  │     [Over €5k]  [Need quote]      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  Section 4: CONTACT (Collapsible)       │
│  ┌───────────────────────────────────┐  │
│  │ 📞 How should pros reach you?     │  │
│  │     [Site visit] [Call] [Message] │  │
│  │                                   │  │
│  │ + Any access notes? (optional)    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Key UX Improvements

### 1. Use Tile Cards (Consistent with Step 4)
Replace radio buttons + selects with tappable tile cards:
- 48px minimum touch target
- Visual selection state (checkmark + primary border)
- Auto-advance on single selection

### 2. Group Logically with Visual Sections
Instead of one long form, use collapsible/progressive sections:
- **WHERE** — Location tiles (show top 5 + "More areas" expandable)
- **WHEN** — Timing tiles in 2x2 grid + optional date picker
- **BUDGET** — Compact 2x3 tile grid 
- **CONTACT** — Simple 3-option tiles + optional notes

### 3. Remove Completion Date
Currently asks for both "When to start" AND "When to complete" — this is redundant for 80% of jobs. 
- **Remove completion date** (or move to optional "More details" section)
- Most users just want to say "ASAP" or "This month"

### 4. Smart Defaults
- Pre-select "Message" for contact (lowest friction)
- Show location search/autocomplete for faster selection

## Technical Changes

### File: `src/components/wizard/canonical/steps/LogisticsStep.tsx`

**Complete rewrite with:**

1. **TileOption component** — Reusable tappable card matching Questions step style
2. **Section groups** — Visual separation with subtle headers  
3. **2-column grid** — Better use of space for tiles
4. **Progressive disclosure** — Location "Show more areas" expander
5. **Remove completion date field** — Simplify to start timing only
6. **i18n ready** — Move all labels to translation files

### Estimated Structure:

```tsx
function LogisticsStep({ logistics, onChange }) {
  return (
    <div className="space-y-8">
      {/* Section: Location */}
      <LogisticsSection title="Where is the work?">
        <div className="grid grid-cols-2 gap-3">
          {TOP_LOCATIONS.map(loc => (
            <TileOption 
              selected={logistics.location === loc.value}
              onClick={() => onChange({ location: loc.value })}
            >
              {loc.label}
            </TileOption>
          ))}
        </div>
        <button>More areas...</button>
      </LogisticsSection>

      {/* Section: Timing */}
      <LogisticsSection title="When do you need this?">
        <div className="grid grid-cols-2 gap-3">
          {TIMING_OPTIONS.map(...)}
        </div>
      </LogisticsSection>

      {/* Section: Budget */}
      <LogisticsSection title="What's your budget?">
        <div className="grid grid-cols-2 gap-3">
          {BUDGET_OPTIONS.map(...)}
        </div>
      </LogisticsSection>

      {/* Section: Contact */}
      <LogisticsSection title="How should pros reach you?">
        {CONTACT_OPTIONS.map(...)}
        <Textarea placeholder="Access notes (optional)" />
      </LogisticsSection>
    </div>
  );
}
```

### Translation Updates

Add new keys to `public/locales/en/wizard.json` and `es/wizard.json`:

```json
{
  "logistics": {
    "where": "Where is the work?",
    "when": "When do you need this?",
    "budget": "What's your budget?",
    "contact": "How should pros reach you?",
    "moreAreas": "More areas...",
    "accessNotes": "Access notes (optional)",
    "accessPlaceholder": "Gate code, parking, building access..."
  }
}
```

## Summary

| Before | After |
|--------|-------|
| 7 inputs in one long form | 4 focused sections |
| Radio buttons + selects | Touch-friendly tiles |
| Lots of scrolling | Fits on one screen |
| Inconsistent with Step 4 | Matches tile-based UX |
| Completion date (redundant) | Removed |

**Result:** A quick, tap-friendly flow that feels consistent with the rest of the wizard and respects the user's time.

