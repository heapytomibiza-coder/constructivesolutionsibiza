

# Polish Pass: Service Detail and Cross-Links

## Changes

### 1. Hide low view counts on service detail
In `ServiceListingDetail.tsx`, conditionally render the view count row only when `listing.view_count >= 10`. Low single-digit counts damage credibility.

### 2. Add category/micro context badges on service detail
Above the title in `ServiceListingDetail.tsx`, add breadcrumb-style badges showing the taxonomy path (category > subcategory > micro). Data already exists — the query fetches `micro` but we also need category/subcategory. Extend the detail query to join `service_micro_categories → service_subcategories → service_categories` to get `category_name`, `subcategory_name`, and `micro_name`. Display as inline badges above the title.

### 3. Add cross-links between directory and marketplace
- **Service detail page**: Already has "Back to Services" and "View Tasker Profile" — good.
- **Professional profile page**: Add a subtle "Browse all services" link at the bottom of the Services section card, linking to `/services`. This gives users a way out to the broader marketplace.
- **Professionals directory**: Add a small "Or browse services →" text link below the listings grid, linking to `/services`. Creates the bidirectional bridge.

### 4. Clarify /services/:categorySlug purpose
The `ServiceCategory.tsx` page is actually a wizard entry point (shows subcategories → navigates to `/post`), not a marketplace filter. No code change needed now — the page already has clear "What kind of work?" framing and links to `/professionals?category=...` as an alternative. This is architecturally fine as-is; renaming/restructuring is a future decision.

## Files modified

- `src/pages/services/ServiceListingDetail.tsx` — hide low views, add taxonomy badges
- `src/pages/services/queries/serviceListings.query.ts` — extend detail query to fetch category/subcategory names
- `src/pages/public/ProfessionalDetails.tsx` — add "Browse all services" cross-link
- `src/pages/public/Professionals.tsx` — add "Browse services" cross-link

## No database changes needed

