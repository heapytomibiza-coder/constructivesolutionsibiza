

# Elevate the Intent Selector: Expressive First Impression

## The Problem

The current `/auth` signup flow feels **functional but flat**. The Intent Selector lacks personality and emotional resonance. For a first impression, it should feel warm, inviting, and expressive — communicating "you belong here" before the user even picks an option.

---

## Design Direction

Transform from **sterile form** → **welcoming moment**

| Before | After |
|--------|-------|
| Plain gray icon boxes | Gradient-accented icon containers with personality |
| Static cards | Subtle entrance animations + hover states |
| Generic titles | Warm, expressive copy with emoji accents |
| Neutral colors | Steel blue icons for Asker, terracotta for Tasker |
| No visual hierarchy | Selected state with scale + glow |

---

## Visual Enhancements

### 1. Expressive Icons with Color Personality

Each intent gets a distinct visual identity:

```text
┌─────────────────────────────────────────────────┐
│  [🔵 Icon]  I'm looking for help                │
│             Find pros, post jobs, get quotes    │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  [🟠 Icon]  I'm offering my services            │
│             Find work, build my reputation      │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  [🔷 Icon]  Both                                │
│             I hire AND offer services           │
└─────────────────────────────────────────────────┘
```

- **Asker**: Steel blue gradient icon background (trust, reliability)
- **Tasker**: Terracotta/clay gradient icon background (warmth, action)
- **Both**: Steel blue outline with clay accent

### 2. Entrance Animations

Cards animate in staggered sequence:
- Card 1: `animate-slide-up` with 0ms delay
- Card 2: `animate-slide-up` with 100ms delay
- Card 3: `animate-slide-up` with 200ms delay

### 3. Selection States

When selected:
- Card scales up slightly (`scale-[1.02]`)
- Border changes to accent color with subtle glow
- Icon container gets gradient background
- Check mark appears in corner

### 4. Warmer, More Human Copy

| Current | New |
|---------|-----|
| "I'm an Asker" | "I'm looking for help" |
| "I'm a Tasker" | "I offer my services" |
| Dry descriptions | Warmer, action-oriented language |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/auth/IntentSelector.tsx` | Redesign cards with gradients, animations, expressive copy |
| `public/locales/en/auth.json` | Add intent selector translation keys |
| `public/locales/es/auth.json` | Add Spanish translations |

---

## Implementation Details

### IntentSelector.tsx Changes

```tsx
// New intent options with warmer copy
const intentOptions = [
  {
    value: 'client',
    icon: Search, // More expressive icon
    title: "I'm looking for help",
    description: 'Post jobs, get quotes, and hire trusted professionals',
    gradient: 'bg-gradient-steel', // Steel blue
    accentClass: 'text-primary',
  },
  {
    value: 'professional',
    icon: Hammer, // Trade-oriented icon
    title: 'I offer my services',
    description: 'Find work, win projects, and grow your business',
    gradient: 'bg-gradient-clay', // Terracotta
    accentClass: 'text-accent',
  },
  {
    value: 'both',
    icon: RefreshCw, // Exchange/both
    title: 'A bit of both',
    description: 'I hire professionals AND offer my own services',
    gradient: 'bg-gradient-steel',
    accentClass: 'text-primary',
  },
];
```

### Card Styling

```tsx
<Card
  className={cn(
    'cursor-pointer transition-all duration-300',
    'hover:shadow-md hover:border-accent/40',
    isSelected && 'border-accent ring-2 ring-accent/20 scale-[1.02] shadow-glow'
  )}
  style={{ animationDelay: `${index * 100}ms` }}
>
  <CardContent className="flex items-center gap-4 p-5">
    {/* Gradient icon container */}
    <div className={cn(
      'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-all',
      isSelected ? option.gradient : 'bg-muted',
      isSelected && 'shadow-md'
    )}>
      <Icon className={cn(
        'h-6 w-6 transition-colors',
        isSelected ? 'text-white' : option.accentClass
      )} />
    </div>
    
    {/* Text content */}
    <div className="flex-1">
      <p className={cn(
        'font-display text-lg font-semibold',
        isSelected && option.accentClass
      )}>
        {option.title}
      </p>
      <p className="text-sm text-muted-foreground">
        {option.description}
      </p>
    </div>
    
    {/* Selection indicator */}
    {isSelected && (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
        <Check className="h-4 w-4" />
      </div>
    )}
  </CardContent>
</Card>
```

### Header Copy

```tsx
<div className="text-center space-y-2">
  <h3 className="font-display text-xl font-semibold text-foreground">
    How will you use CS Ibiza?
  </h3>
  <p className="text-muted-foreground">
    Choose your path — you can always switch later
  </p>
</div>
```

---

## Translation Keys

### EN (`auth.json`)
```json
"intent": {
  "header": "How will you use CS Ibiza?",
  "subheader": "Choose your path — you can always switch later",
  "client": {
    "title": "I'm looking for help",
    "description": "Post jobs, get quotes, and hire trusted professionals"
  },
  "professional": {
    "title": "I offer my services",
    "description": "Find work, win projects, and grow your business"
  },
  "both": {
    "title": "A bit of both",
    "description": "I hire professionals AND offer my own services"
  }
}
```

### ES (`auth.json`)
```json
"intent": {
  "header": "¿Cómo usarás CS Ibiza?",
  "subheader": "Elige tu camino — siempre puedes cambiar después",
  "client": {
    "title": "Busco ayuda",
    "description": "Publica trabajos, recibe presupuestos y contrata profesionales de confianza"
  },
  "professional": {
    "title": "Ofrezco mis servicios",
    "description": "Encuentra trabajo, gana proyectos y haz crecer tu negocio"
  },
  "both": {
    "title": "Un poco de ambos",
    "description": "Contrato profesionales Y ofrezco mis propios servicios"
  }
}
```

---

## Summary

This transforms the Intent Selector from a plain form element into an **expressive first impression moment**:

- **Visual personality**: Gradient icons with steel blue (trust) and terracotta (action) accents
- **Motion**: Staggered entrance animations and smooth selection transitions
- **Warmth**: Human-centered copy that speaks to user goals, not abstract roles
- **Clarity**: Clear selection states with check indicators and subtle glow
- **i18n-ready**: All copy wired to translation files for EN/ES

The result feels welcoming, confident, and memorable — matching the "construction-grade professional" brand identity while adding warmth for new users.

