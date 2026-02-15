

# Phase 7: Event Instrumentation

## Overview

Add 12 new trackEvent calls across the application to replace proxy-based funnels with real behavioral data. No database changes needed -- the existing `analytics_events` table and `track_event()` RPC already support this.

## Current State

4 events are already instrumented:
- `job_wizard_started` (CanonicalJobWizard.tsx, line 139)
- `job_posted` (CanonicalJobWizard.tsx, line 598)
- `pro_onboarding_started` (ProfessionalOnboarding.tsx, line 129)
- `conversation_started` (messageJob.action.ts, line 61)

## New Events (12 total)

### Wizard Step Tracking (3 events)

**1. `job_wizard_step_completed`** -- fires in `handleNext` when advancing
- File: `src/features/wizard/canonical/CanonicalJobWizard.tsx`
- Location: Inside `handleNext`, after validation passes and before `setCurrentStep(nextStep)` (around line 500-503)
- Payload: `{ step: currentStep, stepIndex: getStepIndex(currentStep), category: wizardState.mainCategory }`

**2. `job_wizard_abandoned`** -- fires on beforeunload when wizard has meaningful state
- File: `src/features/wizard/canonical/CanonicalJobWizard.tsx`
- Location: In the `beforeunload` handler (around line 324-333). Use `navigator.sendBeacon` with the Supabase RPC URL since async calls don't work in beforeunload. Alternatively, track on component unmount via a cleanup effect.
- Better approach: Add a useEffect cleanup that fires when the component unmounts (user navigates away) while the wizard has state but hasn't submitted.
- Payload: `{ lastStep: currentStep, stepIndex: getStepIndex(currentStep), category: wizardState.mainCategory }`

**3. `job_wizard_step_viewed`** -- fires when step changes
- File: `src/features/wizard/canonical/CanonicalJobWizard.tsx`
- Location: New useEffect that watches `currentStep` and `isInitialized`
- Payload: `{ step: currentStep, stepIndex: getStepIndex(currentStep) }`

### Hire Flow (2 events)

**4. `hire_initiated`** -- fires when client assigns a professional
- File: `src/pages/jobs/actions/assignProfessional.action.ts`
- Location: After the successful update (around line 85, after the `if (!data)` check)
- Payload: `{ jobId, proId: professionalId }`
- Role: `'client'`

**5. `job_completed`** -- fires when client marks job complete
- File: `src/pages/jobs/actions/completeJob.action.ts`
- Location: After successful update confirmation (around line 61, before `return { success: true }`)
- Payload: `{ jobId }`
- Role: `'client'`

### Review (1 event)

**6. `review_submitted`** -- fires when a review is successfully inserted
- File: `src/pages/jobs/actions/submitReview.action.ts`
- Location: After the successful insert, before the awardProStats block (around line 57)
- Payload: `{ jobId, rating, reviewerRole, visibility }`
- Role: `reviewerRole`

### Pro Onboarding Steps (2 events)

**7. `pro_onboarding_step_completed`** -- fires when advancing through onboarding steps
- File: `src/pages/onboarding/ProfessionalOnboarding.tsx`
- Location: In `handleServiceAreaComplete` (line 133) and `handleServicesComplete` (line 137)
- Payload: `{ step: 'service_area' }` and `{ step: 'services' }` respectively
- Role: `'professional'`

**8. `pro_profile_published`** -- fires when onboarding completes (review step submit)
- File: `src/pages/onboarding/ProfessionalOnboarding.tsx`
- Location: In the review step's completion handler (wherever the final "Go Live" action is)
- Payload: `{ onboardingPhase: 'complete' }`
- Role: `'professional'`

### Admin Actions (4 events)

**9. `admin_force_completed_job`**
- File: `src/pages/admin/actions/forceCompleteJob.action.ts`
- Location: After successful force-complete
- Payload: `{ jobId }`
- Role: `'admin'`

**10. `admin_archived_job`**
- File: `src/pages/admin/actions/archiveJob.action.ts`
- Location: After successful archive (around line 39, before the log insert)
- Payload: `{ jobId, reason }`
- Role: `'admin'`

**11. `admin_verified_professional`**
- File: `src/pages/admin/actions/verifyProfessional.action.ts`
- Location: After successful verification update
- Payload: `{ userId, status }`
- Role: `'admin'`

**12. `admin_suspended_user`**
- File: `src/pages/admin/actions/suspendUser.action.ts`
- Location: After successful suspension
- Payload: `{ userId, reason }`
- Role: `'admin'`

## Implementation Pattern

Each instrumentation point is a single line added after a successful action:

```typescript
trackEvent('event_name', 'role', { key: value });
```

Fire-and-forget. No `await`. No try/catch needed (trackEvent already handles errors internally). Never blocks the user flow.

## Files Modified

| File | Events Added |
|------|-------------|
| `src/features/wizard/canonical/CanonicalJobWizard.tsx` | `job_wizard_step_viewed`, `job_wizard_step_completed`, `job_wizard_abandoned` |
| `src/pages/jobs/actions/assignProfessional.action.ts` | `hire_initiated` |
| `src/pages/jobs/actions/completeJob.action.ts` | `job_completed` |
| `src/pages/jobs/actions/submitReview.action.ts` | `review_submitted` |
| `src/pages/onboarding/ProfessionalOnboarding.tsx` | `pro_onboarding_step_completed` (x2), `pro_profile_published` |
| `src/pages/admin/actions/archiveJob.action.ts` | `admin_archived_job` |
| `src/pages/admin/actions/forceCompleteJob.action.ts` | `admin_force_completed_job` |
| `src/pages/admin/actions/verifyProfessional.action.ts` | `admin_verified_professional` |
| `src/pages/admin/actions/suspendUser.action.ts` | `admin_suspended_user` |

## What This Does NOT Include

- No database migrations (existing `analytics_events` table handles all events)
- No new RPCs (existing `track_event()` RPC works for all events)
- No changes to the trackEvent utility (current signature covers all cases)
- No FunnelsPage upgrade yet (that comes after events are flowing and have data)
- No new UI components

## Build Order

1. Wizard events (step_viewed, step_completed, abandoned) -- highest funnel value
2. Hire flow events (hire_initiated, job_completed) -- marketplace conversion signal
3. Review event -- quality signal
4. Onboarding events -- pro supply funnel
5. Admin events -- audit trail

## Verification

After deployment, run this query to confirm events are flowing:

```sql
SELECT event_name, count(*), max(created_at)
FROM analytics_events
WHERE created_at > now() - interval '1 hour'
GROUP BY event_name
ORDER BY count(*) DESC;
```
