

# Tighten Profile Page Architecture — Context-Passing and Empty States

## Current state (already correct)

The public profile is already a composed view pulling from the right sources:
- Identity: `professional_profiles`
- Services: `service_listings_browse` (public-safe view, rollout-gated)
- Specialisations: `professional_micro_preferences` (badges, not cards)
- Geography: `service_zones` via zone lookup
- Trust: verification badge now, reviews gated to `trust-engine`
- CTAs: `buildWizardLink` for job creation, disabled message button
- Sticky sidebar on desktop, fixed bottom CTA on mobile

Section ordering is already Hero > Services > About > Specialisations > Service Area > Reviews.

## What needs tightening

### 1. Service card "Start Job" context-passing

Currently service cards only link to `/services/listing/:id` (view only). The `buildWizardLink` only passes `professionalId`. To make the profile a proper marketplace funnel, the wizard link builder needs a new mode that carries both professional and service context.

**Change in `wizardLink.ts`:** Add a `directWithService` mode:
```
| { mode: "directWithService"; professionalId: string; microSlug: string }
```
This generates `/post?pro=<id>&micro=<slug>`, so the wizard can pre-select both the professional and the service category.

**No change to service cards yet** — this prepares the infrastructure. Service cards keep linking to the detail page. The detail page's own CTA can use this new mode.

### 2. Empty state hardening

Audit each section for graceful degradation when data is missing:
- **Services**: already hidden when no listings — correct
- **About**: shows "hasn't added a bio yet" — correct
- **Specialisations**: hidden when empty — correct
- **Service Area**: hidden when no zones — correct
- **Quick Facts**: services count shows "0 offered" when empty — should show "Contact for details" instead

**Change in `ProfessionalDetails.tsx`:** Update the services count quick fact to show a friendlier empty state when `services_count` is 0.

### 3. Verification badge logic tightening

The hero currently shows "Verified Tasker profile" text even when `verification_status !== 'verified'`. This should be conditional — only show the shield + text when actually verified.

**Change in `ProfessionalDetails.tsx`:** Wrap the "Verified Tasker profile" trust signal in a `verification_status === 'verified'` check.

## Files modified

- `src/features/wizard/lib/wizardLink.ts` — add `directWithService` mode
- `src/pages/public/ProfessionalDetails.tsx` — empty state for services count, conditional verification text

## No database changes needed

