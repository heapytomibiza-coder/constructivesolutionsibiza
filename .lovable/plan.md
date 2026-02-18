

# Unify Services + Marketplace into One Coherent Section

## Problem
Right now there are two separate public sections that confuse users:
- **Services** (`/services`) -- shows a grid of 16 category cards (taxonomy)
- **Marketplace** (`/marketplace`) -- shows live service listing cards from professionals

These should be one unified experience under "Services".

## What Changes

### 1. Merge the pages: `/services` becomes a two-part page
The current `/services` page (category grid) will be enhanced to also show live service listings below the categories. This gives visitors both entry points in one place:
- Top section: "Browse by Category" (existing 16 category cards)
- Bottom section: "Featured Services" (live service listing cards from the marketplace)

### 2. Route consolidation
- `/services` -- unified browse page (categories + live listings)
- `/services/:categorySlug` -- category drill-down (unchanged)
- `/services/listing/:listingId` -- service listing detail (moved from `/marketplace/:listingId`)
- `/marketplace` -- redirect to `/services` (backward compat)
- `/marketplace/:listingId` -- redirect to `/services/listing/:listingId`

### 3. Remove "Marketplace" from nav
- Remove the separate "Marketplace" nav entry from the route registry
- The existing "Services" nav link covers everything
- Update nav label key `nav.marketplace` references

### 4. Update all internal links
- `ServiceListingCard` links: `/marketplace/:id` becomes `/services/listing/:id`
- `ServiceListingDetail` "Back" link: points to `/services` instead of `/marketplace`
- `JobDetailsModal` price comparison links: update any `/marketplace` references
- Pro Dashboard "My Listings" link stays at `/professional/listings` (already correct)

### 5. Update Pro Dashboard label clarity
- Rename "My Listings" to "My Services" in the quick action tiles for consistency with the public-facing "Services" naming
- The link still goes to `/professional/listings` (the editor page)

## Technical Details

### Files to modify
- `src/pages/public/Services.tsx` -- Add a "Featured Services" section below the category grid, using the existing `useServiceListingsBrowse` hook and `ServiceListingCardComponent`
- `src/pages/services/ServiceListingDetail.tsx` -- Update back link from `/marketplace` to `/services`
- `src/pages/services/ServiceListingCard.tsx` -- Update link from `/marketplace/:id` to `/services/listing/:id`
- `src/App.tsx` -- Move listing detail route to `/services/listing/:listingId`, add redirects for old `/marketplace` paths
- `src/app/routes/registry.ts` -- Remove `/marketplace` nav entry, add `/services/listing/:listingId` route
- `public/locales/en/common.json` -- Remove `nav.marketplace`, update labels
- `public/locales/es/common.json` -- Same Spanish translation cleanup
- `src/pages/dashboard/professional/ProDashboard.tsx` -- Change "My Listings" label to "My Services"
- `src/pages/jobs/hooks/useListingsForJob.ts` -- Update any `/marketplace` link references
- `src/pages/jobs/JobDetailsModal.tsx` -- Update comparison section links if any point to `/marketplace`

### Route registry changes
Remove:
```
{ path: '/marketplace', ... nav: { section: 'public', labelKey: 'nav.marketplace', order: 3 } }
{ path: '/marketplace/:listingId', ... }
```

Add:
```
{ path: '/services/listing/:listingId', access: 'public', lane: 'public' }
```

### No database changes needed
All queries use the same `service_listings_browse` view -- only the URL paths and component composition change.

### Implementation order
1. Update route registry (remove marketplace routes, add service listing route)
2. Update `App.tsx` routes + add redirects
3. Enhance `Services.tsx` with live listings section
4. Update `ServiceListingCard` and `ServiceListingDetail` link paths
5. Update Pro Dashboard labels
6. Clean up translation files
