

# Phase 4+5: Translate Onboarding, Professional, and Dashboard Components

## Scope

This covers all remaining hardcoded English in authenticated pages across three groups:

### Group A: Onboarding (5 files, ~60 keys)

**ProfessionalOnboarding.tsx** — Step labels, headers, tracker text:
- `STEPS` array labels: "About You", "Where You Work", "The Work You Do", "Go Live"
- Step headers: "Step 1: About You", "Edit your professional profile", etc.
- Tracker: "Your progress", "X of Y done", "Edit", "Start"
- "Back to Dashboard", "Back to Overview", "Loading..."

**BasicInfoStep.tsx** — Form labels and messages (~15 keys):
- "Tell us about yourself", "This is what clients will see..."
- "Your Name", "Phone Number", "Business Name", "Tagline", "About You"
- Placeholders: "e.g. Juan García", "+34 600 000 000"
- Helper text: "We'll send you WhatsApp notifications...", "A short headline..."
- Buttons/toasts: "Next Step", "Saved!", "Please enter your name", "Something went wrong..."

**ServiceAreaStep.tsx** — Zone selection (~10 keys):
- "Where do you work?", "Tap the areas of Ibiza..."
- "Select all", "Deselect all"
- "Great! You'll receive jobs from across Ibiza", "X areas selected"
- "Please select at least one area", "Go Back", "Next Step"

**ServiceUnlockStep.tsx** — Service picker (~15 keys):
- "Which jobs do you want?", "Tap any job you're happy to do..."
- "Saved", "No jobs selected yet", "You've picked X jobs", "Great selection!"
- "Most professionals pick 5–15 jobs", "You don't need to select everything"
- "Search jobs...", "No jobs found for...", "Clear search"
- "Go Back", "Continue", "Saving...", "Select at least 1 job to continue"
- "You can always add more jobs later..."

**ReviewStep.tsx** — Go-live checklist (~15 keys):
- "You're ready to go live!", "Almost there..."
- "Your profile checklist", "About you", "Where you work", "Jobs selected"
- "We'll only send you jobs for:", "You can change this anytime..."
- "Go Live", "Go Back", "Complete all checklist items to go live"
- Toast: "You're live! Time to start receiving work.", "Please complete all steps first"

### Group B: Professional pages (2 files, ~30 keys)

**JobPriorities.tsx** — Priority settings:
- "Set Your Job Priorities", "Tell us which jobs to send you first..."
- Priority labels: "Priority"/"Send these first", "Standard"/"Happy to receive", "Low priority"/"Only if nothing else"
- "Saved", "You haven't selected any jobs yet", "Choose Your Jobs", "Done"
- "Back to Dashboard"

**ServiceListingEditor.tsx** — Listing form (~20 keys):
- "Edit Listing", "Listing Details", "Display Title", "Short Description"
- "Hero Image", "Gallery (up to 3)", "Location Base", "Pricing Summary"
- "Pricing Menu", "Add Item", "No pricing items yet..."
- Unit labels: "Per hour", "Per day", "Per m²", "Per job", "Per item"
- "Save", "Publish", "Change", "Upload hero image", "Maximum 3 gallery images"
- "Listing saved", "Failed to save listing", "Listing not found"
- Publish validation: "Please fill in title, description, and upload a hero image..."

### Group C: Dashboard child components (3 files, ~25 keys)

**ClientJobCard.tsx** — Remaining hardcoded strings:
- Status labels: "Saved", "Live", "In Progress", "Completed", "Closed", "Draft"
- Status messages: "Saved — choose how to share...", "No professionals have messaged yet"
- Buttons: "Share Job", "Complete", "View", "Cancel", "Closing..."
- Toasts: "Job marked as completed!", "Failed to complete job", "Thanks for your rating!", "Failed to submit rating"

**ProProfileDrawer.tsx** — Profile drawer (~12 keys):
- "Professional Profile", "About", "Services (X)", "Areas Covered"
- "Typical lead time:", "Reviews (X)", "Already Invited", "Invite with this job"
- "Verified", "Island-wide", "Professional" (fallback name), "Profile not found."

**MatchAndSend.tsx** — Match & send page (~10 keys):
- "Sending: ...", "Professionals matching your job", "X professionals found"
- "No matching professionals found yet...", "Back to Job"
- "View Profile", "Invited", "Invite", "Invite sent!", "Failed to send invite"
- "Already invited this professional", "Flexible"
- "Job not found."

### Group D: Remaining leaks in job detail (4 targeted fixes)

1. **PhotoLightbox sr-only strings**: "Close", "Previous", "Next" — add `detail.lightbox.*` keys
2. **"Failed to start conversation"** hardcoded toast — use `t('detail.startConversationFailed')`
3. **`"To be discussed"` string comparison** in `getSpecBadge` — replace with data-driven check (`jp.budget?.type !== 'tbd'`)
4. **Flag prettifier** in `JobFlagBadges.tsx` — add `EXTRA_FLAG_KEYS` mapping for known flags

## Implementation Approach

### Locale files strategy

- **Onboarding**: Expand existing `public/locales/[en|es]/onboarding.json` with new sections: `wizard.*` (step labels/headers), `basicInfo.*`, `serviceArea.*`, `serviceUnlock.*`, `review.*`
- **Professional**: Create new `public/locales/[en|es]/professional.json` namespace with `priorities.*`, `listingEditor.*`
- **Dashboard**: Expand existing `public/locales/[en|es]/dashboard.json` with `client.status.*`, `client.card.*`, `proProfile.*`, `matchAndSend.*`
- **Jobs**: Add `detail.lightbox.*`, `detail.startConversationFailed`, `flags.permitsMayBeNeeded`, `flags.siteVisitNeeded` to existing `jobs.json`

### i18n config changes

- Add `professional` to the `ns` array in `src/i18n/index.ts`
- Add `professional` to `src/i18n/namespaces.ts`
- Bump cache version to `2026022405`

### Code changes per file

Each file gets `useTranslation('<namespace>')` added and all hardcoded strings replaced with `t('key')`. The pattern is identical across all files:

1. Add `import { useTranslation } from 'react-i18next'`
2. Add `const { t } = useTranslation('<ns>')` in the component
3. Replace every English string literal with `t('section.key')`
4. For dynamic strings with interpolation: `t('key', { count: n })` or `t('key', { name: val })`

### JobFlagBadges structural fix

Add a translation mapping for known extra flags:
```text
const EXTRA_FLAG_KEYS: Record<string, string> = {
  PERMITS_MAY_BE_NEEDED: 'flags.permitsMayBeNeeded',
  SITE_VISIT_NEEDED: 'flags.siteVisitNeeded',
  CLIENT_HAS_PERMIT_CONCERNS: 'flags.clientHasPermitConcerns',
};
```
Use `t(EXTRA_FLAG_KEYS[flag])` when available, fallback to prettifier only for truly unknown flags.

### JobDetailsModal "To be discussed" fix

Replace string comparison:
```text
// Before: jp.budget.display !== "To be discussed"
// After:  jp.budget?.type !== 'tbd'
```
This is data-driven and language-agnostic.

## Estimated changes

| Area | Files modified | New keys (EN+ES) |
|------|---------------|-----------------|
| Onboarding | 5 TSX + 2 JSON | ~60 |
| Professional | 2 TSX + 2 JSON (new) | ~30 |
| Dashboard | 3 TSX + 2 JSON | ~25 |
| Jobs fixes | 3 TSX + 2 JSON | ~8 |
| i18n config | 2 TS | — |
| **Total** | **15 TSX + 10 JSON + 2 TS** | **~123 keys** |

