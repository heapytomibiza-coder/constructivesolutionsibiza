
# Edit Job, Duplicate Job, and Close Job -- Asker Dashboard

## Overview

Add three key actions to every job card in the Asker Dashboard: **Edit**, **Duplicate**, and **Close**. The Edit flow reuses the existing wizard in "edit mode" (prefilled from the saved job), while Duplicate creates a new draft copy. Close lets the asker cancel/archive a job they no longer need.

## What Changes

### 1. Database: Add `edit_version` column to `jobs`

Add a single column to track edit history:

```sql
ALTER TABLE public.jobs ADD COLUMN edit_version integer NOT NULL DEFAULT 0;
```

No new tables needed for V1. The existing `updated_at` column already auto-updates. A full `job_events` audit table can come later.

### 2. New Route: `/post?edit=<jobId>`

The existing `/post` page mounts `CanonicalJobWizard`. We add an `edit` query param that triggers "edit mode":

- Wizard detects `?edit=<jobId>` on mount
- Fetches the job row from DB (owner-checked via RLS)
- Hydrates `WizardState` from the saved `answers` JSON
- Sets a flag `isEditMode = true` with the `editJobId`
- On submit: **UPDATE** instead of INSERT, increment `edit_version`, toast "Job updated!"
- Redirect back to dashboard or job ticket page

### 3. Editing Rules (Safe by Default)

- **Owner-only**: RLS already enforces `auth.uid() = user_id` on UPDATE
- **Status gate**: Only allow editing jobs with status `open`, `ready`, or `draft`. Block edits on `completed`, `cancelled`, `in_progress`
- **What can change**: All wizard fields (category, micro tasks, logistics, extras, answers). Title and teaser are rebuilt from the updated state.
- **What stays**: `id`, `user_id`, `created_at`, `attribution`, `assigned_professional_id`

### 4. Duplicate Job

- Copy all wizard-relevant fields from the existing job into a fresh `WizardState`
- Navigate to `/post` with the state pre-loaded in sessionStorage
- No `edit` param -- this creates a brand new job
- The wizard treats it as a normal new draft

### 5. Close/Cancel Job

- Simple status update to `cancelled` (need to add to valid_status constraint)
- Confirmation dialog before closing
- Already partially implemented in `JobTicketDetail` (as "Close Job")

### 6. UI Changes to `ClientJobCard`

Add Edit and Duplicate buttons to each job card:

| Job Status | Edit | Duplicate | Close |
|------------|------|-----------|-------|
| draft/ready | Yes | Yes | Yes |
| open | Yes | Yes | Yes |
| in_progress | No | Yes | Yes |
| completed | No | Yes | No |

### 7. Wizard Changes (`CanonicalJobWizard.tsx`)

The wizard's mode resolver already handles multiple init modes. We add one more:

```text
Priority order (updated):
1. ?edit=<jobId>  --> fetch job, hydrate, edit mode
2. Search selection --> direct to Questions
3. Deep-link params --> apply and navigate
4. Resume flag --> restore draft
5. Draft exists --> prompt user
6. Fresh start
```

Key changes in the wizard:
- New state: `isEditMode`, `editJobId`
- New hydration function: `hydrateWizardFromJob(jobRow)` that maps `answers` JSON back to `WizardState`
- Submit handler branches: if `isEditMode`, run UPDATE + increment `edit_version`; else run INSERT as today
- Review step shows "Save Changes" instead of "Post Job" in edit mode
- Skip draft prompt when in edit mode

### 8. Files to Create/Modify

**New files:**
- `src/features/wizard/canonical/lib/hydrateFromJob.ts` -- Maps a job DB row back into `WizardState`

**Modified files:**
- `src/features/wizard/canonical/CanonicalJobWizard.tsx` -- Edit mode detection, UPDATE path, UI label changes
- `src/features/wizard/canonical/lib/resolveWizardMode.ts` -- Add edit mode to resolution priority
- `src/features/wizard/canonical/steps/ReviewStep.tsx` -- "Save Changes" button label in edit mode
- `src/pages/dashboard/client/components/ClientJobCard.tsx` -- Add Edit, Duplicate, Close buttons
- `src/pages/jobs/PostJob.tsx` -- Pass edit mode context (minor, if needed)

**Database migration:**
- Add `edit_version` column to `jobs` table

### 9. Hydration Logic (Technical Detail)

The `hydrateFromJob` function maps the stored `answers` JSON back to `WizardState`:

```text
job.answers.selected --> mainCategory, subcategory, microNames, microIds, microSlugs
job.answers.microAnswers --> answers
job.answers.logistics --> logistics (with date string -> Date conversion)
job.answers.extras --> extras
job.category / job.subcategory --> mainCategory, subcategory (fallback)
```

Category/subcategory IDs need a lookup since they're not stored in the job row (only names are). The hydration function will query `service_categories` and `service_subcategories` by name to get the IDs.

### 10. Translation Keys

Add to `wizard.json` (EN + ES):
- `buttons.saveChanges`: "Save Changes" / "Guardar Cambios"
- `toasts.updateSuccess`: "Job updated!" / "Trabajo actualizado!"
- `toasts.duplicateCreated`: "Draft created from copy" / "Borrador creado desde copia"

Add to `dashboard.json` (EN + ES):
- `client.edit`: "Edit" / "Editar"
- `client.duplicate`: "Duplicate" / "Duplicar"
- `client.close`: "Close" / "Cerrar"
- `client.closeConfirm`: "Are you sure you want to close this job?" / "Seguro que quieres cerrar este trabajo?"
- `client.jobUpdated`: "Job updated successfully" / "Trabajo actualizado correctamente"
