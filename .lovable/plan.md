
# Tasker Dashboard: Idiot-Proof Redesign

## Overview

Redesign the Tasker Dashboard and My Listings page with clear, non-overlapping actions, honest stat labels, and one-line hints on every quick action tile. Only one place to change service categories (inside My Listings header).

## Changes

### 1. ProDashboard.tsx -- Stats, Quick Actions, Section Rename

**Stats row -- "Service Categories" with hint:**
- Rename "Your Services" label to "Service Categories"
- Add small hint text below: "Used to match you to jobs" (hidden on mobile for space)
- Link stays at `/professional/listings`

**Mobile quick actions -- hints on every tile:**
- Upgrade `QuickActionTile` component to accept an optional `hint` prop
- Change layout from `items-center` to `items-start` with a text column (label + hint)
- Four tiles with hints:
  - Manage Listings: "Edit prices, photos and details"
  - Job Priorities: "Get more of the work you want"
  - Edit Profile: "Update your Tasker profile"
  - Messages: "Chat with Askers"

**Desktop quick actions -- rename section:**
- Change header from "Quick Actions" to "Manage Your Work"
- Replace first button label from "My Listings" to "Manage Listings"
- Replace "Job Priorities" key to use new `pro.jobPriorities`

**Setup alert button:**
- Change hardcoded "Setup" text to translated "Add Categories"

### 2. MyServiceListings.tsx -- Hub Header with "Add / Remove Categories"

**Page header upgrade:**
- Replace hardcoded "My Service Listings" nav title with translated "Manage Listings"
- Add a sub-header row with:
  - Left: hint text "Edit and publish your services to appear on the platform."
  - Right: "Add / Remove Categories" button linking to `/onboarding/professional?edit=1&step=services`
- This becomes the ONLY place (besides the setup alert) where Taskers access category selection

**Empty state text:**
- Update empty tab messages to use translated keys with clearer wording
- "Add Services" button text becomes "Add / Remove Categories"
- Add `useTranslation('dashboard')` hook (currently missing)

### 3. Translation Files (EN + ES)

**New keys added to `public/locales/en/dashboard.json`:**
- `pro.serviceCategories`: "Service Categories"
- `pro.serviceCategoriesHint`: "Used to match you to jobs"
- `pro.manageYourWork`: "Manage Your Work"
- `pro.manageListings`: "Manage Listings"
- `pro.manageListingsHint`: "Edit prices, photos and details"
- `pro.manageListingsPageHint`: "Edit and publish your services to appear on the platform."
- `pro.jobPriorities`: "Job Priorities"
- `pro.jobPrioritiesHint`: "Get more of the work you want"
- `pro.editProfileHint`: "Update your Tasker profile"
- `pro.messagesHint`: "Chat with Askers"
- `pro.addCategories`: "Add Categories"
- `pro.addRemoveCategories`: "Add / Remove Categories"
- `pro.emptyDrafts`, `pro.emptyLive`, `pro.emptyPaused`: clearer empty states

**Spanish equivalents in `public/locales/es/dashboard.json`:**
- All matching keys with natural Spanish translations (e.g. "Gestiona Tu Trabajo", "Categorias de Servicio")

## Technical Details

### Files to modify (4 total)

| File | What changes |
|------|-------------|
| `src/pages/dashboard/professional/ProDashboard.tsx` | Stat label + hint, QuickActionTile hint prop, section rename, setup alert button text |
| `src/pages/professional/MyServiceListings.tsx` | Add i18n hook, hub header with "Add / Remove Categories" button, translated empty states |
| `public/locales/en/dashboard.json` | Add 13 new translation keys |
| `public/locales/es/dashboard.json` | Add 13 matching Spanish keys |

### No database changes, no new files, no route changes

All changes are UI copy + layout within existing components.

### Result: the "idiot-proof" mental model

- **Service Categories (58)** = what I can do (matching)
- **Manage Listings** = what I show publicly (prices/photos/details)
- **Add / Remove Categories** = only inside My Listings header (one entrance)
- **No duplicate actions** on the dashboard
- **Every tile explains itself** with a one-line hint
