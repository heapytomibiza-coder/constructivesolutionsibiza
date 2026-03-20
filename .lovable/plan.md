

# Installation Plan: Dispute & Resolution Framework Document

## What the document contains

The PDF has 4 distinct deliverables. Here is the best order to install them — foundation first, then public-facing content.

---

## Phase 1: Legal Pack Update (Terms of Service)
**Why first:** The legal foundation must be in place before the homepage references it.

**What changes:**
- Expand `public/locales/en/legal.json` → `terms.sections` with the new Payment Terms (section 2), Dispute & Resolution Terms (section 3), Limitation of Liability (section 4), Construction Variability clause (section 5), User Conduct (section 6), and Legal Framework (section 7) from pages 18-26 of the PDF
- Update `terms.date` to current date
- Mirror all changes into `public/locales/es/legal.json` (Spanish translations)
- No code changes needed — the existing `Terms.tsx` component already renders sections dynamically

**Scope:** ~2 files (en/es legal.json), content-only

---

## Phase 2: Dispute Policy Enrichment
**Why second:** The existing dispute policy is already solid but the PDF adds richer Stage 0 (pre-dispute prevention), stronger payment control language, and the "What We Provide / Don't Provide" clarity section.

**What changes:**
- Update `public/locales/en/legal.json` → `dispute` section with:
  - New Stage 0 (Pre-Dispute Prevention) before Stage 1
  - Enhanced payment control & release section (pages 8-9)
  - "What Constructive Solutions Provides / Does Not Provide" section
  - Stronger summary section
- Mirror to Spanish locale
- No component changes — `DisputePolicy.tsx` already handles stages dynamically

**Scope:** ~2 files, content-only

---

## Phase 3: Homepage Conversion Copy
**Why third:** Now the legal backing exists, the homepage can confidently reference payment protection and dispute resolution.

**What changes:**
- Update `public/locales/en/common.json` with the high-conversion copy from pages 11-17:
  - Hero: "Build with Confidence. Get Paid with Certainty."
  - Trust strip: Milestone-Based Payments, Final Payment Protection, Verified Professionals, 28-Day Resolution, No Large Upfront Risk
  - Problem/Solution narrative section
  - "How It Works" 4-step flow (already exists, update copy)
  - Payment Protection section (new)
  - For Professionals / For Clients benefit blocks
  - Final CTA
- Update `src/pages/Index.tsx` to add:
  - Trust strip bar below hero
  - Problem/Solution section
  - Payment Protection section
  - Dual audience blocks (For Professionals / For Clients)
- Mirror to Spanish locale

**Scope:** ~3 files (Index.tsx, en/common.json, es/common.json)

---

## Phase 4: NOT included (future roadmap)
Pages 27-50 cover investor visuals, AI automation ("Constructive Intelligence"), voice-to-case engine, guided question flows, and UX wireframes. These are **product vision documents**, not installable content. They inform future feature development (milestone payments, AI dispute engine, snagging mode) but require significant backend architecture that maps to your `escrow-beta` and `scale-ready` rollout phases.

---

## Summary

| Phase | Files | Type | Effort |
|-------|-------|------|--------|
| 1. Legal Pack | 2 locale files | Content | Medium |
| 2. Dispute Policy | 2 locale files | Content | Small |
| 3. Homepage Copy | 3 files | Content + UI | Medium-Large |

Total: ~7 file changes, no database migrations, no new routes needed.

