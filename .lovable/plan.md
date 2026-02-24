

# Spanish Translation Audit — Findings and Fix Plan

## Issues Found

### 1. Footer: "Dispute Policy" hardcoded in English
**File:** `src/shared/components/layout/PublicFooter.tsx` line 45
**Problem:** The link text `Dispute Policy` is a raw string, not using `t()`.
**Fix:** Add `footer.disputePolicy` key to both locale files and use `t('footer.disputePolicy')`.

### 2. How It Works: "Why this matters" hardcoded in English
**File:** `src/pages/public/HowItWorks.tsx` line 301
**Problem:** The label `Why this matters` in every StepCard is a raw string.
**Fix:** Add `howItWorks.whyThisMatters` key to both locale files and use `t('howItWorks.whyThisMatters')`. The `StepCard` component needs access to the `t` function (pass it as a prop or use `useTranslation` inside the component).

### 3. Privacy Policy page — entirely hardcoded English
**File:** `src/pages/public/Privacy.tsx`
**Problem:** The entire page (title, date, all 7 sections) is raw English strings with zero `t()` calls. Unlike Terms and Dispute Policy (which have a comment saying "Legal pages are intentionally hardcoded in English for precision"), the Privacy page has no such note and should follow the same pattern as the others OR be translated.
**Decision needed:** Are legal pages (Privacy, Terms, Dispute Policy) intentionally English-only? If yes, no change needed for these three. If they should be bilingual, all three need full translation.

### 4. Terms of Service page — entirely hardcoded English
**File:** `src/pages/public/Terms.tsx`
**Same situation as Privacy.** Also references "Dispute Policy" as hardcoded text on line 87.

### 5. Dispute Policy page — entirely hardcoded English
**File:** `src/pages/public/DisputePolicy.tsx`
**Same situation.** Has a comment on line 3: `// NOTE: Legal pages are intentionally hardcoded in English for precision.`

### 6. Admin DrilldownTable — "No results" / "Showing X–Y" hardcoded
**File:** `src/pages/admin/components/DrilldownTable.tsx` line 86-87
**Low priority** — admin-only page, but still English when in ES mode.

---

## What's Already Working Well
- Homepage: fully translated
- Nav and footer links (except "Dispute Policy"): translated
- How It Works page: all content translated (except "Why this matters" label)
- About page: fully translated
- Auth page: fully translated
- Contact page: fully translated
- Categories and subcategories: fully translated
- Search bar, trust badges, CTAs: all translated

---

## Implementation Plan

### Quick wins (code changes only)

**A. PublicFooter.tsx — add `t()` for Dispute Policy link**
- Add `"disputePolicy": "Dispute Policy"` to `public/locales/en/common.json` under `footer`
- Add `"disputePolicy": "Política de Disputas"` to `public/locales/es/common.json` under `footer`
- Replace hardcoded string with `{t('footer.disputePolicy')}`

**B. HowItWorks.tsx — translate "Why this matters"**
- Add `"whyThisMatters": "Why this matters"` to `public/locales/en/common.json` under `howItWorks`
- Add `"whyThisMatters": "Por qué es importante"` to `public/locales/es/common.json` under `howItWorks`
- Add `useTranslation` inside the `StepCard` component (or pass `t` as a prop) and replace the hardcoded string

### Decision required: Legal pages

The three legal pages (Privacy, Terms, Dispute Policy) are **all** hardcoded English. The Dispute Policy file has an explicit comment saying this is intentional. The question is whether you want them bilingual or English-only.

- **If English-only is fine:** No changes needed for these three pages. Just fix the footer link label (item A above).
- **If bilingual:** Each page needs a full Spanish translation added to locale files and the components rewritten to use `t()`. This is ~100+ translation keys across the three pages.

### Bump cache version
After changes, bump `queryStringParams: { v: '...' }` in `src/i18n/index.ts`.

