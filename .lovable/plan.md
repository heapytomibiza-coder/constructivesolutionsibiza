

## Plan: "Can't Find What You Need?" Custom Request Fallback

### Problem
When a user can't find their service in the structured taxonomy (Steps 1-3), they have no escape route. They leave, post in the wrong category, or think the platform is limited. This is especially important for Ibiza where hybrid/unusual services are common.

### Architecture Decision: Wizard Mode, Not a New Step

Rather than adding a new step to `STEP_ORDER` (which would break URL sync, progress bars, step indices, and validation), we add a **wizard mode** (`structured` | `custom`) that:
- Activates from a CTA at the bottom of Category, Subcategory, and Micro steps
- Opens a **CustomRequestForm** component rendered _inside_ the existing Card area (replaces the current step content)
- On submit, populates `wizardState` with synthetic values and jumps to **Logistics** (Step 5) — not directly to Review, because location/budget/timing are still needed for the job card to be useful
- Questions step is skipped (no pack exists for custom requests)
- Review step renders custom title/description instead of micro names

### Database Changes

**Migration: Add `is_custom_request` column to `jobs` table**

```sql
ALTER TABLE public.jobs
  ADD COLUMN is_custom_request boolean NOT NULL DEFAULT false;
```

No new tables needed. Custom requests store into the same `jobs` table with:
- `is_custom_request = true`
- `category` = selected parent category  
- `micro_slug = NULL`
- `title` = user-provided job title
- `description` = user-provided description + specs merged
- `answers` = `{ selected: {...}, microAnswers: {}, custom: { title, description, specs } }` — keeps the custom data in the canonical answers container for traceability

### Type Changes (`types.ts`)

Add to `WizardState`:

```ts
// Wizard mode: structured (normal) or custom (fallback)
wizardMode: 'structured' | 'custom';

// Custom request fields (only used when wizardMode === 'custom')
customRequest?: {
  jobTitle: string;
  description: string;
  specs?: string;
};
```

Update `EMPTY_WIZARD_STATE` with `wizardMode: 'structured'`.

### New Component: `CustomRequestForm.tsx`

Location: `src/features/wizard/canonical/steps/CustomRequestForm.tsx`

Fields (all i18n-ready with `wizard` namespace keys):
1. **Category** — dropdown of 9 parent categories (re-uses existing category data, pre-filled if already selected)
2. **Job Title** — required, min 4 chars
3. **Job Description** — required, min 20 chars, textarea
4. **Specific Specs** — optional textarea

On submit → sets `wizardMode: 'custom'`, populates `customRequest`, sets `mainCategory`/`mainCategoryId` from dropdown, then jumps to **Logistics** step (skipping Subcategory, Micro, and Questions).

### Wizard Routing Changes (`CanonicalJobWizard.tsx`)

1. **New state**: `wizardMode` tracked in `wizardState` (persisted in draft)
2. **New state**: `showCustomForm` boolean to toggle the form overlay
3. **CTA**: "Can't find what you need?" link at bottom of Category, Subcategory, and Micro step renders
4. **Custom form submit handler**: Sets mode + state, jumps to `WizardStep.Logistics`
5. **`handleNext`**: When `wizardMode === 'custom'`, skip from wherever we are straight to Logistics (bypasses Subcategory → Micro → Questions chain)
6. **Progress bar**: When in custom mode, show simplified progress (e.g., "Custom Request → Details → Review")

### Validation Changes (`stepValidation.ts`)

- `validateWizardState` and `validateWizardForSubmission`: When `wizardMode === 'custom'`, skip subcategory/micro checks, require `customRequest.jobTitle` and `customRequest.description` instead

### Payload Changes (`buildJobPayload.ts`)

When `wizardMode === 'custom'`:
- `title` = `customRequest.jobTitle`
- `description` = merged description + specs
- `teaser` = first 200 chars of description
- `micro_slug` = `null`
- `subcategory` = `null` (or "custom-request")
- `is_custom_request` = `true`
- `answers.custom` = `{ jobTitle, description, specs }` for traceability

### Review Step Changes (`ReviewStep.tsx`)

When `wizardState.wizardMode === 'custom'`:
- Header shows category badge + "Custom Request" label
- "What you need" section shows the custom title + description instead of micro names
- Specs shown if provided
- Everything else (location, budget, photos) renders normally

### i18n Keys (both `en/wizard.json` and `es/wizard.json`)

```json
"custom": {
  "cta": "Can't find what you need?",
  "ctaDescription": "Post a custom request — we'll format it into a proper job card.",
  "ctaButton": "Post Custom Request",
  "headline": "Describe what you need",
  "subtitle": "Tell us what you need. We'll turn it into a clear job card for professionals.",
  "categoryLabel": "Main category",
  "categoryPlaceholder": "Select a category",
  "titleLabel": "Job title",
  "titlePlaceholder": "e.g. Build a pergola with integrated LED strips",
  "titleHelp": "Be specific — this becomes the headline.",
  "descriptionLabel": "Job description",
  "descriptionPlaceholder": "What needs doing? Where? Any constraints?",
  "descriptionHelp": "Include location context, scale, and what \"done\" looks like.",
  "specsLabel": "Specific specs (optional)",
  "specsPlaceholder": "Measurements, materials, brand preferences, deadlines...",
  "badge": "Custom Request"
}
```

### Files to Create
1. `src/features/wizard/canonical/steps/CustomRequestForm.tsx`

### Files to Modify
1. `src/features/wizard/canonical/types.ts` — add `wizardMode`, `customRequest` to state + empty defaults
2. `src/features/wizard/canonical/CanonicalJobWizard.tsx` — add custom form toggle, CTA in steps 1-3, routing logic
3. `src/features/wizard/canonical/lib/buildJobPayload.ts` — handle custom mode in `buildJobInsert` and `validateWizardState`
4. `src/features/wizard/canonical/lib/stepValidation.ts` — relax subcategory/micro checks when custom
5. `src/features/wizard/canonical/steps/ReviewStep.tsx` — render custom request data
6. `public/locales/en/wizard.json` — add `custom.*` keys
7. `public/locales/es/wizard.json` — add `custom.*` keys (Spanish)
8. DB migration — add `is_custom_request` column

### Flow Summary

```text
Normal:     Category → Subcategory → Micro → Questions → Logistics → Extras → Review
Custom:     Category (CTA click) → CustomRequestForm → Logistics → Extras → Review
```

### Strategic Benefit
Every custom request becomes a data signal. You can later query `SELECT category, title, description FROM jobs WHERE is_custom_request = true` to identify patterns and convert them into new structured microservices — evolving taxonomy from real demand.

