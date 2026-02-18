

# Final Polish: Fix Remaining Link & Cleanup Issues

## What's Already Done (no changes needed)
- ProDashboard: Service Categories label + hint, QuickActionTile with hints, "Manage Your Work" section -- all correct
- MyServiceListings: Hub header with "Add / Remove Categories" button -- correct
- App.tsx: `/professional/listings` route wired to `MyServiceListings` -- correct
- Translation keys in both EN and ES -- correct

## What Still Needs Fixing (3 small items)

### 1. App.tsx -- Remove duplicate `/launch-checklist` route (lines 133-134)
Two identical routes exist. Delete one.

### 2. ProDashboard.tsx -- Setup alert link should go to `/professional/listings` (line 105)
Currently the setup alert sends Taskers to onboarding (`/onboarding/professional?step=services`). Per the agreed model, the dashboard should send users to the Manage Listings hub, which is the single place that then links out to onboarding via "Add / Remove Categories".

Same fix for the empty matched-jobs "Set Up Services" button (line 236) -- change to `/professional/listings`.

### 3. MyServiceListings.tsx -- Simplify EmptyTab component (line 224)
Currently passes `t` as a prop with a complex `ReturnType<typeof useTranslation>['t']` type. Replace with a self-contained component that calls `useTranslation` internally -- cleaner and avoids TS quirks.

## Technical Details

### Files to modify (3 total)

| File | Change |
|------|--------|
| `src/App.tsx` | Delete duplicate `/launch-checklist` route (line 134) |
| `src/pages/dashboard/professional/ProDashboard.tsx` | Change setup alert link (line 105) from `/onboarding/professional?step=services` to `/professional/listings`; change empty-state "Set Up Services" link (line 236) to `/professional/listings` |
| `src/pages/professional/MyServiceListings.tsx` | Refactor `EmptyTab` to call `useTranslation('dashboard')` internally instead of receiving `t` as a prop; remove `t` prop from all 3 call sites |

### No new files, no database changes, no translation changes
All keys already exist. This is purely wiring + cleanup.

