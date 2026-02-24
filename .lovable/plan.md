

# Spanish Translation Audit — Remaining Hardcoded English

## Current Status

The **public-facing pages** (Homepage, How It Works, About, Contact, Jobs Board, Privacy, Terms, Dispute Policy) are now fully translated. The recent work fixed the legal pages, job board, and wizard renderer.

However, a significant number of **authenticated/internal pages** still have zero or partial i18n coverage. These pages were never wired up with `useTranslation` at all, so every string is hardcoded English.

## Scope of Remaining Work

### Tier 1 — User-Facing (High Priority)

These pages are seen by every authenticated user:

**1. PostJob.tsx** — "Cancel" button (1 string)
- Line 46: `Cancel` → needs `t('wizard:buttons.cancel')`

**2. CanonicalJobWizard.tsx** — 3 hardcoded strings
- Line 736: `'Job posted! View it on the job board.'` toast
- Line 968: `Get Matched` button label
- Line 973: `Sign in & Get Matched` button label

**3. Settings.tsx** — Entire page (~30+ strings, zero `useTranslation`)
- "Settings", "Account", "Your account information", "Email", "Not available"
- "Current Mode", "Tasker", "Asker", `Switched to ${label} mode`
- "Admin Panel", "Security", "Change your password", "New password", "Min. 6 characters"
- "Confirm password", "Re-enter password", "Updating…", "Update Password"
- "Notifications", "Control which emails you receive", "New messages", "Job matches"
- "Email digest", "Receive a summary of activity", "Digest frequency", "Daily", "Weekly"
- "Sign Out"

**4. Messages pages** — Zero `useTranslation` across all 3 files
- `ConversationList.tsx`: "Search conversations…", "No conversations yet", "No matching conversations", "Start by posting a job…"
- `ConversationThread.tsx`: "No messages yet. Start the conversation!", "Type a message…", "Send"
- `Messages.tsx`: "Messages", "Select a conversation", layout text

**5. Onboarding pages** — Zero `useTranslation` (6+ files)
- `ProfessionalOnboarding.tsx` and all step components
- `ServiceUnlockStep.tsx`: "No jobs selected yet", "You've picked X jobs", "No jobs found for..."
- `BasicInfoStep.tsx`, `ReviewStep.tsx`, `ServiceAreaStep.tsx`

### Tier 2 — Role-Specific (Medium Priority)

**6. Professional pages** — Partial i18n (some files have it, some don't)
- `JobPriorities.tsx`: "Choose Your Jobs", "No job types unlocked yet"
- `ServiceListingEditor.tsx`: "No pricing items yet", many form labels

**7. Dashboard pages** — `ClientDashboard.tsx` has `useTranslation` but several child components don't:
- `ClientJobCard.tsx`: "Cancel" in AlertDialog
- `ProProfileDrawer.tsx`: likely hardcoded
- `MatchAndSend.tsx`: likely hardcoded

**8. Forum pages** — Partial (some translated, some not)
- `ForumNewPost.tsx`: form buttons/labels
- `ForumPost.tsx`: reply form

### Tier 3 — Admin-Only (Low Priority)

Admin pages (DrilldownTable, UserDetailDrawer, JobDetailDrawer, SupportInbox, all insights pages) — all hardcoded English. Since these are internal tools, they can wait.

## Implementation Plan

### Phase 1: Fix the 4 quick strings in wizard/post (5 min)
- Add `cancel`, `getMatched`, `signInGetMatched` to `wizard` namespace (EN + ES)
- Add `toasts.postSuccess` key
- Update `PostJob.tsx` line 46 and `CanonicalJobWizard.tsx` lines 736, 968, 973

### Phase 2: Settings page (create `settings` namespace)
- Create `public/locales/en/settings.json` and `es/settings.json` with ~35 keys
- Add `useTranslation('settings')` to Settings.tsx
- Replace all hardcoded strings

### Phase 3: Messages pages (create `messages` namespace)
- Create `public/locales/en/messages.json` and `es/messages.json`
- Wire up `useTranslation` in ConversationList, ConversationThread, Messages
- Already have a `public/locales/en/dashboard.json` with some message-related keys — check for reuse

### Phase 4: Onboarding pages (expand `onboarding` namespace)
- The `onboarding` namespace already exists with some keys
- Add missing keys for all step components
- Wire up `useTranslation` in ProfessionalOnboarding and all steps

### Phase 5: Professional + Dashboard child components
- Expand `dashboard` namespace for remaining components
- Fix `ClientJobCard.tsx` "Cancel" and similar

### Each phase follows the same pattern:
1. Add EN keys (extract from current hardcoded strings)
2. Add ES translations
3. Add `useTranslation` import + replace strings
4. Bump cache version

## Estimated Effort

| Phase | Files | Keys | Priority |
|-------|-------|------|----------|
| 1. Wizard quick fixes | 2 | 4 | Immediate |
| 2. Settings | 1 | ~35 | High |
| 3. Messages | 3 | ~20 | High |
| 4. Onboarding | 6 | ~40 | Medium |
| 5. Pro + Dashboard | 5+ | ~30 | Medium |
| 6. Admin (optional) | 15+ | ~80 | Low |

I recommend starting with Phases 1-3 (wizard fixes + Settings + Messages) as these are the pages most users see daily.

