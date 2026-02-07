

# Landing Page Cleanup — Focused & Professional

## The Problem

The current homepage has four issues creating a "jumbled" feel:

| Issue | Root Cause | Impact |
|-------|------------|--------|
| Brand name appears twice | `HeroBanner` renders `{children}` at line 61 AND line 85 | Looks sloppy, confusing |
| Search placeholder shows raw key | Translation loads after render | Looks unfinished/broken |
| Keyboard hint overlaps input | Positioned inside input without padding | Feels buggy |
| Hero is doing too many jobs | Too many competing elements | Decision paralysis |

---

## The Solution

Four targeted fixes — no new features, just cleanup.

---

## Change 1: Remove Duplicate Brand Name

**File:** `src/components/layout/HeroBanner.tsx`

The component renders `{children}` twice (line 61 and line 85). Remove the second one.

```text
BEFORE (line 85):
          {action}
        </div>
      )}
      
      {children}   ← DELETE THIS LINE
    </div>

AFTER:
          {action}
        </div>
      )}
    </div>
```

**Result:** Brand name appears once, above the headline.

---

## Change 2: Fix Translation Fallback + Input Padding

**File:** `src/components/search/UniversalSearchBar.tsx`

Two small changes:

1. Add fallback text to the placeholder so it never shows a raw key:

```tsx
// Line 197 - Add fallback
placeholder={t("universalSearch.placeholder", "What can we help you find?")}
```

2. Add right padding so the ⌘K hint doesn't overlap text:

```tsx
// Line 201 - Add pr-16
className="h-14 text-base pr-16"
```

**Result:** Search bar always shows readable text and feels intentional.

---

## Change 3: Clean Hero Structure

**File:** `src/pages/Index.tsx`

Reorder elements for clear visual hierarchy:

```text
CURRENT (messy):
┌──────────────────────────────────┐
│  CONSTRUCTIVE SOLUTIONS IBIZA    │ ← children
│  "Bridging the gap..."           │ ← title
│  "We help you understand..."     │ ← subtitle
│  [Trust badge row]               │ ← trustBadge
│  [Search bar]                    │ ← action (search)
│  [Start Project] [Browse]        │ ← action (buttons)
│  CONSTRUCTIVE SOLUTIONS IBIZA    │ ← children AGAIN (bug)
└──────────────────────────────────┘

AFTER (clean):
┌──────────────────────────────────┐
│  CONSTRUCTIVE SOLUTIONS IBIZA    │ ← Brand (once, quiet)
│                                  │
│  "What can we help you build?"   │ ← Action-led headline
│  "We translate your idea..."     │ ← Subtitle
│                                  │
│  [======= Search bar =======]    │ ← PRIMARY ACTION
│                                  │
│  [Start Project]  [Browse Pros]  │ ← Secondary, quieter
│                                  │
│  ✓ Guided • ✓ Clear • ✓ Ibiza   │ ← Trust moved to bottom
└──────────────────────────────────┘
```

**Changes:**
- Move trustBadge from above search to below buttons (less clutter at top)
- Make search the clear primary action
- Buttons become secondary (outline variant for "Start Project")

---

## Change 4: Update Hero Copy

**File:** `public/locales/en/common.json`

Change the headline to be action-oriented:

```json
"hero": {
  "title": "What can we help you build?",
  "subtitle": "We translate your idea into a clear brief — then connect you with the right professionals",
  "postJob": "Start Your Project",
  "browsePros": "Browse Professionals"
}
```

**File:** `public/locales/es/common.json`

Spanish equivalent:

```json
"hero": {
  "title": "¿Qué podemos ayudarte a construir?",
  "subtitle": "Traducimos tu idea en un briefing claro — luego te conectamos con los profesionales adecuados",
  "postJob": "Empieza Tu Proyecto",
  "browsePros": "Ver Profesionales"
}
```

**Result:** Headline immediately tells users what to do, not what the brand is.

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/components/layout/HeroBanner.tsx` | Delete duplicate `{children}` at line 85 |
| `src/components/search/UniversalSearchBar.tsx` | Add translation fallback + input padding |
| `src/pages/Index.tsx` | Reorder hero elements (search first, trust last) |
| `public/locales/en/common.json` | Update hero title/subtitle copy |
| `public/locales/es/common.json` | Update Spanish hero copy |

---

## Visual Result

After these changes:
- Brand shows once (at top, quiet)
- Headline tells users what to do
- Search bar is clearly the main action
- Buttons are secondary paths
- Trust signals anchor the bottom
- No duplicate elements
- No raw translation keys
- Clean, professional, builder-friendly

---

## Technical Details

### HeroBanner.tsx (line 85)
```tsx
// REMOVE this line:
{children}
```

### UniversalSearchBar.tsx (lines 196-202)
```tsx
<CommandInput
  placeholder={t("universalSearch.placeholder", "What can we help you find?")}
  value={query}
  onValueChange={setQuery}
  onFocus={() => setIsOpen(true)}
  className="h-14 text-base pr-16"
/>
```

### Index.tsx Hero Structure
```tsx
<HeroBanner
  imageSrc={heroHome}
  title={t('hero.title')}
  subtitle={t('hero.subtitle')}
  height="full"
  action={
    <div className="flex flex-col gap-6 items-center">
      {/* Search bar - PRIMARY */}
      <UniversalSearchBar className="w-full" />
      
      {/* Buttons - SECONDARY */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
          <Link to="/post">
            {t('hero.postJob')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button size="lg" variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10" asChild>
          <Link to="/professionals">{t('hero.browsePros')}</Link>
        </Button>
      </div>
      
      {/* Trust - LAST */}
      <div className="hero-trust-badge mt-2">
        <CheckCircle className="h-4 w-4" />
        {t('trust.guided')}
        <span className="text-white/50">•</span>
        <Clock className="h-4 w-4" />
        {t('trust.clarity')}
        <span className="text-white/50">•</span>
        <Shield className="h-4 w-4" />
        {t('trust.local')}
      </div>
    </div>
  }
>
  {/* Brand lockup - renders once above title */}
  <p className="mb-4 text-sm sm:text-base font-semibold tracking-widest uppercase text-white/90">
    {PLATFORM.name}
  </p>
</HeroBanner>
```

