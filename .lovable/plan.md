

# Professional Journey Map — Full Wireframe Logic

## The Journey, Step by Step

```text
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  /auth   │───▶│  Onboarding  │───▶│  Dashboard   │───▶│  Sub-pages   │
│  Sign Up │    │  3-step      │    │  /dashboard/  │    │  Jobs, List, │
│          │    │  wizard      │    │  pro          │    │  Insights... │
└──────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

### 1. Sign Up — `/auth`

- **Comes from**: Any public page, or direct link
- **Purpose**: Create account, choose intent (Asker / Professional / Both)
- **Main actions**: Sign up with email + password, select role
- **Goes to**: `/onboarding/professional` (if professional role selected)
- **Back**: Home `/`

---

### 2. Onboarding — `/onboarding/professional`

- **Comes from**: `/auth` after sign-up, or `/dashboard/pro` stage cards ("Finish Setup")
- **Purpose**: 3-step activation wizard: Basic Info → Choose Services → Review & Go Live
- **Main actions**:
  - Step 1: Name, phone, service zones
  - Step 2: Pick service categories/micros
  - Step 3: Review summary, toggle visibility, "Go Live"
- **Goes to**: `/dashboard/pro?welcome=1` on Go Live
- **Back**: Step-to-step within wizard; exit returns to `/dashboard/pro` (if returning) or `/` (if fresh)
- **Edit mode**: Accessible via `?edit=1&step=X` from dashboard prompts — returns to `/dashboard/pro` on save

---

### 3. Dashboard Landing — `/dashboard/pro`

- **Comes from**: Onboarding completion, nav, role switcher, any back button from sub-pages
- **Purpose**: Navigation hub — shows contextual guidance cards + menu links to all sub-pages
- **Main actions**:
  - Stage cards (needs_profile → needs_services → needs_review → needs_visibility → active)
  - Welcome banner (dismissable, shown once via `?welcome=1`)
  - Profile completion prompts (delayed, milestone-based)
  - Draft listing nudge
  - Menu links to all sub-pages
- **Goes to**: Any sub-page via menu
- **Back**: Home `/` (logo link)

---

### 4. Browse Matching Jobs — `/jobs`

- **Comes from**: Dashboard menu ("Browse Matching Jobs"), welcome banner CTA
- **Purpose**: Public job board — shows jobs filtered/relevant to the pro's services
- **Main actions**: View job cards, click to see details
- **Goes to**: Individual job detail (public view)
- **Back**: Browser back (this is a public page, not a dashboard sub-page)

---

### 5. My Jobs — `/dashboard/pro/jobs`

- **Comes from**: Dashboard menu ("My Jobs")
- **Purpose**: List of jobs assigned to this professional (in_progress, completed)
- **Main actions**: View job list, click into individual job ticket
- **Goes to**: `/dashboard/pro/job/:jobId`
- **Back**: `/dashboard/pro`

---

### 6. Single Job Page — `/dashboard/pro/job/:jobId`

- **Comes from**: `/dashboard/pro/jobs` list
- **Purpose**: Full job ticket detail — communication, status, milestones
- **Main actions**: View details, message client, update status
- **Goes to**: Messages, back to jobs list
- **Back**: `/dashboard/pro/jobs` (explicit link, not `navigate(-1)`)

---

### 7. My Listings — `/dashboard/pro/listings`

- **Comes from**: Dashboard menu ("My Listings"), draft nudge card
- **Purpose**: Manage service listings — view by status (Draft / Live / Paused)
- **Main actions**: Edit listing, publish, pause, unpause; link to "Add/Remove Categories"
- **Goes to**: `/dashboard/pro/listings/:listingId/edit` (edit), `/professional/services` (manage categories)
- **Back**: `/dashboard/pro`

---

### 8. Edit Listing — `/dashboard/pro/listings/:listingId/edit`

- **Comes from**: Listings page (edit button on a listing card)
- **Purpose**: Full listing editor — title, description, images, pricing, publish
- **Main actions**: Edit fields, add pricing items, publish/unpause
- **Goes to**: Back to listings on save
- **Back**: `/dashboard/pro/listings`

---

### 9. Insights — `/dashboard/pro/insights`

- **Comes from**: Dashboard menu ("My Insights")
- **Purpose**: Demand intelligence dashboard (gated by subscription tier)
- **Main actions**: View demand data by category and area
- **Goes to**: N/A (read-only)
- **Back**: `/dashboard/pro`

---

### 10. Profile Edit — `/professional/profile`

- **Comes from**: Dashboard menu ("Edit Profile"), stage card ("Complete your profile")
- **Purpose**: Edit display name, business name, phone, bio, tagline, visibility toggle
- **Main actions**: Save profile fields, toggle public listing visibility
- **Goes to**: Back to dashboard on save
- **Back**: `/dashboard/pro`

**Status: Setup/config page — NOT a dashboard sub-page. Correct as-is.**

---

### 11. Manage Services — `/professional/services`

- **Comes from**: Listings page ("Add/Remove Categories"), dashboard menu (during setup)
- **Purpose**: Add or remove service categories (standalone, not onboarding)
- **Main actions**: Toggle service micros on/off
- **Goes to**: Back to wherever user came from
- **Back**: `/dashboard/pro`

**Status: Setup/config page — correct as-is.**

---

### 12. Job Priorities — `/professional/priorities`

- **Comes from**: Dashboard prompt (at 5+ matches), or direct nav
- **Purpose**: Rank services by preference (priority / standard / avoid)
- **Main actions**: Set preference per service micro
- **Goes to**: Back to dashboard
- **Back**: `/dashboard/pro`

**Status: Setup/config page — correct as-is.**

---

### 13. Portfolio — `/professional/portfolio`

- **Comes from**: Profile or dashboard (future)
- **Purpose**: Manage portfolio images/projects
- **Status: Setup/config page — correct as-is.**

---

## Legacy Redirects (must all work)

| Old path | Redirects to |
|---|---|
| `/dashboard/professional/jobs` | `/dashboard/pro/jobs` |
| `/professional/listings` | `/dashboard/pro/listings` |
| `/professional/listings/:id/edit` | `/dashboard/pro/listings/:id/edit` |
| `/professional/insights` | `/dashboard/pro/insights` |

---

## Final Recommended Route Structure

```text
DASHBOARD (hub + sub-pages under /dashboard/pro):
  /dashboard/pro                           — Hub / landing
  /dashboard/pro/jobs                      — My assigned jobs
  /dashboard/pro/job/:jobId                — Single job ticket
  /dashboard/pro/listings                  — My service listings
  /dashboard/pro/listings/:listingId/edit  — Edit single listing
  /dashboard/pro/insights                  — Demand insights

SETUP / CONFIG (remain at /professional/* and /onboarding/*):
  /onboarding/professional                 — Activation wizard
  /professional/profile                    — Edit profile
  /professional/services                   — Manage service picks
  /professional/priorities                 — Job priority rankings
  /professional/portfolio                  — Portfolio management

SHARED:
  /dashboard/jobs/:jobId                   — Shared job ticket (both roles)
  /messages                                — Messaging
  /settings                                — Account settings
```

---

## Navigation Logic Summary

- **Dashboard menu** links only to canonical `/dashboard/pro/*` paths and `/professional/*` config pages
- **Back buttons** on all dashboard sub-pages point explicitly to `/dashboard/pro`
- **Back buttons** on config pages (`/professional/*`) point to `/dashboard/pro`
- **"Browse Matching Jobs"** always goes to `/jobs` (public board), never `/dashboard/pro/jobs`
- **"My Jobs"** always goes to `/dashboard/pro/jobs` (assigned work)
- **Stage cards** on dashboard link to onboarding or config pages as appropriate
- **Onboarding Go Live** redirects to `/dashboard/pro?welcome=1`

---

## Duplications / Ambiguities Found

1. **MyServiceListings has its own `?welcome=1` banner** — This is a leftover from before the dashboard became the post-Go-Live landing. The welcome experience now lives on `/dashboard/pro`. The listings welcome banner is dead code.

2. **"Add/Remove Categories" from Listings links to `/professional/services`** — This is correct but the back path from ManageServices needs to reliably return to `/dashboard/pro` (or the listings page the user came from). Currently it always goes to `/dashboard/pro`, which is acceptable.

3. **`/dashboard/jobs/:jobId`** (shared) vs **`/dashboard/pro/job/:jobId`** (pro-specific) — Both exist. The shared route is for when either client or pro accesses a job. The pro-specific route is an alias. These should be clarified: either the pro route redirects to the shared route, or the shared route is the only one. Currently both render `JobTicketDetail`.

---

## What This Plan Does NOT Cover (intentionally)

- Client-side journey
- Admin dashboard
- UI redesign
- New features
- Component-level refactoring

