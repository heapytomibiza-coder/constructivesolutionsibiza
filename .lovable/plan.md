

# Add Welcoming Visual to Auth Intent Selector

## The Vision

A **compact hero image** above the intent cards that creates an emotional "welcome" moment without adding friction. As you said:

> "A welcoming smile before the handshake."

---

## Design Specification

### Layout (Desktop & Mobile)

```text
┌─────────────────────────────────────────┐
│           [CS Ibiza Logo]               │
├─────────────────────────────────────────┤
│   ┌─────────────────────────────────┐   │
│   │                                 │   │
│   │     [ Compact Hero Visual ]     │   │  ← 120-140px desktop
│   │       Warm / human / Ibiza      │   │    90-100px mobile
│   │       Soft gradient overlay     │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│        How will you use CS Ibiza?       │
│      Choose your path — switch later    │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  🔵 I'm looking for help        │   │
│   └─────────────────────────────────┘   │
│   ┌─────────────────────────────────┐   │
│   │  🟠 I offer my services         │   │
│   └─────────────────────────────────┘   │
│   ┌─────────────────────────────────┐   │
│   │  🔷 A bit of both               │   │
│   └─────────────────────────────────┘   │
│                                         │
│          [ Continue Button ]            │
└─────────────────────────────────────────┘
```

### Image Characteristics

**Style: Documentary-warm, not stock-corporate**

The image should convey:
- **Human moment** — hands on work, conversation, collaboration
- **Trust + warmth** — natural light, Ibiza colors (honey sandstone, terracotta)
- **Professional but approachable** — not industrial, not sterile

**What TO show:**
- A professional talking with a client in warm natural light
- Hands over plans/tablet at a worksite
- Tools and materials organized (tidy, not chaotic)
- Subtle Mediterranean context (light, texture, stone — not palm trees)

**What NOT to show:**
- Faces staring into camera
- Stock-photo smiles
- Heavy machinery or hard hats
- Messy construction chaos

### Technical Implementation

**New component: `AuthHeroVisual.tsx`**

A lightweight, auth-specific visual component:
- Rounded corners (matches card aesthetic)
- Fixed aspect ratio (responsive height)
- Gradient overlay (steel → clay blend)
- Subtle entrance animation

---

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/assets/heroes/hero-auth.jpg` | New image asset (to be provided/generated) |
| `src/components/auth/AuthHeroVisual.tsx` | New compact hero component for auth flow |
| `src/components/auth/IntentSelector.tsx` | Import and render the hero visual above header |
| `public/locales/en/auth.json` | Optional: Add alt text translation |
| `public/locales/es/auth.json` | Optional: Add Spanish alt text |

---

## Implementation Details

### New Component: `AuthHeroVisual.tsx`

```tsx
import { cn } from '@/lib/utils';
import heroAuth from '@/assets/heroes/hero-auth.jpg';

interface AuthHeroVisualProps {
  className?: string;
}

export function AuthHeroVisual({ className }: AuthHeroVisualProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg',
        'h-[100px] sm:h-[120px] md:h-[140px]',
        'animate-fade-in',
        className
      )}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroAuth})` }}
      />
      
      {/* Warm gradient overlay (steel → clay blend) */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/20 to-accent/30" />
      
      {/* Subtle vignette for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
    </div>
  );
}
```

### IntentSelector.tsx Updates

```tsx
import { AuthHeroVisual } from './AuthHeroVisual';

export function IntentSelector({ value, onChange }: IntentSelectorProps) {
  const { t } = useTranslation('auth');

  return (
    <div className="space-y-5">
      {/* Welcome visual - warm Mediterranean moment */}
      <AuthHeroVisual />
      
      {/* Expressive header */}
      <div className="text-center space-y-2">
        <h3 className="font-display text-xl font-semibold text-foreground">
          {t('intent.header')}
        </h3>
        <p className="text-muted-foreground">
          {t('intent.subheader')}
        </p>
      </div>

      {/* Intent cards - unchanged */}
      <div className="grid gap-3">
        {intentOptions.map((option, index) => {
          // ... existing card code
        })}
      </div>
    </div>
  );
}
```

---

## Image Asset Options

### Option A: AI-Generated (Fastest)

Use the Nano banana model to generate a Mediterranean construction moment:

**Prompt:**
> "Professional builder and client reviewing plans together in warm Ibiza sunlight, honey-colored sandstone background, hands pointing at tablet or blueprint, warm terracotta accents, natural documentary style, shallow depth of field, no direct eye contact with camera, professional but human, aspect ratio 3:1"

### Option B: Stock Photo (If you have a source)

Search terms:
- "Mediterranean construction consultation"
- "Builder client meeting natural light"
- "Renovation planning warm tones"

### Option C: Upload Your Own

If you have a specific image that captures the CS Ibiza vibe.

---

## Translation Keys (Optional)

**EN (`auth.json`):**
```json
"intent": {
  "heroAlt": "Professional consultation in Mediterranean light",
  // ... existing keys
}
```

**ES (`auth.json`):**
```json
"intent": {
  "heroAlt": "Consulta profesional en luz mediterránea",
  // ... existing keys
}
```

---

## Responsive Behavior

| Breakpoint | Hero Height | Card Spacing |
|------------|-------------|--------------|
| Mobile (< 640px) | 100px | gap-3 |
| Tablet (640-768px) | 120px | gap-3 |
| Desktop (768px+) | 140px | gap-3 |

No scroll required on mobile — everything fits above the fold.

---

## Future Enhancements (v2)

Once the base visual is in place, you could later add:
- Subtle parallax on scroll
- Image swap based on selected intent (steel tones → clay tones)
- Micro-copy overlay ("You're in the right place")

But v1 stays **simple, warm, fast**.

---

## Summary

This adds a **compact welcome visual** above the intent selector that:

- Creates immediate warmth and personality
- Uses Mediterranean construction photography (documentary style)
- Maintains fast signup flow (no extra clicks)
- Matches existing page patterns (consistent with other heroes)
- Stays responsive and mobile-friendly

The image itself should feel like a **welcoming moment** — trust, collaboration, Ibiza light — not a sterile stock photo or chaotic construction site.

