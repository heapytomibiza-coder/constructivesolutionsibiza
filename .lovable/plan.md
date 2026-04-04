

## Plan: Welcome Banner + Legacy Deep-Link Hardening + Delayed Profile Prompts

### 1. Dashboard Welcome Banner (`ProDashboard.tsx`)

**What to build:**
- Read `?welcome=1` from URL using `useSearchParams`
- Add local `useState` for `dismissed`
- When `dismissed` → call `setSearchParams` to remove `welcome` key (no page reload)
- Render a success-styled `Card` above the stage guidance card when `welcome=1` and not dismissed

**Banner content:**
- Icon: `CheckCircle2` in green/emerald
- Title: "You're live!"
- Body: "When a client posts a matching job, it'll appear here. You can update your profile later as you start receiving work."
- Primary CTA: `Link` to `/jobs` — "View Matching Jobs"
- Dismiss button (X icon top-right or "Dismiss" text button)
- Styled with `border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20` — success state, not warning

**Empty-state card below menu (when `matchedJobsCount === 0` and `isSetupComplete`):**
- Title: "No matching jobs yet"
- Body: "We'll show new jobs here when they match your services and areas."
- Subtle/muted styling, no CTA

**Import changes:** Add `useSearchParams` from `react-router-dom`, add `X` from `lucide-react`

### 2. Legacy Deep-Link Hardening (`ProfessionalOnboarding.tsx`)

Already handled: `service_area` → `basic_info` fallback on line 43. Additional hardening:

- After computing `stepParam`, validate it against the allowed step list (`basic_info`, `services`, `review`, `tracker`). If `stepParam` is truthy but not in the list, ignore it (set to `null`).
- This is a ~3-line addition after line 43.

### 3. Delayed Profile Prompts

**Data source:** Extend `useProStats` to query `bio` and `tagline` from `professional_profiles` for the current user. Add these to the returned object.

**Prompt logic in `ProDashboard.tsx`:**
- Compute which prompt to show (highest priority unfinished):
  1. `matchedJobsCount >= 1 && (!businessName || !tagline)` → Prompt 1
  2. `matchedJobsCount >= 3 && !bio` → Prompt 2
  3. `matchedJobsCount >= 5` → Prompt 3
- Show only ONE prompt at a time (first matching wins)
- Render as a dashboard Card between the stage card and the menu
- Each prompt has: icon, title, body, CTA linking to the edit step

**Prompt specs:**

| # | Condition | Title | Body | CTA | Link |
|---|---|---|---|---|---|
| 1 | ≥1 match, missing biz name or tagline | "Want to look more professional?" | "Add your business name and tagline so clients know who you are." | "Complete profile basics" | `/onboarding/professional?edit=1&step=basic_info` |
| 2 | ≥3 matches, missing bio | "Clients check profiles before hiring" | "Add a short bio to help them trust you." | "Add bio" | `/onboarding/professional?edit=1&step=basic_info` |
| 3 | ≥5 matches | "Getting jobs you don't want?" | "Fine-tune the work you receive." | "Update job preferences" | `/onboarding/professional?edit=1&step=services` |

**Note:** Prompts only show when `isSetupComplete` is true. They do NOT show alongside the welcome banner.

### 4. `useProStats` Changes

Add a secondary query for `bio` and `tagline` from `professional_profiles`:
- Query: `select bio, tagline from professional_profiles where user_id = userId`
- Return `bio` and `tagline` on the hook's return object
- `businessName` is already available via `professionalProfile?.businessName` from the session, so no change needed there

### 5. Translation Keys (`public/locales/en/dashboard.json` + `es/dashboard.json`)

Add under `pro`:
- `pro.welcomeTitle`: "You're live!"
- `pro.welcomeBody`: "When a client posts a matching job, it'll appear here. You can update your profile later as you start receiving work."
- `pro.welcomeCta`: "View Matching Jobs"
- `pro.emptyMatchedTitle`: "No matching jobs yet"
- `pro.emptyMatchedBody`: "We'll show new jobs here when they match your services and areas."
- `pro.prompt1Title`, `pro.prompt1Body`, `pro.prompt1Cta`
- `pro.prompt2Title`, `pro.prompt2Body`, `pro.prompt2Cta`
- `pro.prompt3Title`, `pro.prompt3Body`, `pro.prompt3Cta`

### Files to Change

| File | Change | Size |
|---|---|---|
| `src/pages/dashboard/professional/ProDashboard.tsx` | Welcome banner, empty state, profile prompts | Medium |
| `src/pages/dashboard/professional/hooks/useProStats.ts` | Add bio/tagline query | Small |
| `src/pages/onboarding/ProfessionalOnboarding.tsx` | Invalid step param fallback (~3 lines) | Small |
| `public/locales/en/dashboard.json` | Add welcome + prompt translation keys | Small |
| `public/locales/es/dashboard.json` | Mirror in Spanish | Small |

### Build Order

1. Translation keys (both locales)
2. `useProStats` — add bio/tagline
3. `ProDashboard` — welcome banner + empty state + prompts
4. `ProfessionalOnboarding` — invalid step hardening

### Acceptance Criteria

- [ ] `/dashboard/pro?welcome=1` shows success banner with "You're live!" title
- [ ] Dismissing the banner removes `?welcome=1` from URL
- [ ] Refreshing after dismiss does not re-show the banner
- [ ] When `matchedJobsCount === 0` and setup complete, empty-state card shows below menu
- [ ] Welcome banner does not show when `?welcome` is absent
- [ ] Profile prompts show only when `isSetupComplete` and no welcome banner
- [ ] Only one prompt shows at a time (highest priority)
- [ ] Prompt CTAs link to correct edit steps
- [ ] Invalid `?step=xyz` in onboarding URL is ignored safely
- [ ] `?step=service_area` still falls back to `basic_info`

