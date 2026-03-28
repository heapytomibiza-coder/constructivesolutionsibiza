

# Review Aggregate Accuracy Fix

## Problem
Two surfaces compute provider-level avg/count from a limit-10 fetch, producing wrong results for providers with 10+ reviews.

## Changes

### 1. `src/pages/public/components/PublicReviewsSection.tsx`

Add a second query that fetches only `rating` from all public reviews (no limit) for true aggregate. Keep existing limit-10 query for display list.

- New query key: `['public_pro_review_agg', proUserId]` — fetches all ratings
- Existing query: unchanged, limit 10 for display
- Header avg/count: sourced from aggregate query
- Empty state: uses aggregate count (0 = "No reviews yet")

### 2. `src/pages/admin/queries/adminUserDetails.query.ts`

Add a parallel query in the `Promise.all` that fetches all public review ratings (no limit, `rating` column only). Use that for `review_avg` and `review_count`. Keep the existing limit-10 fetch for `recent_reviews` display.

- Add: `supabase.from("job_reviews").select("rating").eq("reviewee_user_id", userId).eq("visibility", "public")` (no limit)
- Compute `review_avg` and `review_count` from this full fetch
- `recent_reviews` stays from the existing limit-10 fetch

### Files unchanged
- `ProProfileDrawer.tsx` — already correct
- `TaskerTab.tsx` — no logic, just displays
- `ProfessionalDetails.tsx` — delegates to `PublicReviewsSection`

## Technical notes
- Full aggregate queries fetch only the `rating` column — minimal payload
- No schema or UI design changes

