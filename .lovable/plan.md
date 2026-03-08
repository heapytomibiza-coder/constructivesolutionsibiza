

## Plan: Pro Dashboard Flow & Navigation Logic Fix

### Core problems

1. **Dashboard is state-blind** — only checks `servicesCount === 0`, then shows identical flat menu to all professionals regardless of completion state
2. **ProfileEdit forces wrong redirect** — line 259 always navigates to `/onboarding/professional?edit=1&step=services` on save, trapping users in the onboarding wizard when they just wanted to update their bio
3. **Menu shows everything at once** — Insights, Listings, Forum all visible to a brand-new pro with no services, creating confusion about what matters
4. **No "where am I / what's next"** — no profile strength, no progression indicator, no contextual guidance after services are set up

### What we'll build

**A. State-aware dashboard hero** (`ProDashboard.tsx`)

Derive a `dashboardStage` from existing session + stats data:

```text
if (!displayName)           → 'needs_profile'   → "Complete your profile"
elif (servicesCount === 0)  → 'needs_services'   → "Choose your services"  
elif (phase < complete)     → 'needs_review'     → "Review and go live"
elif (!isPubliclyListed)    → 'needs_visibility' → "Turn on visibility"
else                        → 'active'           → "You're live — check jobs"
```

Each stage shows a single guidance card with one clear CTA. Replaces the current `needsServiceSetup` card.

**B. Fix ProfileEdit save flow** (`ProfileEdit.tsx`)

- Change submit handler: save profile → toast success → navigate to `/dashboard/pro` (not the onboarding wizard)
- Rename button from "Save & Edit Services" → "Save Profile"
- Keep the "Edit Services" and "Job Priorities" shortcut buttons at the bottom as optional navigation — they already exist and work well as secondary actions

**C. Grouped menu with stage-based visibility** (`ProDashboard.tsx`)

Split the flat menu into logical groups:

```text
── Get Started (visible when setup incomplete) ──
   Edit Profile
   Choose Services (links to onboarding wizard)

── Your Work (always visible once services exist) ──
   Browse Jobs
   Messages [badge]
   My Listings

── Grow (visible once 'active') ──
   Insights
   Community Forum

── Account (always visible) ──
   Settings
```

Items in hidden groups simply don't render — no new routes or gating needed.

**D. Enrich useProStats** (`useProStats.ts`)

Add fields already available from session context (no new DB queries):
- `profileComplete`: derived from `displayName` + `servicesCount > 0` + `phase`
- `dashboardStage`: the computed stage string
- `isPubliclyListed`: from `professionalProfile`

### Files to edit

| File | Change |
|------|--------|
| `src/pages/dashboard/professional/ProDashboard.tsx` | State-aware hero card, grouped menu |
| `src/pages/professional/ProfileEdit.tsx` | Fix save redirect → dashboard, rename button |
| `src/pages/dashboard/professional/hooks/useProStats.ts` | Add `dashboardStage` derivation |
| `public/locales/en/dashboard.json` | Add i18n keys for stage guidance cards and menu group labels |

### What stays unchanged

- Onboarding wizard (`ProfessionalOnboarding.tsx`) — works correctly for first-time and edit flows
- Route registry — no new routes needed
- Database — no schema changes
- MyServiceListings, JobPriorities, ProInsights — untouched
- Session context — already provides all needed data via `professionalProfile`

