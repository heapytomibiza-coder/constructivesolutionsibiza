

## Plan: Portfolio Section + Spanish Copy Polish

### 1. Add Portfolio / Featured Projects Section

Insert a new section between "Our Services" (section 3) and "Why Choose Us" (section 4) in `src/pages/Index.tsx`.

**Structure:** 3 placeholder project cards in a responsive grid, each showing:
- Project type label (e.g. "Villa Renovation")
- Location
- Key stats: budget range, duration, trade categories involved
- A short one-line result statement
- Styled with a subtle gradient background and premium card treatment

Data array defined as a constant (`PORTFOLIO_ITEMS`) with 3 entries. Icons from lucide-react: `Camera`, `MapPin`, `Calendar`, `Euro`.

No images yet — cards use a colored top band to feel visual without requiring photography.

### 2. i18n Keys

Add new keys under `home.portfolio*` and `home.project1*`, `home.project2*`, `home.project3*` to both EN and ES `common.json`.

**English examples:**
- `portfolioTitle`: "Featured Projects"
- `portfolioSubtitle`: "Real results from real builds across Ibiza"
- `project1Type`: "Villa Renovation" / `project1Location`: "Santa Eulària" / `project1Budget`: "€180k–€250k" / `project1Duration`: "14 weeks" / `project1Trades`: "6 trades" / `project1Result`: "Delivered on time. Full interior and exterior transformation."

### 3. Spanish Copy Polish

Review and refine the existing `home.*` Spanish translations for premium construction tone. Key refinements:
- `hero.title`: Strengthen from "Conectamos tu idea con la realidad" to something more commanding like "Construcción de precisión en Ibiza"
- `hero.subtitle`: Tighten to feel authoritative rather than platform-like
- Ensure all new portfolio keys have natural, premium Spanish copy
- Minor tone adjustments across existing `home.*` keys where they still sound too "marketplace"

### Technical Details

- **Files modified:** `src/pages/Index.tsx`, `public/locales/en/common.json`, `public/locales/es/common.json`
- New section order becomes: Hero → How We Work → Services → **Portfolio** → Why Choose Us → Social Proof → Trust → CTA (8 sections)
- No new components or dependencies needed
- No database changes

