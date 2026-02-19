

# Fix Answers Schema Consistency + Harden Edit/Duplicate/Close

## Problem

The `WizardState.answers` field has an inconsistent schema across the codebase:

- **QuestionsStep** expects `answers.microAnswers` (a container object with nested per-micro stores)
- **EMPTY_WIZARD_STATE** starts with `answers: {}` (no `microAnswers` key)
- **buildJobPayload** treats `answers` as flat key-values via `Object.fromEntries(Object.entries(answers))`
- **hydrateFromJob** sets `answers: microAnswers` (flat, missing container)
- **ClientJobCard duplicate** also sets `answers: microAnswers` (flat)
- **handleCategorySelect / handleSubcategorySelect / applySearchResult** reset to `answers: {}` (breaks `answers.microAnswers` on next read)

This means edit mode, duplicate, and even fresh wizard flows can silently break when QuestionsStep tries to read `answers.microAnswers`.

Additionally, the edit submission path has two gaps:
1. No status gate on the UPDATE (a race could edit a job that moved to `in_progress`)
2. `edit_version` is never incremented (the column exists but no code touches it)

## Changes

### 1. Database: Add `increment_job_edit_version` RPC

Create an atomic increment function so the JS client doesn't need raw SQL:

```sql
CREATE OR REPLACE FUNCTION public.increment_job_edit_version(p_job_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.jobs
  SET edit_version = edit_version + 1
  WHERE id = p_job_id;
$$;

REVOKE ALL ON FUNCTION public.increment_job_edit_version(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_job_edit_version(uuid) TO authenticated;
```

### 2. `src/features/wizard/canonical/types.ts`

- Add `WizardAnswers` type with `microAnswers` as required key plus optional pack tracking fields
- Change `WizardState.answers` from `Record<string, unknown>` to `WizardAnswers`
- Change `EMPTY_WIZARD_STATE.answers` from `{}` to `{ microAnswers: {} }`

### 3. `src/features/wizard/canonical/lib/buildJobPayload.ts`

- Fix `microAnswers` extraction: read from `answers.microAnswers` (not `Object.fromEntries(answers)`)
- Fix `packTracking` extraction: read `_pack_source/_pack_slug/_pack_missing` from the answers container
- Fix `buildHighlights`: scan inside `answers.microAnswers` values only (not top-level tracking keys)

### 4. `src/features/wizard/canonical/lib/hydrateFromJob.ts`

- Don't hard-fail when `job.answers` is null -- default to `{}`
- Set `state.answers = { microAnswers: ..., _pack_source: ..., _pack_slug: ..., _pack_missing: ... }` (canonical container)
- Fallback to `job.micro_slug` when `selected.microSlugs` is missing
- If slugs exist but IDs/names are missing, look them up from `service_micro_categories`
- Guard against invalid date strings (`new Date("bad")`)

### 5. `src/features/wizard/canonical/CanonicalJobWizard.tsx`

**Edit init (line 143):** Change `setCurrentStep(WizardStep.Review)` to `setCurrentStep(deriveStepFromState(result.state))` so edit lands on the right step based on state completeness.

**Edit submit (lines 678-698):** 
- Add `.in('status', ['draft', 'ready', 'open'])` to the UPDATE query + `.select('id')` to detect 0-row updates
- If 0 rows updated, toast "This job can't be edited anymore" and redirect
- Call `supabase.rpc('increment_job_edit_version', { p_job_id: editJobId })` after successful update

**Category/subcategory reset (lines 441, 457):** Change `answers: {}` to `answers: { microAnswers: {} }` so the canonical shape is preserved on downstream resets.

### 6. `src/features/wizard/canonical/lib/resolveWizardMode.ts`

**applySearchResult (line 370):** Change `answers: {}` to `answers: { microAnswers: {} }` to match canonical shape.

### 7. `src/pages/dashboard/client/components/ClientJobCard.tsx`

**handleDuplicate:** Fix draft answers shape from `answers: microAnswers` to `answers: { microAnswers, _pack_source, _pack_slug, _pack_missing }`. Also switch to `sessionStorage.setItem('wizardDraftChecked', '1')` + `navigate('/post?resume=true')` for smoother UX (skip draft prompt).

### 8. Translation keys

Add to `wizard.json` (EN + ES):
- `toasts.editNotAllowed`: "This job can't be edited anymore. Duplicate it instead." / "Este trabajo ya no se puede editar. Duplica el trabajo en su lugar."
- `toasts.editLoadFailed`: "Could not load job for editing" / "No se pudo cargar el trabajo para editarlo"

## Files touched

| File | Action |
|------|--------|
| DB migration (RPC) | Create `increment_job_edit_version` function |
| `src/features/wizard/canonical/types.ts` | Add `WizardAnswers` type, fix empty state |
| `src/features/wizard/canonical/lib/buildJobPayload.ts` | Fix answers extraction + highlights |
| `src/features/wizard/canonical/lib/hydrateFromJob.ts` | Fix answers shape, add fallbacks |
| `src/features/wizard/canonical/CanonicalJobWizard.tsx` | Status-gate edit, increment version, fix resets |
| `src/features/wizard/canonical/lib/resolveWizardMode.ts` | Fix `applySearchResult` answers reset |
| `src/pages/dashboard/client/components/ClientJobCard.tsx` | Fix duplicate draft shape |
| `public/locales/en/wizard.json` | Add toast keys |
| `public/locales/es/wizard.json` | Add toast keys (Spanish) |

## What this solves

- Edit mode round-trips cleanly (DB write matches DB read matches wizard state)
- Duplicate preserves question answers correctly
- Fresh wizard and search-result flows don't break `answers.microAnswers`
- Edit is blocked on jobs that moved past `open` status
- `edit_version` increments atomically on every successful edit
- Wizard lands on the correct step in edit mode (not always Review)

