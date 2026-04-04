

## Plan: Implement Tasker Onboarding 3-Step Flow

### Summary

Convert the 4-step professional onboarding wizard into a 3-step activation flow by merging zones into Step 1, stripping profile-building fields, fixing the auth gate, updating copy, and correcting the post-activation redirect.

### Phase 1: Quick Wins (no structural risk)

**1. `src/pages/auth/Auth.tsx` — line 47**
- Change `const allowProfessional = searchParams.get('pro') === '1'` → `const allowProfessional = searchParams.get('pro') !== '0'`

**2. `src/components/auth/IntentSelector.tsx` — line 28**
- Change `allowProfessional = false` → `allowProfessional = true`

**3. `src/pages/onboarding/steps/ReviewStep.tsx` — line 84**
- Change `navigate('/professional/listings?welcome=1')` → `navigate('/dashboard/pro?welcome=1')`
- Add `toast.success(t('review.liveSuccess'))` before the navigate call

**4. `public/locales/en/onboarding.json` — copy updates**
- `wizard.stepLabels.basic_info`: "About You" → "Get Set Up"
- `wizard.stepLabels.services`: "The Work You Do" → "Choose Your Jobs"
- `wizard.stepHeaders.basic_info`: "Step 1: About You" → "Step 1: Get Set Up"
- `wizard.stepHeaders.services`: "Step 3: The Work You Do" → "Step 2: Choose Your Jobs"
- `wizard.stepHeaders.review`: "Step 4: Go Live!" → "Step 3: Go Live"
- `basicInfo.title`: "Tell us about yourself" → "Let's get you ready to receive jobs"
- `basicInfo.description`: "This is what clients will see when they view your profile." → "Your name, number, and work areas — that's all we need to start matching you."
- `basicInfo.nextStep`: "Next Step" → "Next: Choose Your Jobs"
- `serviceUnlock.continue`: "Continue" → "Start Receiving Jobs"
- `review.goLive`: "Go Live" → "Go Live — Start Receiving Jobs"
- `review.aboutYou` → "Your details"
- `review.aboutYouDesc` → "Name, phone, and work areas"
- Remove `wizard.stepLabels.service_area` and `wizard.stepHeaders.service_area` (keep keys but they won't render)

**5. `public/locales/es/onboarding.json`** — mirror all copy changes in Spanish

### Phase 2: Structural Merge

**6. `src/pages/onboarding/steps/BasicInfoStep.tsx`**
- Remove `bio`, `tagline`, `business_name` from: interface, state, query, mutation, and form JSX (lines 181-224)
- Remove unused imports (`Textarea`, `FileText`)
- Import zone components: `ZoneTile`, `IslandWideTile`, `IBIZA_ZONES`, `allZoneIds` from `@/shared/components/professional`
- Add zone state (`selectedZones`, `islandWide`) and zone toggle/island-wide handlers (reuse logic from ServiceAreaStep)
- Add zone picker UI below phone field (island-wide tile + grouped zone tiles)
- Update mutation to also upsert `professional_profiles` with `service_zones`, `service_area_type: 'zones'`, and `onboarding_phase: nextPhase(currentPhase, 'service_area')` — use upsert pattern from ServiceAreaStep
- Update validation: require name non-empty AND zones ≥ 1
- Load existing zones in the query (add `service_zones` to the `professional_profiles` select)

**7. `src/pages/onboarding/ProfessionalOnboarding.tsx`**
- Remove `'service_area'` from `WizardStep` type union
- Remove `service_area` entry from `STEPS` array (result: 3 items with icons `User`, `Briefcase`, `Rocket`)
- Remove `MapPin` import
- Update `phaseToStep`: `service_area` phase → `'services'` (user already saved zones in step 1)
- `handleBasicInfoComplete`: change `setCurrentStep('service_area')` → `setCurrentStep('services')`
- Remove `handleServiceAreaComplete` handler entirely
- Remove `ServiceAreaStep` render branch (lines 301-308)
- Update `ServiceUnlockStep` `onBack`: `setCurrentStep('service_area')` → `setCurrentStep('basic_info')`
- Update `stepCompletion` array from 4 items to 3: `[hasName && hasPhone && hasZones, hasServices, false]`
- Deep-link fallback: if `stepParam === 'service_area'`, treat as `'basic_info'`
- TrackerView: remove `'service_area'` from `stepOrder`, update `phaseToCurrentStep` accordingly

**8. `src/pages/onboarding/steps/ReviewStep.tsx`**
- Merge "About you" and "Where you work" checklist items into one: "Your details — Name, phone, and work areas"
- Remove the `service_area` checklist item
- Update the merged item's `onClick` to navigate to `'basic_info'`

**9. `src/pages/onboarding/steps/index.ts`**
- Keep `ServiceAreaStep` export (may be used elsewhere) — no change needed

### Implementation Notes

- **Phase progression**: `nextPhase(currentPhase, 'service_area')` in BasicInfoStep advances through both `basic_info` and `service_area` phases in one save. The existing `nextPhase` utility handles forward-only advancement correctly.
- **Existing users at `service_area` phase**: `phaseToStep['service_area']` → `'services'` means they skip to the job picker. Their zones are already saved. Safe.
- **Edit mode deep link `?step=service_area`**: Falls back to `'basic_info'` so zone editing goes to the merged step.
- **ServiceAreaStep file**: Not deleted — removed from wizard only. May be used in standalone editing contexts.
- **BasicInfoStep mutation**: Changes from `update` to `upsert` on `professional_profiles` to handle edge cases where the row doesn't exist yet.

### Acceptance Checklist

- [ ] `/auth` shows "I'm a tradesperson" by default (no `?pro=1` needed)
- [ ] Step 1 shows name, phone, and zone tiles — no bio/tagline/business name
- [ ] Step 1 CTA: "Next: Choose Your Jobs"
- [ ] Cannot proceed from Step 1 without name and ≥1 zone
- [ ] Step 2 is the service picker, CTA: "Start Receiving Jobs"
- [ ] Step 3 checklist shows 2 items (details + jobs), CTA: "Go Live — Start Receiving Jobs"
- [ ] Go Live redirects to `/dashboard/pro?welcome=1` with success toast
- [ ] Progress bar shows 3 steps, labels: "Get Set Up / Choose Your Jobs / Go Live"
- [ ] Returning user at `service_area` phase lands on services step
- [ ] Edit mode `?step=service_area` deep link opens Step 1
- [ ] Edit mode tracker shows 3 steps

### Build Order

1. Auth gate fix (Auth.tsx + IntentSelector.tsx)
2. Copy/translation updates (en + es JSON files)
3. ReviewStep redirect + toast + checklist merge
4. BasicInfoStep — strip fields + merge zones
5. ProfessionalOnboarding — remove service_area step, update navigation/tracker

