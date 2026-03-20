

## Plan: Tighten Service ↔ Listing Integrity (Final Pass)

### Problem Summary

Four remaining gaps allow the "No micro selected = no listing" contract to break:

1. **Paused orphan listings are visible and reactivatable** — The Paused tab shows 11 listings whose underlying services were removed. The "Unpause" button works without checking if the micro is still selected.
2. **No guard on unpause** — `useUnpauseListing()` sets status to `live` unconditionally.
3. **No reconciliation on page load** — If sync failed after a mutation, drift persists until the next service change.
4. **Sync failure after mutation has no retry** — Service change commits, sync can fail, no recovery.

### Changes

#### 1. Filter Manage Listings to only show service-backed listings
**File:** `src/pages/professional/hooks/useMyListings.ts`

- After fetching listings, also fetch the provider's `professional_services` micro_ids
- Filter out any listing whose `micro_id` is not in the active services set
- This ensures orphan paused listings never appear in the UI regardless of DB state

#### 2. Guard the unpause action
**File:** `src/pages/professional/hooks/useListingEditor.ts`

- In `useUnpauseListing`, before setting `status = 'live'`, verify the listing's `micro_id` exists in `professional_services` for the current user
- If not, show an error toast: "This service is no longer in your selected services. Re-add it first."
- This prevents reactivating orphan listings

#### 3. Auto-sync on Manage Listings page load
**File:** `src/pages/professional/MyServiceListings.tsx`

- Call `sync_service_listings_for_provider` once on mount (fire-and-forget with query invalidation on success)
- This self-heals any drift from previously failed syncs

#### 4. Add sync retry on failure
**File:** `src/pages/onboarding/hooks/useProfessionalServices.ts`

- Wrap `syncServiceListings()` in a retry (1 retry with short delay)
- If retry also fails, show a warning toast but still allow the service mutation to succeed (it already committed)
- Log the failure for observability

#### 5. Clean up the 11 existing orphan paused listings (optional but recommended)
**Migration:** Delete or archive the 11 paused listings that have no matching `professional_services` entry. Since they were auto-paused by sync and have no active service backing them, they are dead weight.

### Technical Details

```text
useMyListings flow (after fix):
  fetch service_listings → fetch professional_services micro_ids
  → filter: only show listings where micro_id ∈ active services
  → return filtered list

useUnpauseListing flow (after fix):
  fetch listing.micro_id → check professional_services for match
  → if no match → toast error, abort
  → if match → update status to 'live'

MyServiceListings mount:
  → fire sync_service_listings_for_provider (background)
  → on success: invalidate my-listings query
```

### What This Achieves

- Paused orphans become invisible in the UI immediately
- Unpause is blocked for deselected services
- Page load self-heals any sync drift
- The contract "only selected micros = visible listings" is enforced at every layer: DB sync, query filter, and action guard

