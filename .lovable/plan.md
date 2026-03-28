

# Phase 1 Trust Upgrade: Repeat Hire Tracking + Neighbourhood Jobs

## Overview
Surface two high-impact trust signals that use data already in the database, require no schema changes, and are impossible to fake.

## Changes

### 1. Repeat Hire Count — Service Listing Detail Page

**File**: `src/pages/services/ServiceListingDetail.tsx`

Add a query in `serviceListings.query.ts` (inside `fetchListingDetail`) that counts how many distinct clients have hired this provider more than once. Query pattern:

```sql
SELECT count(DISTINCT user_id) 
FROM jobs 
WHERE assigned_professional_id = :provider_id 
  AND status = 'completed'
GROUP BY user_id 
HAVING count(*) >= 2
```

This translates to a Supabase RPC or a client-side count from a lightweight query. Since Supabase JS doesn't support `HAVING`, create a small **RPC** `get_provider_repeat_clients(p_provider_id uuid)` that returns a single integer.

Display in the provider sidebar card (below the rating block):
- "Hired again by 3 previous clients" (if count > 0)
- Hidden if 0

### 2. Repeat Hire Count — Public Professional Profile

**File**: `src/pages/public/ProfessionalDetails.tsx`

Add a query using the same RPC. Display in the Quick Facts sidebar:
- Icon: `Users` or `RefreshCw`
- Label: "Repeat clients"
- Value: "5" (or hidden if 0)

### 3. Neighbourhood Jobs Count — Service Listing Detail

**File**: `src/pages/services/ServiceListingDetail.tsx`

The listing already has `location_base` (e.g. "San Antonio"). Jobs store `location.area` in their JSON. Create a small **RPC** `get_provider_area_jobs(p_provider_id uuid, p_area text)` that counts completed jobs in the same area.

Display below repeat hire signal:
- "8 jobs completed near San Antonio" (if count > 0 and location_base exists)
- Hidden otherwise

### 4. Neighbourhood Jobs — Public Professional Profile

**File**: `src/pages/public/ProfessionalDetails.tsx`

Show per-zone job counts in the "Service Area" card. Create RPC `get_provider_zone_jobs(p_provider_id uuid)` returning `{area, count}[]`. Display as enhanced zone badges:
- "San Antonio (12 jobs)" instead of just "San Antonio"

### 5. Repeat Hire Badge — Service Listing Card (Browse)

**File**: `src/pages/services/ServiceListingCard.tsx`

This requires extending `service_listings_browse` view again to include a `repeat_client_count` column. Create a migration that:
- Adds a subquery or LEFT JOIN LATERAL to count distinct clients with 2+ completed jobs for that provider

Display on card: subtle text line "Hired again by X clients" below rating row, only if > 0.

---

## Technical Details

### New Database Objects

**RPC 1**: `get_provider_repeat_clients(p_provider_id uuid) RETURNS integer`
```sql
CREATE OR REPLACE FUNCTION public.get_provider_repeat_clients(p_provider_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM (
    SELECT user_id FROM jobs
    WHERE assigned_professional_id = p_provider_id
      AND status = 'completed'
    GROUP BY user_id
    HAVING count(*) >= 2
  ) x;
$$;
```

**RPC 2**: `get_provider_area_jobs(p_provider_id uuid, p_area text) RETURNS integer`
```sql
CREATE OR REPLACE FUNCTION public.get_provider_area_jobs(p_provider_id uuid, p_area text)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM jobs
  WHERE assigned_professional_id = p_provider_id
    AND status = 'completed'
    AND location->>'area' = p_area;
$$;
```

**View update**: Extend `service_listings_browse` to add `repeat_client_count` via a subquery on jobs.

### Files Changed

| File | Change |
|---|---|
| Migration (new) | 2 RPCs + view update |
| `serviceListings.query.ts` | Call RPCs in detail fetch, add `repeat_client_count` to card type |
| `ServiceListingDetail.tsx` | Show repeat hire + area jobs in sidebar |
| `ServiceListingCard.tsx` | Show repeat hire badge if count > 0 |
| `ProfessionalDetails.tsx` | Add repeat clients to Quick Facts, enhance zone badges with counts |

### Rollout Safety
- All signals hidden when count is 0 — no negative messaging
- RPCs are `SECURITY DEFINER` with `search_path = public` for safety
- View update is additive (new columns only)
- No schema changes to existing tables
- Gated behind data existence, not rollout phase (these are factual signals)

