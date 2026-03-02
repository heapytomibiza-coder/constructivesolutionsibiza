

## Homepage Elevation Plan — Constructive Solutions Ibiza

The advisor's feedback is spot-on: the current homepage reads like a marketplace directory. For a construction firm, the page needs to project **authority, craftsmanship, and process control**. Here is the revised homepage structure and what changes.

---

### Revised Section Order

```text
1. HERO  (keep, refine copy)
2. HOW WE WORK  (refine from 3 → 4 steps, construction tone)
3. OUR SERVICES  (replace category grid with curated 6-item showcase)
4. WHY CHOOSE US  (new — differentiator section vs WhatsApp/Facebook)
5. SOCIAL PROOF  (new — stats + testimonial quotes)
6. TRUST SIGNALS  (keep existing, minor copy tightening)
7. CTA  (keep)
```

---

### Section-by-Section Changes

**1. Hero** — Strengthen the headline. Current: "Bridging the gap between idea and build." Proposed: keep the search bar and CTA, but update i18n copy to be more commanding. Add a second CTA "See How We Work" alongside "Start Your Project."

**2. How We Work** — Expand from 3 steps (Describe/Match/Build) to 4 steps: **Consult → Plan → Build → Deliver**. New icons: `MessageSquare`, `Ruler`, `HardHat`, `CheckCircle2`. Copy emphasises structured process, not marketplace matching. This signals project management capability.

**3. Our Services** — Replace the 16-item flat grid with a curated 6-card showcase of service *groups*: Renovations, Structural Work, Bespoke Interiors, Project Management, Outdoor & Landscape, Specialist Trades. Each card gets a short description line. A "View all services" link leads to `/services`. This feels premium rather than directory-like.

**4. Why Choose Us (NEW)** — A 2-column layout with icon+text rows contrasting "The Old Way" vs "The Constructive Way":
- No verification → Verified professionals
- Vague WhatsApp briefs → Structured project briefs  
- No accountability → Rating & review system
- Price guessing → Budget alignment from day one

This is the psychological moat the advisor described.

**5. Social Proof (NEW)** — A horizontal stats bar + 1-2 placeholder testimonial cards:
- Stats: "1,000+ jobs created in Ibiza" · "16 trade categories" · "Ibiza-based team"
- Testimonial cards with placeholder quotes (can be swapped for real ones later). Styled as a subtle dark-background band for visual rhythm.

**6. Trust Signals** — Keep existing 3-column layout (Clarity First / Aligned Expectations / Trusted Connections). No changes needed.

**7. CTA** — Keep as-is.

---

### Technical Details

- All new copy added to `public/locales/en/common.json` and `public/locales/es/common.json` under new `home.*` keys.
- All changes in `src/pages/Index.tsx` — no new components needed, just restructured JSX sections.
- Icons from existing `lucide-react` dependency.
- The curated 6 service cards link to `/services` or `/post?category=X` as appropriate.
- No database changes required.

