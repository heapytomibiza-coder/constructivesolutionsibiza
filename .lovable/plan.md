

## Plan: Create Hidden Value & Pricing Pages

### What we're building

Three new pages, gated behind the rollout system so they exist in code but are **not publicly accessible or linked** until you're ready:

1. **`/for-professionals`** — The scrollable value story (Sections 1–8 from your spec: problem → platform value → reputation ladder → pricing → CTA)
2. **`/pricing`** — Focused pricing page with the reputation-first philosophy, annual plans (€333/€666/€2000), Gold invite-only messaging, tax-friendly note
3. **`/reputation`** — The reputation score system explained (4 metrics, Bronze→Silver→Gold ladder, how Gold is earned not bought)

### How they stay hidden

Each route gets `minRollout: 'trust-engine'` in the registry. Since `CURRENT_ROLLOUT` is `'pipe-control'`, these pages will be:
- Not shown in navigation
- Blocked by `RolloutGate` if someone guesses the URL
- Zero impact on current site

### Philosophy protection

- **No "pay-to-win" language anywhere** — Gold is always "Invite Only / Earned"
- Silver is positioned as "Most Popular" — the natural revenue driver
- Elite is framed as "Company Scale" not "Premium Status"
- Reputation Score section reinforces: Quality 35%, Reliability 30%, Communication 20%, Completion 15%
- Tax-friendly section uses careful "may be deductible, consult your accountant" language

### Technical approach

**Files to create:**
- `src/pages/public/ForProfessionals.tsx` — The full value story page (13 sections, icon-driven, short copy, value metrics per feature)
- `src/pages/public/Pricing.tsx` — Clean pricing cards + annual plans + reputation philosophy
- `src/pages/public/Reputation.tsx` — Score system, ladder visual, Gold criteria, data insights teaser

**Files to edit:**
- `src/app/routes/registry.ts` — Add 3 routes with `minRollout: 'trust-engine'`
- `src/App.tsx` — Add imports and `<Route>` entries wrapped in `<RolloutGate>`
- `public/locales/en/common.json` — Add all i18n keys for the three pages

### Page structure (key sections)

**For Professionals page:**
1. Hero — "Run Your Trade Business With One Platform"
2. The Problem — icons + typical monthly costs grid
3. The Constructive Solution — 6 feature blocks (profile, wizard, matching, job cards, reviews, notifications) each with equivalent value
4. Time Saved — €800/month in lost enquiry time
5. Value Stack — total ≈€755/month equivalent
6. Reputation Ladder — Bronze → Silver → Gold (earned)
7. Pricing Cards — Bronze €333/yr, Silver €666/yr, Gold invite-only, Elite €2000/yr
8. Tax Friendly note
9. Final CTA — "One Job Can Pay For Your Membership"

**Pricing page:**
- Hero with strong number anchoring
- Monthly vs Annual toggle (€33/€66/€199 monthly, €333/€666/€2000 annual)
- Reputation-first messaging
- Feature comparison table
- FAQ section

**Reputation page:**
- Score formula with 4 weighted metrics
- Visual ladder (Bronze → Silver → Gold)
- Gold criteria and benefits (market data insights)
- "What builders say" testimonial placeholders

### What this does NOT change
- No existing pages modified visually
- No nav links added (rollout-gated)
- No database changes needed
- No new dependencies
- Existing homepage, HowItWorks, and all current pages untouched

### Implementation order
1. Add routes to registry (rollout-gated)
2. Create the three page components using existing `PublicLayout`, `HeroBanner`, `Card` components
3. Add i18n keys
4. Wire routes in App.tsx

