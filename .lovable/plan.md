

## Plan: Custom Request Hardening — 7 Concrete Fixes

After reviewing the current implementation, here are the specific issues and fixes needed to make the custom request flow production-ready.

### Issues Found

1. **`validateWizardState` is weaker than `validateWizardForSubmission`** — it doesn't check timing/budget/consultation, so jobs can submit with missing logistics fields
2. **`canAdvance()` for Logistics only checks location** — doesn't match Step 5 required fields (budget, timing, consultation), so users reach Review then fail on submit
3. **`canLeaveStep()` blocks custom mode** at subcategory/micro steps (edge case in jump/edit flows)
4. **Date crash after draft resume** — `logistics.startDate.toLocaleDateString()` and `.toISOString()` in `buildJobPayload.ts` will throw when dates are strings after JSON parse from sessionStorage
5. **English "Specific specs:" hardcoded into stored description** — bakes English label into DB content
6. **`handleCategorySelect`/`handleSubcategorySelect` don't reset `wizardMode`** — if user goes custom then backs out and picks structured, mode stays `custom`
7. **Missing `specsSectionLabel` i18n key** — ReviewStep uses `specsLabel` (the form label) for the review card display
8. **`hydrateFromJob` doesn't restore custom request data** — editing a custom job opens in structured mode with empty fields
9. **Category names in CustomRequestForm dropdown show English DB names** — not translated
10. **Budget min/max always null** — `parseBudgetRange` can't parse preset keys like `under_500`

### Changes

**`src/features/wizard/canonical/lib/buildJobPayload.ts`**
- Make `formatDate` tolerate string inputs (draft resume safety)
- Make `startDate` extraction tolerate strings
- Make `buildHighlights` date line tolerate strings
- Add `BUDGET_PRESETS` map and use it in budget parsing so `budget_min`/`budget_max` are populated
- Update `determineBudgetType` to check presets first
- Remove hardcoded "Specific specs:" from description — store raw description only, keep specs in `answers.custom`
- Align `validateWizardState` with `isStep5Complete` (require timing/budget/consultation)

**`src/features/wizard/canonical/lib/stepValidation.ts`**
- Update `canLeaveStep` to skip subcategory/micro checks when `wizardMode === 'custom'`

**`src/features/wizard/canonical/CanonicalJobWizard.tsx`**
- Update `canAdvance()` Logistics case to use `isStep5Complete`
- Reset `wizardMode: 'structured'` and `customRequest: undefined` in `handleCategorySelect` and `handleSubcategorySelect`
- Normalize draft dates in `handleResumeDraft` using a safe date parser

**`src/features/wizard/canonical/lib/hydrateFromJob.ts`**
- Add `is_custom_request` to select query and `JobRow` interface
- Detect custom mode from `is_custom_request` column or `answers.custom` presence
- Set `wizardMode` and `customRequest` in hydrated state
- Clear structured fields when custom

**`src/features/wizard/canonical/steps/CustomRequestForm.tsx`**
- Translate category names in dropdown using `txCategory`

**`src/features/wizard/canonical/steps/ReviewStep.tsx`**
- Use `specsSectionLabel` key for specs display in review card

**`public/locales/en/wizard.json`** and **`public/locales/es/wizard.json`**
- Add `specsSectionLabel` key to `custom` block

### Files to modify
1. `src/features/wizard/canonical/lib/buildJobPayload.ts`
2. `src/features/wizard/canonical/lib/stepValidation.ts`
3. `src/features/wizard/canonical/CanonicalJobWizard.tsx`
4. `src/features/wizard/canonical/lib/hydrateFromJob.ts`
5. `src/features/wizard/canonical/steps/CustomRequestForm.tsx`
6. `src/features/wizard/canonical/steps/ReviewStep.tsx`
7. `public/locales/en/wizard.json`
8. `public/locales/es/wizard.json`

