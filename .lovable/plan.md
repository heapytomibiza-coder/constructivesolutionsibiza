
# Clean Up Tasker Dashboard: Dead Pages, Links, Actions, Language

## Overview

Four focused changes to make the Tasker dashboard clean and consistent:
1. Remove dead placeholder pages (ProfessionalServices, ProfessionalPortfolio)
2. Fix the "Your Services" stat tile to link to My Listings instead of onboarding
3. Streamline quick actions (remove duplicate "Update Services" entry)
4. Complete Asker/Tasker language sweep across all dashboard translation keys

## Changes

### 1. Remove dead placeholder pages

**Delete files:**
- `src/pages/professional/ProfessionalPortfolio.tsx`
- `src/pages/professional/ProfessionalServices.tsx`

These are empty placeholders that already redirect to `/dashboard/pro` in App.tsx (lines 172, 176). The redirects stay -- we just remove the dead source files.

Also remove the `/professional/service-setup` route (App.tsx line 173) and the `ProfessionalServiceSetup` import (line 55). This page duplicates onboarding logic and is not linked from anywhere in the dashboard. The route registry entry for `/professional/service-setup` will also be removed.

### 2. Fix "Your Services" stat tile link

In `ProDashboard.tsx` line 117, change the Services stat tile link from:
```
/onboarding/professional?edit=1&step=services
```
to:
```
/professional/listings
```

This sends Taskers to their actual listings management page, not back into onboarding.

### 3. Streamline quick actions

Currently the dashboard has two overlapping actions:
- "My Services" -> `/professional/listings`
- "Update Services" -> `/onboarding/professional?edit=1&step=services`

Replace "Update Services" with "Job Priorities" in both mobile (2x2 grid) and desktop quick actions. The resulting set becomes:

| Action | Link | Icon |
|--------|------|------|
| My Listings | /professional/listings | Store |
| Job Priorities | /professional/priorities | Star |
| Edit Profile | /professional/profile | User |
| Messages | /messages | MessageSquare |

This removes the confusing onboarding re-entry from the dashboard. Taskers who need to add new micros can still access onboarding from the My Listings empty state.

### 4. Asker/Tasker language sweep on dashboard translations

**`public/locales/en/dashboard.json`** updates:

| Key | Current | New |
|-----|---------|-----|
| `pro.title` | "Professional Dashboard" | "Tasker Dashboard" |
| `pro.myListings` | (new) | "My Listings" |
| `client.title` | "Dashboard" | "Asker Dashboard" |
| `client.selectPro` | "Select pro" | "Select Tasker" |
| `client.noProsYet` | "No professionals have messaged yet" | "No Taskers have messaged yet" |
| `client.professionalFallback` | "Professional" | "Tasker" |
| `client.assignedSuccess` | "Professional assigned successfully" | "Tasker assigned successfully" |
| `client.assignedFail` | "Failed to assign professional" | "Failed to assign Tasker" |

**`public/locales/es/dashboard.json`** -- equivalent Spanish updates:

| Key | Current | New |
|-----|---------|-----|
| `pro.title` | "Panel de Profesional" | "Panel del Tasker" |
| `pro.myListings` | (new) | "Mis Listados" |
| `client.title` | "Panel" | "Panel del Solicitante" |
| `client.selectPro` | "Seleccionar profesional" | "Seleccionar Tasker" |
| `client.noProsYet` | "Aun no hay profesionales..." | "Aun no hay Taskers..." |
| `client.professionalFallback` | "Profesional" | "Tasker" |
| `client.assignedSuccess` | "Profesional asignado correctamente" | "Tasker asignado correctamente" |
| `client.assignedFail` | "No se pudo asignar al profesional" | "No se pudo asignar al Tasker" |

## Technical Details

### Files to modify
- `src/App.tsx` -- remove ProfessionalServiceSetup import + route, remove ProfessionalServices/Portfolio imports (redirects already handle these)
- `src/app/routes/registry.ts` -- remove `/professional/service-setup` route entry
- `src/pages/dashboard/professional/ProDashboard.tsx` -- fix stat tile link, streamline quick actions
- `public/locales/en/dashboard.json` -- language updates
- `public/locales/es/dashboard.json` -- language updates

### Files to delete
- `src/pages/professional/ProfessionalPortfolio.tsx`
- `src/pages/professional/ProfessionalServices.tsx`
- `src/pages/professional/ProfessionalServiceSetup.tsx`

### No database changes needed
All changes are frontend-only.
