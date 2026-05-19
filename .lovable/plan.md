## Goal
Replace the homepage hero headline and subheadline with the UK-English copy you provided. No layout, route, or feature changes.

## Scope
Copy-only. Two locale files. Spanish gets a faithful translation so the two languages stay in sync.

## Changes

**`public/locales/en/common.json`** — `hero` block:
- `title`: `"Clearer Construction Starts Here"`
- `subtitle`: `"Describe what needs doing and we'll help turn it into a clear project brief for suitable local professionals."`
- Leave `postJob` ("Start a Request"), trust chips (`verifiedPros`, `local`, `clarity`), and the eyebrow ("CONSTRUCTIVE SOLUTIONS IBIZA") unchanged unless you want those reworded too.

**`public/locales/es/common.json`** — matching `hero` block:
- `title`: `"Construcción más clara empieza aquí"`
- `subtitle`: `"Cuéntanos qué necesitas y te ayudamos a convertirlo en un briefing claro para los profesionales locales adecuados."`

## Out of scope
- No changes to `src/pages/Index.tsx`, components, routes, or images.
- No changes to other CTAs reusing "Start a Request" elsewhere on the site.
- No Phase 3 routing work in this step.

## Risk
Very low. String-only edits inside an existing i18n namespace already wired up.

## Test
1. Reload `/` in EN — new headline + subheadline render.
2. Switch to ES — Spanish equivalents render.
3. Confirm no console i18n "missing key" warnings.

## Open question
Do you also want the eyebrow "CONSTRUCTIVE SOLUTIONS IBIZA" and the three trust chips ("Local professionals · Clear project briefs · Built for Ibiza") reviewed for tone in the same pass, or leave them as-is?
