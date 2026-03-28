

# Service-Level Reputation Audit — Full Report

## A. Current Truth

### Data Model

```text
job_reviews (source of truth for reviews)
├── job_id → jobs.id
├── reviewee_user_id (the pro)
├── rating (1-5)
├── visibility ('public' | 'private')
└── unique(job_id, reviewer_user_id)

professional_micro_stats (per-micro aggregates)
├── user_id + micro_id (unique)
├── completed_jobs_count, total_rating_sum, rating_count
├── avg_rating (generated stored: sum/count)
├── verification_level (auto-calculated via RPC thresholds)
└── Updated by increment_professional_micro_stats RPC

jobs.answers.selected.microIds[] → links a job to micro services
```

### Review Write Path

1. `submitReview.action.ts` inserts into `job_reviews`
2. If `reviewerRole === 'client'`, fetches `jobs.answers.selected.microIds`
3. Calls `awardProStats` → RPC `increment_professional_micro_stats` per micro_id
4. RPC upserts `professional_micro_stats`: increments `completed_jobs_count`, `total_rating_sum`, `rating_count`, recalculates `verification_level`
5. No edit or delete flows exist — stats are additive only, never decremented

### Matching / Ranking

`professional_matching_scores` view joins:
- `professional_services` (eligibility)
- `professional_micro_preferences` (love/like/neutral preference)
- `professional_micro_stats` (per-micro avg_rating, verification_level, completed count)

Score formula: `preference_weight + completed_count*2 + avg_rating*5 + verification_bonus`

**This is correctly per-micro.** A pro's painting rating does not leak into their plumbing score.

---

## B. Problems

### PROBLEM 1: No rating on service listing cards (HIGH)

**Evidence**: `ServiceListingCard.tsx` renders price, views, provider name, and a binary "Verified" / "New Pro" badge. Zero rating display. The `service_listings_browse` view has no rating columns — no join to `professional_micro_stats`.

**Impact**: The marketplace browse page shows no social proof. Users cannot see service quality before clicking.

### PROBLEM 2: No rating on service listing detail page (HIGH)

**Evidence**: `ServiceListingDetail.tsx` (L58-261) shows provider name, verification badge, pricing, views, and a CTA. No rating, no review count, no review list. Each listing has a `micro_id` that maps directly to `professional_micro_stats`, but this join is never made.

**Impact**: The most conversion-critical page has zero reputation signal.

### PROBLEM 3: Public profile shows provider-wide reviews, not per-service (MEDIUM)

**Evidence**: `ProfessionalDetails.tsx` L434 renders `<PublicReviewsSection proUserId={...} />` which queries all public `job_reviews` for that provider. This is provider-wide, not service-specific. No breakdown by micro/service.

**Impact**: A pro with great painting reviews looks equally good for electrical work. This directly contradicts the "master of each task" philosophy.

### PROBLEM 4: ProPerformancePage hardcodes avg_rating: null (LOW)

**Evidence**: `ProPerformancePage.tsx` L69: `avg_rating: null` — never queries `professional_micro_stats` or `job_reviews`.

### PROBLEM 5: No service-level rating on ranked professionals (LOW)

**Evidence**: `rankedProfessionals.query.ts` fetches `professional_profiles` for display but doesn't include per-micro rating from `professional_micro_stats`, even though match_score already incorporates it invisibly.

---

## C. Required Fixes (Ordered by Impact)

### Fix 1: Add per-micro rating to `service_listings_browse` view

**What**: Extend the SQL view to LEFT JOIN `professional_micro_stats` on `(provider_id, micro_id)` to expose `micro_avg_rating`, `micro_rating_count`, `micro_completed_count`, `micro_verification_level`.

**Why**: This is the single highest-leverage change — it makes rating data available to every card and page that reads from this view, with zero additional queries.

**Files**: New migration to DROP + CREATE `service_listings_browse` with the join.

### Fix 2: Show per-micro rating on ServiceListingCard

**What**: Display star rating + count on listing cards using the new view columns. Show nothing if rating_count is 0.

**Files**: `src/pages/services/ServiceListingCard.tsx`, `src/pages/services/queries/serviceListings.query.ts` (update type)

### Fix 3: Show per-micro rating on ServiceListingDetail

**What**: Query `professional_micro_stats` for the listing's `(provider_id, micro_id)` and display rating + count + verification level. Optionally show recent micro-specific reviews from `job_reviews` (requires joining through `jobs.answers` — complex, defer to follow-up).

**Files**: `src/pages/services/ServiceListingDetail.tsx`, `src/pages/services/queries/serviceListings.query.ts`

### Fix 4: Add per-service breakdown to public profile

**What**: In `ProfessionalDetails.tsx`, alongside the existing provider-wide `PublicReviewsSection`, show a per-service stats summary from `professional_micro_stats` for each micro the pro offers. E.g.: "Painting ⭐ 4.9 (18 jobs) · Tiling ⭐ 4.6 (9 jobs) · Carpentry: New"

**Files**: `src/pages/public/ProfessionalDetails.tsx` (new section or enhancement)

### Fix 5: Wire ProPerformancePage admin avg_rating

**What**: Query `professional_micro_stats` grouped by user_id for an admin-facing provider-level average.

**Files**: `src/pages/admin/insights/ProPerformancePage.tsx`

---

## D. Safe Rollout Order

1. **Migration first**: Extend `service_listings_browse` view (zero UI impact, just adds columns)
2. **Cards**: Add rating to `ServiceListingCard` (visual improvement, no risk)
3. **Detail page**: Add micro-specific rating to `ServiceListingDetail`
4. **Profile breakdown**: Add per-service stats section to `ProfessionalDetails`
5. **Admin**: Wire ProPerformancePage

No backfill needed — `professional_micro_stats` is already populated by the RPC on every client→pro review. Any pro with completed+rated jobs already has correct per-micro data.

---

## E. Key Files/Functions

| Layer | File | Role |
|---|---|---|
| View | `service_listings_browse` (migration) | Add micro rating columns |
| Card | `ServiceListingCard.tsx` | Display rating |
| Query | `serviceListings.query.ts` | Update types for new columns |
| Detail | `ServiceListingDetail.tsx` | Show micro-specific rating |
| Profile | `ProfessionalDetails.tsx` | Per-service breakdown |
| Admin | `ProPerformancePage.tsx` | Wire real avg_rating |
| Matching | `professional_matching_scores` view | Already correct per-micro |
| RPC | `increment_professional_micro_stats` | Already correct |
| Write | `submitReview.action.ts` + `awardProStats.action.ts` | Already correct per-micro |

### Confirmed Safe

- Matching/ranking: already per-micro, no cross-service leakage
- Stats RPC: correctly upserts per (user_id, micro_id)
- No duplicate counting possible (unique constraint on reviews + additive-only stats)
- No edit/delete flows = no risk of stats drift

### Confirmed Strategic Alignment

The "master of each task" model is fully supported by the backend. The gap is purely in UI surfacing. All fixes above make the existing per-micro data visible without architectural changes.

