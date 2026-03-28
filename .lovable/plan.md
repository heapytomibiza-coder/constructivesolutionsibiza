

# Phase 6 — Trust & Growth Layer

## What Already Exists (No Rebuild Needed)

The platform already has significant infrastructure for this phase:

- **Repeat hire tracking**: `get_provider_repeat_clients` RPC, `repeat_client_count` on listing cards, repeat client count on professional profiles, admin `RepeatWorkPage`
- **Pro matching scores**: `professional_matching_scores` view with preference/completion/rating/verification scoring
- **Micro-level stats**: `professional_micro_stats` table tracking per-service ratings and completions
- **Trend data**: `daily_category_metrics`, `daily_platform_metrics`, admin TrendRadar page
- **Entitlements**: `demand_data` feature flag already gated to Gold/Elite tiers
- **Pro Insights page**: exists at `/professional/insights` as a placeholder

This means we extend, not rebuild.

---

## Implementation Plan

### Ticket 1: Client Reputation System
**Priority:** P1 | **Owner:** Database + Frontend | **Effort:** 4 hours

**Migration:**
- Create `client_reputation` table: `user_id (PK)`, `total_jobs`, `completed_jobs`, `completion_rate`, `review_rate`, `dispute_rate`, `repeat_hire_rate`, `avg_response_hours`, `score (0-100)`, `badges TEXT[]`, `updated_at`
- RLS: self-read + admin-read + pro-read (for pros viewing clients on their jobs)
- Create `calculate_client_reputation(p_user_id)` RPC (SECURITY DEFINER):
  - Queries `jobs`, `job_reviews`, `disputes`, `conversations`, `repeat_hires` data
  - Computes score: completion_rate * 20 + review_rate * 20 + (1-dispute_rate) * 20 + response_speed * 20 + repeat_hire_factor * 20
  - Derives badges: "Reliable Client" (score >= 80), "Fast Responder" (avg_response < 4h), "Consistent Reviewer" (review_rate >= 0.7)
  - Upserts into `client_reputation`
- Create trigger: on job completion + review submission, call `calculate_client_reputation` for the client

**Frontend:**
- On quote/conversation views (pro side): show client badges from `client_reputation`
- Subtle, informational — not public-facing

**Files affected:** New migration, new `src/hooks/useClientReputation.ts`, update conversation/quote pro-facing UI

---

### Ticket 2: Enhanced Pro Ranking Engine
**Priority:** P1 | **Owner:** Database + Frontend | **Effort:** 3 hours

**Migration:**
- Create `professional_rankings` table: `user_id (PK)`, `rating_avg`, `completion_rate`, `response_speed_score`, `repeat_hire_rate`, `activity_score`, `ranking_score`, `labels TEXT[]`, `updated_at`
- Create `calculate_professional_ranking(p_user_id)` RPC:
  - Aggregates from `professional_micro_stats`, `jobs`, `conversations`, existing repeat-hire data
  - `ranking_score = rating_avg * 0.25 + completion_rate * 0.2 + response_speed * 0.15 + repeat_hire_rate * 0.2 + activity_score * 0.2`
  - Derives labels: "Top Rated" (rating >= 4.7), "Highly Reliable" (completion >= 90%), "In Demand" (recent job count top 20%)
  - Upserts into `professional_rankings`
- Trigger: recalculate on job completion, review submission
- Update `professional_matching_scores` view or search queries to factor in `ranking_score` as a secondary sort signal

**Frontend:**
- Show labels on professional cards and profiles (existing badge component)
- Do NOT expose numeric score
- Integrate into `rankedProfessionals.query.ts` as tiebreaker

**Files affected:** New migration, update `rankedProfessionals.query.ts`, update `ServiceListingCard.tsx` and `ProfessionalDetails.tsx`

---

### Ticket 3: Repeat Hire Badges on Job/Quote Screens
**Priority:** P1 | **Owner:** Frontend | **Effort:** 1 hour

**What:** Repeat hire data already exists via `get_provider_repeat_clients`. Currently shown on profiles and listing cards. Extend to:
- **Pro's quote view**: "You've worked with this client X times"
- **Client's quote view**: "You've hired this pro X times before" badge
- Create a lightweight RPC `get_repeat_hire_pair(p_client_id, p_pro_id)` returning `hire_count` and `last_hired_at` derived from completed jobs

**Files affected:** New migration (RPC), update quote/conversation components

---

### Ticket 4: Pro Demand Intelligence Dashboard
**Priority:** P2 | **Owner:** Database + Frontend | **Effort:** 3 hours

**What:** Transform the placeholder `ProInsights` page into a real demand dashboard, gated by `hasFeature(tier, 'demand_data')` (Gold/Elite only).

**Migration:**
- Create `demand_snapshots` table: `id`, `category`, `area`, `job_count_7d`, `job_count_30d`, `pct_change_7d`, `snapshot_date`, `created_at`
- Create `refresh_demand_snapshots()` RPC that aggregates from `jobs` table (similar logic to existing admin TrendRadar but stored for pro consumption)
- Schedule via cron every 6 hours

**Frontend (ProInsights page):**
- Tier gate: if Bronze/Silver, show upgrade prompt
- Dashboard: trending categories (bar chart or list), hot areas, week-over-week growth
- Reuse existing `Badge`, `Card` components and TrendRadar patterns
- Pull from `demand_snapshots` table

**Files affected:** New migration, rewrite `src/pages/professional/ProInsights.tsx`, new `src/pages/professional/hooks/useDemandData.ts`

---

## Build Order

| Week | Tickets | Rationale |
|------|---------|-----------|
| 1 | T3 (repeat badges on quotes), T1 (client reputation) | Fastest trust signals, high visibility |
| 2 | T2 (pro ranking engine) | Improves search quality |
| 3 | T4 (demand intelligence) | Premium feature, monetisation lever |

## Technical Notes

- All scoring RPCs use SECURITY DEFINER to access cross-table data safely
- Recalculation triggers fire asynchronously (trigger inserts into a queue, or uses `pg_notify`) to avoid slowing down job completion
- No new edge functions needed — all logic is database-first via RPCs and triggers
- Existing `professional_matching_scores` view is preserved; ranking_score is additive
- Client reputation is visible to pros only (not public) to avoid negative UX

## What This Does NOT Include (Intentional)

- Payment reliability signals (blocked on Stripe integration)
- Exposing numeric scores to users
- Public-facing client ratings
- Materialized `repeat_hires` table (derived on-the-fly from jobs, which is sufficient at current scale)

