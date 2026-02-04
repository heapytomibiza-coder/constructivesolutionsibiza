

# Add Hero Banner Images to Public Pages

## Overview
Add full-bleed photographic hero banners to each main public page with Mediterranean construction vibes, matching the reference design showing a warm stone Ibiza villa under construction with overlay text.

## Image Requirements
We'll need to generate 5 hero images using AI (via Lovable AI image generation) with these themes:

| Page | Image Theme | Description |
|------|-------------|-------------|
| **Homepage** | Mediterranean villa construction | Ibiza-style stone house under construction, warm golden hour light, materials visible (similar to reference) |
| **Services** | Trade professionals working | Construction workers actively building, hands-on trades at work |
| **Jobs** | Office/desk work | Professional reviewing plans at desk, clipboard or laptop, planning/coordination vibe |
| **Professionals** | Team of tradespeople | Group portrait of construction professionals, tools, Mediterranean backdrop |
| **How It Works** | Client-contractor handshake | Professional interaction, trust-building moment |
| **Contact** | Mediterranean architecture detail | Warm stone texture, olive tree, welcoming feel |

## Technical Approach

### 1. Create HeroBanner Component
A reusable component for consistent hero styling across all pages:
- Full-bleed background image with dark gradient overlay
- White/light text for contrast
- Responsive height (60-70vh on desktop, 50vh on mobile)
- Optional trust badge and CTA slots

```typescript
interface HeroBannerProps {
  imageSrc: string;
  title: string;
  subtitle?: string;
  trustBadge?: React.ReactNode;
  action?: React.ReactNode;
  overlayOpacity?: number; // 0.4-0.6 for readability
}
```

### 2. Image Storage Strategy
- Store generated images in `src/assets/heroes/`
- Import as ES6 modules for bundling/optimization
- Naming convention: `hero-{page}.jpg`

### 3. Page Updates

**Homepage (`Index.tsx`):**
- Replace `bg-gradient-hero` section with `<HeroBanner>`
- Full-screen dramatic hero with "CONSTRUCTIVE SOLUTIONS" headline
- Maintain existing CTA buttons and trust badges

**Services (`Services.tsx`):**
- Replace gradient header with photo banner
- Workers actively engaged in construction trades
- Shorter banner (40vh) since main content is below

**Jobs (`JobBoardPage.tsx`):**
- Add hero banner above the marketplace
- Desk/planning imagery for "work coordination" feel
- Keep search bar integrated into hero

**Professionals (`Professionals.tsx`):**
- Hero banner showing team of tradespeople
- Search bar can remain in hero section

**How It Works (`HowItWorks.tsx`):**
- Professional interaction imagery
- Trust-building, human connection feel

**Contact (`Contact.tsx`):**
- Warm, welcoming Mediterranean detail
- Architectural stone or olive tree imagery

### 4. CSS Updates
Add new utility classes to `index.css`:
- `.hero-banner` - base styling for full-bleed heroes
- `.hero-overlay` - gradient overlay for text readability
- `.hero-content` - positioned content container

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/assets/heroes/` | Create dir | Store hero images |
| `src/assets/heroes/hero-home.jpg` | Generate | Mediterranean villa construction |
| `src/assets/heroes/hero-services.jpg` | Generate | Workers in action |
| `src/assets/heroes/hero-jobs.jpg` | Generate | Planning/desk work |
| `src/assets/heroes/hero-professionals.jpg` | Generate | Team portrait |
| `src/assets/heroes/hero-how-it-works.jpg` | Generate | Professional interaction |
| `src/assets/heroes/hero-contact.jpg` | Generate | Architectural detail |
| `src/components/layout/HeroBanner.tsx` | Create | Reusable hero component |
| `src/components/layout/index.ts` | Modify | Export HeroBanner |
| `src/index.css` | Modify | Add hero utility classes |
| `src/pages/Index.tsx` | Modify | Use HeroBanner |
| `src/pages/public/Services.tsx` | Modify | Use HeroBanner |
| `src/pages/jobs/JobBoardPage.tsx` | Modify | Use HeroBanner |
| `src/pages/public/Professionals.tsx` | Modify | Use HeroBanner |
| `src/pages/public/HowItWorks.tsx` | Modify | Use HeroBanner |
| `src/pages/public/Contact.tsx` | Modify | Use HeroBanner |

## HeroBanner Component Design

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░ BACKGROUND IMAGE ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░ ┌─────────────────────────────────────────────────────────┐ ░░░ │
│ ░░░ │                                                         │ ░░░ │
│ ░░░ │             CONSTRUCTIVE SOLUTIONS                      │ ░░░ │
│ ░░░ │                                                         │ ░░░ │
│ ░░░ │   Find trusted builders, electricians, plumbers...     │ ░░░ │
│ ░░░ │                                                         │ ░░░ │
│ ░░░ │        [Post a Job →]   [Browse Professionals]          │ ░░░ │
│ ░░░ │                                                         │ ░░░ │
│ ░░░ └─────────────────────────────────────────────────────────┘ ░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ GRADIENT OVERLAY (darker at bottom for text contrast)              │
└──────────────────────────────────────────────────────────────────────┘
```

## Image Generation Prompts

For AI image generation, I'll use prompts like:

**Homepage:**
> "Mediterranean Ibiza-style stone villa under construction, warm golden hour sunlight, traditional sandstone blocks, wooden scaffolding, olive tree in foreground, blue sky, construction materials stacked neatly, professional construction site, architectural photography style"

**Services:**
> "Construction workers installing electrical wiring in Mediterranean building, professional tradespeople at work, warm natural lighting, hands-on craftsmanship, Ibiza construction style"

**Jobs:**
> "Professional contractor reviewing building plans at desk with laptop, blueprint documents, organized workspace, Mediterranean window light, construction management office"

## Styling Details

- **Overlay gradient**: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)`
- **Text color**: White with subtle shadow for readability
- **Headline font**: Playfair Display (existing display font)
- **Hero height**: 
  - Homepage: `min-h-[70vh]` 
  - Other pages: `min-h-[40vh]` to `min-h-[50vh]`
- **Mobile responsive**: Reduced height, centered content

## Implementation Order

1. Generate all hero images using Lovable AI
2. Create `src/assets/heroes/` directory and copy images
3. Create `HeroBanner.tsx` component
4. Add hero CSS utilities to `index.css`
5. Update each page to use the new hero component
6. Test across all breakpoints

