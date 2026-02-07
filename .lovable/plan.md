

# Seamless Service Category → Wizard Journey

## The Problem

Right now, the `/services/hvac` page breaks momentum:

```text
User lands on /services/hvac
    ↓
Sees subcategory options (Air Conditioning, Heating, etc.)
    ↓
Selects one (good!)
    ↓
... still on the same page
    ↓
Must scroll down and click "Post a Job"
    ↓
Then navigates to /post (starts wizard)
```

This is two decisions when it should be **one flowing motion**.

## The Solution: Auto-Advance on Selection

When a user selects a subcategory on the Service Category page, **immediately continue to the next logical step** - navigating them into the wizard flow with their selection pre-filled.

```text
User lands on /services/hvac
    ↓
Taps "Air Conditioning"
    ↓
Instant transition: "What type of AC work?"
    ↓
Shows micro-services (Repair, Install, Servicing, etc.)
    ↓
Journey continues...
```

The flow becomes a natural conversation rather than forms + buttons.

## Implementation Approach

### Option A: Navigate to Wizard (Recommended)

When subcategory is selected, navigate to `/post` with deep-link params:

```typescript
// ServiceCategory.tsx
const handleSubcategoryClick = (subId: string) => {
  navigate(`/post?category=${category.id}&subcategory=${subId}`);
};
```

The wizard already handles these params perfectly (lines 117-219 in CanonicalJobWizard.tsx):
- Fetches category/subcategory names
- Pre-populates wizard state
- Jumps to Step 3 (Micro selection)

**Benefits:**
- Uses existing deep-link logic (proven)
- Single canonical wizard flow
- URL reflects progress (bookmarkable, shareable)

### Option B: Inline Wizard Steps (More Complex)

Embed the wizard steps directly in the ServiceCategory page for a seamless experience. This would require:
- Managing wizard state outside the wizard
- Deciding when to "hand off" to the full wizard
- More code to maintain

**Not recommended** - adds complexity without clear benefit.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/public/ServiceCategory.tsx` | Remove radio buttons; use click-to-navigate cards |
| `public/locales/en/common.json` | Add momentum-focused copy |
| `public/locales/es/common.json` | Spanish translations |

---

## Detailed Changes

### 1. Transform Subcategory Selection to Auto-Advance Cards

Replace the RadioGroup pattern with clickable cards that navigate on tap:

```tsx
// ServiceCategory.tsx

// BEFORE: Radio buttons that just select
<RadioGroup onValueChange={setSelectedSubcategoryId}>
  {subcategories.map((sub) => (
    <div onClick={() => setSelectedSubcategoryId(sub.id)}>
      <RadioGroupItem value={sub.id} />
      <Label>{sub.name}</Label>
    </div>
  ))}
</RadioGroup>

// AFTER: Cards that navigate immediately
{subcategories.map((sub) => (
  <button
    key={sub.id}
    onClick={() => navigate(`/post?category=${category.id}&subcategory=${sub.id}`)}
    className="w-full text-left p-4 rounded-lg border hover:border-primary transition-all group"
  >
    <div className="flex items-center justify-between">
      <span className="font-medium">{sub.name}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
    {sub.description && (
      <span className="text-sm text-muted-foreground">{sub.description}</span>
    )}
  </button>
))}
```

### 2. Update Page Header Copy for Momentum

Change the framing from "Select a Subcategory" to something action-oriented:

**Current copy:**
- "Select a Subcategory"
- "Choose a specific service type to get started"

**New copy:**
- "What kind of work do you need?"
- "Tap to continue — we'll ask a few quick questions"

### 3. Remove Two-Card Choice Section

The current page shows two cards after subcategory selection:
1. "Post a Job" (broadcast)
2. "Browse Professionals" (search)

**For the momentum flow**, we should:
- Keep "Post a Job" as the default action (clicking subcategory = Post Job flow)
- Add a subtle link for "Browse Professionals" as an alternative

```tsx
{/* Alternative path - subtle, not blocking */}
<p className="text-xs text-muted-foreground text-center mt-6">
  {t('serviceCategory.orBrowse')}{' '}
  <Link to={`/professionals?category=${category.id}`} className="underline hover:text-foreground">
    {t('serviceCategory.browseProsLink')}
  </Link>
</p>
```

### 4. Add Visual Momentum Cue

Add an arrow or chevron to each subcategory card to signal "tap to continue":

```tsx
<button className="... group">
  <div className="flex items-center justify-between">
    <span>{sub.name}</span>
    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
</button>
```

---

## Translation Keys to Add

**English (`en/common.json`):**
```json
{
  "serviceCategory": {
    "whatKindOfWork": "What kind of work do you need?",
    "tapToContinue": "Tap to continue — we'll ask a few quick questions",
    "orBrowse": "Or",
    "browseProsLink": "browse professionals directly"
  }
}
```

**Spanish (`es/common.json`):**
```json
{
  "serviceCategory": {
    "whatKindOfWork": "¿Qué tipo de trabajo necesitas?",
    "tapToContinue": "Toca para continuar — te haremos unas preguntas rápidas",
    "orBrowse": "O",
    "browseProsLink": "ver profesionales directamente"
  }
}
```

---

## Flow Comparison

### Before (Broken Momentum)
```text
┌────────────────────────────────────────┐
│ HVAC Services                          │
│                                        │
│ ○ Air Conditioning     [selected]      │
│ ○ Heating Systems                      │
│ ○ Ventilation                          │
│ ○ Maintenance                          │
│                                        │
│ ─────────────────────────────────────  │
│                                        │
│ ┌──────────────┐  ┌──────────────┐    │
│ │  Post Job    │  │ Browse Pros  │    │
│ │   [Button]   │  │   [Button]   │    │
│ └──────────────┘  └──────────────┘    │
└────────────────────────────────────────┘
```

### After (Flowing Journey)
```text
┌────────────────────────────────────────┐
│ HVAC Services                          │
│                                        │
│ What kind of work do you need?         │
│ Tap to continue                        │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ Air Conditioning              →  │  │ ← Tap = navigate to wizard
│ └──────────────────────────────────┘  │
│ ┌──────────────────────────────────┐  │
│ │ Heating Systems               →  │  │
│ └──────────────────────────────────┘  │
│ ┌──────────────────────────────────┐  │
│ │ Ventilation                   →  │  │
│ └──────────────────────────────────┘  │
│                                        │
│ Or browse professionals directly       │
└────────────────────────────────────────┘
```

---

## Summary

The core change is simple: **clicking a subcategory immediately navigates to the wizard** with category + subcategory pre-filled.

This removes:
- The "select then click button" friction
- The two-card decision point (post vs browse)
- The feeling of "filling out forms"

And adds:
- Natural conversational flow
- Clear momentum ("tap to continue")
- Deep-link integration with existing wizard logic

The wizard's existing deep-link handler (lines 117-219) already does all the heavy lifting — we just need to send users there on subcategory tap.

