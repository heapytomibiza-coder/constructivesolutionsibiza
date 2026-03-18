

# Plan: Hide Quotes, Services Timeline, and Profile Page Enrichment

## Three questions answered

### 1. Hide Quotes
Quotes are rendered in `JobDetailsModal.tsx` (line 380) behind a `founding-members` rollout gate. The simplest approach: **change the gate to `service-layer`** so quotes are hidden until the next rollout phase. This keeps the code intact and ready to re-enable with a single rollout bump.

**File:** `src/pages/jobs/JobDetailsModal.tsx` line 380
- Change `isRolloutActive('founding-members')` → `isRolloutActive('service-layer')`

### 2. Services Release Timeline
The services marketplace (`/services`, service listings, browse view) is gated behind the **`service-layer`** rollout phase — the next phase after the current `founding-members`. Per your 12-week roadmap with 2-week phases, **services would release in approximately 2 weeks** when you bump `CURRENT_ROLLOUT` to `'service-layer'` in `src/domain/rollout.ts`. That is entirely your call — one line change when ready.

### 3. Professional Profile Page — What's Missing and What to Add

The current `ProfessionalDetails.tsx` page is minimal: avatar, name, bio, services count, verification badge, and two CTAs. But the database already has rich data that is not being surfaced.

**Data already available in `professional_profiles`:**
- `business_name`, `tagline`
- `service_zones` (array of areas served)
- `availability_status` (available / busy / unavailable)
- `typical_lead_time` (same_day / same_week / next_week)
- `accepts_emergency` (boolean)
- `pricing_model`, `hourly_rate_min/max`, `day_rate`, `minimum_call_out`
- `verification_status`

**Data available from related tables:**
- `service_listings` → their active services (gated to service-layer, but structure exists)
- `job_reviews` → public reviews with ratings (gated to trust-engine)
- `professional_micro_preferences` → what micro-categories they specialise in
- `professional_documents` → verification documents (admin-only, not public)

**Proposed enriched profile layout:**

```text
┌─────────────────────────────────────────┐
│  HERO: Avatar + Name + Tagline          │
│  Business name · Verified badge         │
│  Availability pill (Available/Busy)     │
├─────────────────────────────────────────┤
│  LEFT COLUMN (2/3)                      │
│  ┌─────────────────────────────────┐    │
│  │ About (bio)                     │    │
│  ├─────────────────────────────────┤    │
│  │ Specialisations                 │    │
│  │ (micro-category badges)         │    │
│  ├─────────────────────────────────┤    │
│  │ Service Area                    │    │
│  │ (zone badges from service_zones)│    │
│  ├─────────────────────────────────┤    │
│  │ Reviews (trust-engine phase)    │    │
│  │ Coming Soon placeholder         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  RIGHT COLUMN (1/3)                     │
│  ┌─────────────────────────────────┐    │
│  │ Start a Job CTA                 │    │
│  ├─────────────────────────────────┤    │
│  │ Quick Facts                     │    │
│  │ • Lead time: Same week          │    │
│  │ • Emergency: Yes ⚡             │    │
│  │ • Pricing: From €X/hr           │    │
│  │ • Services: N offered           │    │
│  ├─────────────────────────────────┤    │
│  │ Quick Message CTA               │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Implementation steps:**

1. **Hide quotes** — one line change in `JobDetailsModal.tsx`
2. **Enrich the profile query** — expand the `professional_profiles` select to include `business_name`, `tagline`, `service_zones`, `availability_status`, `typical_lead_time`, `accepts_emergency`, `pricing_model`, `hourly_rate_min`, `hourly_rate_max`, `day_rate`, `minimum_call_out`
3. **Fetch specialisations** — join or second query to `professional_micro_preferences` for micro-category names
4. **Rebuild the page layout** — add the new sections (specialisations, service area, quick facts sidebar)
5. **Availability pill** — coloured badge showing current status
6. **Pricing display** — show rate range if `pricing_model` is not `quote_required`; otherwise show "Quote on request"
7. **Reviews placeholder** — "Reviews coming soon" section, gated to `trust-engine` phase

No database changes needed — all data already exists.

## Technical details

- **Files modified:** `src/pages/jobs/JobDetailsModal.tsx` (1 line), `src/pages/public/ProfessionalDetails.tsx` (full rework)
- **New queries:** `professional_micro_preferences` joined with `service_micro_categories` for specialisation names
- **No migrations required**
- **Rollout-aware:** reviews section only renders when `trust-engine` phase is active

