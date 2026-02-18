

# Marketplace Activation: Demo Seeding + Listing Polish + Backlog Items

## Summary
The marketplace architecture is complete and correctly linked, but with zero listings in the database. The highest-impact move is to populate it with quality demo data while adding small polish features that improve the provider editing experience. We also tackle the two remaining backlog items (#6 Budget UX, #7 Missing Question Packs).

## Phase 1 -- Seed Demo Listings (highest impact)

Create a database migration that inserts 8-10 realistic demo service listings across different categories (construction, plumbing, electrical, HVAC, cleaning) with:
- Realistic display titles, descriptions, and pricing summaries
- 2-4 pricing items per listing with real Ibiza-market prices
- Status set to `live` with `published_at` timestamps
- Placeholder hero image URLs (using existing service-images bucket or public stock)
- Location bases spread across Ibiza zones

This requires creating a "demo provider" professional profile (or using an existing test account) so the listings have a valid `provider_id`.

The query will:
1. Check for existing demo provider or create one
2. Look up real `micro_id` values from `service_micro_categories`
3. Insert `service_listings` rows with status='live'
4. Insert `service_pricing_items` for each listing

## Phase 2 -- Listing Editor Polish

### A) Profile completion indicator on draft cards
On the My Service Listings page, show a "% complete" badge on draft listing cards. Calculated client-side from: has title (20%), has description (20%), has hero image (30%), has 1+ pricing item (20%), has location (10%).

**File**: `src/pages/professional/MyServiceListings.tsx`

### B) Analytics tracking for listing events
Track `listing_published` and `listing_paused` events via the existing `track_event` RPC when providers publish or pause listings.

**File**: `src/pages/professional/hooks/useListingEditor.ts`

## Phase 3 -- Backlog #6: Budget Step UX

Improve the wizard budget step to reduce "TBD" submissions:
- Add quick-select budget range chips (0-250, 250-750, 750-2000, 2000+) as the primary selection
- Make "Not sure yet / TBD" a secondary action (smaller, muted link)
- Move budget selection earlier in the flow if step ordering allows

**Files**: 
- `src/features/wizard/canonical/steps/LogisticsStep.tsx` (or the budget section within it)
- `src/features/wizard/canonical/steps/logistics/constants.ts` (add budget range presets)

## Phase 4 -- Backlog #7: Missing Question Packs

Seed minimal question packs for the 4 micros currently falling back to generic. Each pack will have 6-8 relevant questions covering:
- Property access / parking
- Surface area (sqm)
- Materials included
- Timeframe
- Photo upload prompt
- Specific service details

This will be a database migration inserting into `question_packs`.

## Technical Details

### Demo Seeding Migration
- Creates a system/demo provider profile if none exists
- Maps to real `service_micro_categories` slugs (e.g., `plumbing-general`, `electrical-installation`, `microcement`, `hvac-installation`)
- Each listing gets 3-4 `service_pricing_items` with EUR prices typical for Ibiza market
- All demo listings set to `status = 'live'` with `hero_image_url` pointing to placeholder images

### Completion Badge Logic
```text
completeness = 0
if (title.trim()) completeness += 20
if (description.trim()) completeness += 20
if (heroUrl) completeness += 30
if (pricingItems.length > 0) completeness += 20
if (locationBase) completeness += 10
```
Displayed as a small progress ring or "X% complete" text on draft cards.

### Budget Chips
Add preset ranges to the logistics constants file and render as a row of selectable chips above the existing budget input. Selecting a chip fills in `budget_type: 'range'` with `budget_min` and `budget_max`.

### Implementation Order
1. Demo listings seed migration (immediately populates /marketplace)
2. Completion badge on draft cards
3. Analytics tracking for publish/pause
4. Budget step UX chips
5. Missing question packs seed migration

