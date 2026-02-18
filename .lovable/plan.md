

# Simplify /services — One Clean Listings Page

## What Changes

The `/services` page currently shows a 16-card category grid as the primary content, with live listings tucked below as "Featured Services". The user wants this flipped: **just show live service listings** as the main content, remove the category grid, and keep the wizard as a visible CTA.

### 1. Rewrite `/services` page to show listings only

Replace the current two-section layout with a single, clean listings grid:

- **Hero**: Keep compact hero banner (existing)
- **Listings grid**: Show all live `service_listings_browse` cards, sorted by recently published
- **Empty state**: If no listings yet, show a clean message with wizard CTA
- **Wizard CTA**: Bottom section — "Not sure who to choose? Post a job and get matched."
- **No category grid**: Remove the 16 category cards entirely (taxonomy still powers the system behind the scenes)

The `categoryIcons` map, `MAIN_CATEGORIES` import, and `CATEGORY_KEYS` import all get removed from this file.

### 2. Keep `/services/:categorySlug` intact

The category drill-down page stays — it's useful when linked from elsewhere (e.g., wizard, SEO). It just won't be the primary discovery path from `/services` anymore.

### 3. Keep `/services/listing/:listingId` intact

Service detail page is already clean and correctly routed.

### 4. No route changes needed

All routes are already consolidated from the previous work. This is purely a page content simplification.

## Technical Details

### File: `src/pages/public/Services.tsx`
- Remove: `MAIN_CATEGORIES` import, `CATEGORY_KEYS` import, `categoryIcons` map, the entire category grid section
- Keep: `useServiceListingsBrowse` hook, `ServiceListingCardComponent`, hero banner, wizard CTA
- Change: Show listings as the primary content (not gated behind "Featured Services" heading)
- Add: Simple empty state when no listings exist
- Remove unused icon imports (most of the lucide icons were for category cards)

### No other files need changes
The route registry, App.tsx, ServiceListingCard, ServiceListingDetail, and all hooks remain as-is.

