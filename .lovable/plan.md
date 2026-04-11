

# Interactive Presentation: Platform Overview

## Summary
Create a new `/presentation` route with a fullscreen interactive slide deck that explains Constructive Solutions Ibiza's concept, value proposition, and features. Built as a self-contained React page with keyboard/swipe navigation, no external dependencies.

## Slide Content (8 slides)

1. **Title** — "Constructive Solutions Ibiza" + tagline: "Infrastructure for a broken industry"
2. **The Problem** — WhatsApp chaos, no records, no accountability, trust gaps
3. **The Solution** — Structured project workflow: Post → Match → Communicate → Complete → Review
4. **For Clients** — Guided job posting, intelligent matching, structured quotes, payment protection
5. **For Professionals** — Verified job briefs, skill-based matching, reputation building
6. **Core Systems** — 5 pillars: Job Wizard, Matching, Messaging, Quotes, Reviews (icon cards)
7. **What Makes Us Different** — Side-by-side: Traditional vs Constructive Solutions
8. **CTA** — "Ready to build better?" with Post a Job / Join as Professional buttons

## Technical Approach

### New files
- `src/pages/public/Presentation.tsx` — Full slide deck component with:
  - Fixed 1920×1080 slides scaled to viewport via CSS transform
  - Arrow key + swipe navigation
  - Slide indicator dots
  - Fullscreen toggle
  - Progress bar
  - Clean dark theme with brand accent colors
  - Responsive — works on the user's current 411px mobile viewport and desktop

### Route
- Add lazy route `/presentation` in `App.tsx`
- Public, no auth required

### Design
- Dark background (`slate-900`/`slate-950`)
- Brand amber/orange accents
- Lucide icons for visual elements
- Minimal text, visual-forward
- Smooth slide transitions via CSS

### No database changes, no edge functions, no new dependencies.

## Files changed

| File | Change |
|---|---|
| `src/pages/public/Presentation.tsx` | New — slide deck component |
| `src/App.tsx` | Add lazy route for `/presentation` |

