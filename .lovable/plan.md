
# Add Cascade Filters to /services + Asker/Tasker Language Cleanup

## Overview

Three focused changes for launch readiness:
1. Add cascading category/subcategory/micro filter dropdowns to the /services page
2. Add a sort option (Newest / Lowest price)
3. Replace all "Professional" language in public-facing service pages with "Tasker"

No new pages. No architecture changes. Same data, better browsing + consistent language.

## What Changes

### 1. Extend the `service_listings_browse` database view

The current view has `category_name`, `subcategory_name`, `micro_name`, `micro_slug` but is missing `category_slug` and `subcategory_slug` -- needed for URL-shareable filters.

**Migration**: Drop and recreate the view adding:
- `sc.slug AS category_slug`
- `ss.slug AS subcategory_slug`

Everything else stays identical.

### 2. Build cascade filter bar on /services

Add a filter bar above the listings grid with:
- **Category** dropdown (populated from distinct values in fetched listings)
- **Subcategory** dropdown (filtered by selected category)
- **Task** dropdown (filtered by selected subcategory)
- **Sort** dropdown: Newest (default) | Lowest price

Filter logic:
- Selecting Category resets Subcategory + Task
- Selecting Subcategory resets Task
- All filtering happens client-side on the already-fetched listings (no extra queries)
- Selections are synced to URL query params: `?category=plumbing&subcategory=bathrooms&sort=price_asc`
- Wizard can link to `/services?micro=leak-repair` and it works automatically

### 3. Asker/Tasker language cleanup

Update hardcoded English text in service components and translation keys:

| Current | New |
|---------|-----|
| "Contact Professional" | "Contact Tasker" |
| "Professional" (fallback name) | "Tasker" |
| "Browse Professionals" | "Browse Taskers" |
| "Join as Professional" | "Join as Tasker" |
| provider card heading "Professional" | "Tasker" |

Plus translation file updates for both EN and ES `common.json`.

## Technical Details

### Files to modify

**Database migration** (1 file):
- New migration: recreate `service_listings_browse` view adding `category_slug` and `subcategory_slug` columns

**Frontend** (5 files):
- `src/pages/services/queries/serviceListings.query.ts` -- add `category_slug` and `subcategory_slug` to the `ServiceListingCard` interface
- `src/pages/public/Services.tsx` -- add filter bar with 3 cascade dropdowns + sort dropdown, read/write URL query params, filter listings client-side
- `src/pages/services/ServiceListingDetail.tsx` -- change "Contact Professional" to translated "Contact Tasker", change fallback name from "Professional" to "Tasker"
- `src/pages/services/ServiceListingCard.tsx` -- change fallback provider name from "Professional" to "Tasker"

**Translation files** (4 files):
- `public/locales/en/common.json` -- add `services.contactTasker`, `services.emptyState` update, update `professionals.*` labels
- `public/locales/es/common.json` -- same Spanish equivalents
- `public/locales/en/lexicon.json` -- add `contactTasker` and `browseTaskers` keys
- `public/locales/es/lexicon.json` -- Spanish equivalents

### Filter implementation approach

The `/services` page already fetches all live listings via `useServiceListingsBrowse()`. Filters will work by:
1. Reading URL search params on mount (`useSearchParams`)
2. Deriving unique category/subcategory/micro options from the full listings array
3. Filtering the displayed listings based on selected values
4. Updating URL params when dropdowns change

This avoids any new database queries -- all filtering is client-side on the already-loaded data.

### URL param structure
```
/services                           -- show all
/services?category=plumbing         -- filter by category
/services?category=plumbing&subcategory=bathrooms  -- drill down
/services?micro=leak-repair         -- direct micro filter
/services?sort=price_asc            -- sort by price
```

### No other files need changes
Route registry, App.tsx, ServiceListingEditor, and all hooks remain as-is.
