

# Provider Draft Editor + Marketplace Connection

## Summary
Build the provider-facing service listing editor so professionals can manage their draft listings, edit content/pricing, and publish to the marketplace. This is the "unlock" that makes `/marketplace` populate with real data and connects wizard tickets to price comparison.

## What Gets Built

### 1. My Service Listings Page (`/professional/listings`)
A new page accessible from the Pro Dashboard that shows the provider's service listings with status tabs (Draft / Live / Paused).

- Tab view using existing `Tabs` component
- Each listing shown as a card with: title, micro name, status badge, hero image thumbnail, starting price
- Actions per card: Edit, Publish (if draft + requirements met), Pause/Unpause (if live)
- Empty state pointing to onboarding to add more services

### 2. Service Listing Editor Page (`/professional/listings/:listingId/edit`)
A form page for editing a single service listing:

**Listing Details Section:**
- Display title (text input, pre-filled from micro name)
- Short description (textarea, 200 char)
- Hero image upload (to `service-images` bucket, provider-scoped folder)
- Gallery images (up to 3 additional images)
- Location base (dropdown/text of Ibiza zones)
- Pricing summary (free text, e.g. "Starting at 40 EUR/hr")

**Pricing Items Section:**
- List of `service_pricing_items` for this listing
- Each row: label, price amount, unit selector (hour/day/sqm/job/item), info description, enable/disable toggle
- Add new pricing item button
- Delete pricing item
- Drag-to-reorder (v1: manual sort_order via up/down buttons)

**Publish Button:**
- Validates required fields client-side (title, description, hero image)
- Calls `UPDATE service_listings SET status = 'live'` (DB trigger handles server-side gating)
- Shows success toast and redirects to listings page

### 3. Pro Dashboard Integration
- Add "My Listings" quick action tile linking to `/professional/listings`
- Add listing count stat card (draft count / live count)

### 4. Wizard Ticket to Price Comparison Hook
- Create `useListingsForJob(microId)` hook that queries `service_listings_browse` filtered by `micro_id`
- Wire into the job detail page as a "Compare Service Providers" section below job details
- Shows matching live service listing cards with starting prices

## Technical Details

### New Files
- `src/pages/professional/MyServiceListings.tsx` - Listings management page with tabs
- `src/pages/professional/ServiceListingEditor.tsx` - Edit form for a single listing
- `src/pages/professional/hooks/useMyListings.ts` - Query hook for provider's own listings
- `src/pages/professional/hooks/useListingEditor.ts` - Mutations for updating listing + pricing items
- `src/pages/jobs/hooks/useListingsForJob.ts` - Hook to fetch matching listings for a job's micro_id

### Route Changes
- Add `/professional/listings` to `proOnboardingRoutes` in registry
- Add `/professional/listings/:listingId/edit` route
- Register both in `App.tsx`

### Database Changes
None required - tables (`service_listings`, `service_pricing_items`, `service_views`) and RLS policies already exist and are properly configured. The `create_draft_service_listings` RPC is already wired into onboarding.

### Storage
`service-images` bucket already exists with provider-scoped upload policies.

### Existing Patterns Used
- `useSession()` for auth context
- `supabase.from()` for all queries/mutations
- `@tanstack/react-query` for cache management
- `toast` from sonner for feedback
- `Card`, `Tabs`, `Button`, `Badge`, `Input`, `Textarea`, `Select` from shadcn/ui
- `Tooltip` for pricing item info descriptions
- Provider-scoped storage upload pattern: `{userId}/{filename}`

### Data Flow

```text
Professional Onboarding
  -> selects micros
  -> create_draft_service_listings RPC fires
  -> draft rows appear in service_listings

Provider Dashboard
  -> "My Listings" link
  -> /professional/listings (tabs: Draft | Live | Paused)
  -> click Edit -> /professional/listings/:id/edit
  -> fill title, description, image, pricing
  -> click Publish -> status = 'live'
  -> listing appears on /marketplace

Wizard Job Created
  -> job has micro_id
  -> job detail page queries service_listings_browse WHERE micro_id = job.micro_id
  -> shows "Compare Service Providers" cards
```

### Implementation Order
1. `useMyListings` hook + `MyServiceListings` page (read-only view of drafts)
2. `useListingEditor` hook + `ServiceListingEditor` page (edit + publish)
3. Pro Dashboard integration (quick action + stats)
4. `useListingsForJob` hook + job detail page integration
5. Route registration

