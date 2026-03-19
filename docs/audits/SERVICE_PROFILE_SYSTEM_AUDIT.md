# Service–Profile System Audit
**Date:** 2026-03-19  
**Scope:** Full 13-part audit of all service/profile entities, routes, state machines, and data flows

---

## Part 1: Audit Scope Summary

### Areas Audited
- Professional profile creation, editing, and visibility
- Service listing creation, editing, publishing, and moderation
- Taxonomy assignment (category → subcategory → micro)
- Onboarding wizard (4-step linear flow)
- Dashboard state-aware navigation
- Public profile and service detail pages
- Admin review and moderation tools
- CTA routing between profile, service, and job posting

---

## Part 2: Entity Map

### 2.1 User (auth.users + profiles + user_roles)

| Field | Value |
|-------|-------|
| **Definition** | A person with an account |
| **Purpose** | Authentication identity, role assignment |
| **Created in** | Auth signup flow (`/auth`) |
| **Edited in** | `/settings`, `/professional/profile` (phone only) |
| **Reviewed in** | Admin dashboard (`rpc_admin_users_list`) |
| **Displayed in** | Everywhere via `useSessionSnapshot` |
| **Required relationships** | `user_roles` (1:1), optional `profiles` (1:1), optional `professional_profiles` (1:1) |
| **Key fields** | `email`, `id` (from auth.users); `display_name`, `phone` (from profiles) |
| **Status fields** | `suspended_at` (user_roles) |
| **Visibility rules** | Private — only exposed through views/RPCs |

### 2.2 Professional Profile (professional_profiles)

| Field | Value |
|-------|-------|
| **Definition** | A professional's identity, capabilities, and marketplace state |
| **Purpose** | Control onboarding flow, visibility, and matching eligibility |
| **Created in** | Auto-created when user selects "professional" role during signup |
| **Edited in** | `/professional/profile` (ProfileEdit.tsx), `/onboarding/professional` (BasicInfoStep, ServiceAreaStep) |
| **Reviewed in** | Admin dashboard (users tab), admin actions log |
| **Displayed in** | `/professionals/:id` (public), `/dashboard/pro`, service listing sidebar |
| **Required relationships** | `user_roles` (same user_id), `profiles` (phone lives here) |
| **Key fields** | `display_name`, `bio`, `tagline`, `business_name`, `avatar_url`, `service_zones`, `service_area_type` |
| **Status fields** | `onboarding_phase`, `verification_status`, `is_publicly_listed`, `profile_status` |
| **Visibility rules** | Public only when `is_publicly_listed = true` (DB trigger enforces `onboarding_phase = 'complete'`) |
| **⚠️ Conflict** | `display_name` exists in BOTH `profiles` and `professional_profiles`. BasicInfoStep writes to both. ProfileEdit writes to `professional_profiles` only. |
| **⚠️ Conflict** | `profile_status` ('draft'/'live') vs `onboarding_phase` — two independent status columns with overlapping intent |

### 2.3 Service (professional_services)

| Field | Value |
|-------|-------|
| **Definition** | A binary toggle linking a professional to a micro-category ("I offer this") |
| **Purpose** | Job matching — determines which jobs a pro sees |
| **Created in** | Onboarding ServiceUnlockStep, or dashboard via "Add / Remove Categories" |
| **Edited in** | Same as creation — toggle on/off |
| **Reviewed in** | Not directly reviewed — auto-counted via `services_count` on professional_profiles |
| **Displayed in** | ReviewStep checklist, ProfileEdit (count), Dashboard guidance cards |
| **Required relationships** | `service_micro_categories` (FK on micro_id) |
| **Key fields** | `micro_id`, `user_id`, `status` ('offered'), `notify`, `searchable` |
| **Status fields** | `status` (offered/removed) |
| **Visibility rules** | Internal only — feeds matching, not shown publicly as-is |

### 2.4 Service Listing (service_listings)

| Field | Value |
|-------|-------|
| **Definition** | A publishable, client-facing service page with description, images, and pricing |
| **Purpose** | Marketplace discovery — public-facing service card |
| **Created in** | Auto-created as draft by `create_draft_service_listings()` RPC when professional_services toggle ON |
| **Edited in** | `/professional/listings/:listingId/edit` (ServiceListingEditor.tsx) |
| **Reviewed in** | Admin can update via RLS policy; no dedicated review queue exists |
| **Displayed in** | `/services` (ServiceMarketplace), `/services/listing/:listingId` (ServiceListingDetail) |
| **Required relationships** | `service_micro_categories` (FK), `service_pricing_items` (1:many), `professional_profiles` (via provider_id) |
| **Key fields** | `display_title`, `short_description`, `hero_image_url`, `gallery`, `location_base`, `pricing_summary` |
| **Status fields** | `status` ('draft'/'live'/'paused') |
| **Visibility rules** | Public when `status = 'live'` via `service_listings_browse` view (security_invoker=false) |
| **⚠️ Note** | Grandfathered listings (created before 2026-03-19) skip validation. New ones require title + description + pricing item. |

### 2.5 Service Pricing Item (service_pricing_items)

| Field | Value |
|-------|-------|
| **Definition** | A line item on a service listing's pricing menu |
| **Purpose** | Structured pricing display on public listing page |
| **Created in** | ServiceListingEditor (Add Item button) |
| **Edited in** | ServiceListingEditor |
| **Displayed in** | ServiceListingDetail (public pricing table), service_listings_browse view (starting_price) |
| **Key fields** | `label`, `price_amount`, `unit`, `is_enabled`, `sort_order` |

### 2.6 Taxonomy: Categories → Subcategories → Micros

| Entity | Table | Status |
|--------|-------|--------|
| Category | `service_categories` | 16 locked, read-only |
| Subcategory | `service_subcategories` | Read-only, FK to category |
| Micro | `service_micro_categories` | Read-only, FK to subcategory |

- **Queried via:** `useServiceTaxonomy()` hook
- **Search index:** `service_search_index` materialized view
- **No admin UI for editing taxonomy** — managed via migrations

### 2.7 Verification / Trust Markers

| Field | Value |
|-------|-------|
| **Source** | `professional_profiles.verification_status` ('unverified'/'pending'/'verified'/'rejected') |
| **Who sets it** | Admin only (via admin dashboard) |
| **Impact on visibility** | None — soft launch means verification is a trust badge, NOT a gate |
| **Displayed in** | Public profile badge, service listing sidebar |
| **⚠️ Note** | `professional_documents` table exists for doc uploads but has no UI integration for the verification workflow |

### 2.8 Profile Completeness

| Field | Value |
|-------|-------|
| **Calculated in** | `deriveDashboardStage()` in useProStats.ts — client-side only |
| **Also calculated in** | `ReviewStep` — independent checklist (hasBasicInfo, hasPhone, hasServiceArea, hasServices) |
| **Also calculated in** | `MyServiceListings` — `getCompleteness()` for listing % |
| **⚠️ Duplicate logic** | Three independent completeness calculations with different criteria |

### 2.9 Publishing State

| Entity | Publish trigger | Validation |
|--------|----------------|------------|
| Professional Profile | ReviewStep "Go Live" button | hasBasicInfo + hasPhone + hasServiceArea + hasServices |
| Service Listing | ServiceListingEditor "Publish" OR MyServiceListings "Publish" | Client-side: title + description + heroUrl + startingPrice. DB trigger: title + description + pricing item (new listings only) |
| **⚠️ Conflict** | Client-side validation for listings requires `hero_image_url`, but DB trigger does NOT (was removed to grandfather old listings). New listings that pass DB validation but have no hero image will look broken publicly. |

---

## Part 3: Source of Truth Matrix

| Item | Canonical Source | Created in | Edited in | Read in | Approved in | Publicly visible? |
|------|-----------------|------------|-----------|---------|-------------|-------------------|
| Professional display_name | `professional_profiles.display_name` | Onboarding BasicInfoStep | ProfileEdit, BasicInfoStep | Dashboard, public profile, service sidebar | N/A | Yes (when listed) |
| Phone | `profiles.phone` | BasicInfoStep | ProfileEdit, BasicInfoStep | ReviewStep (fresh query), SessionSnapshot | N/A | No (internal) |
| Bio / description | `professional_profiles.bio` | BasicInfoStep | ProfileEdit | Public profile | N/A | Yes |
| Tagline | `professional_profiles.tagline` | BasicInfoStep | ProfileEdit | Public profile, service sidebar | N/A | Yes |
| Service zones | `professional_profiles.service_zones` | ServiceAreaStep | ServiceAreaStep (via onboarding edit mode) | ReviewStep (fresh query), job matching | N/A | No |
| Service name / taxonomy | `service_micro_categories.name` | Migrations | Read-only | Everywhere | N/A | Yes |
| Listing display_title | `service_listings.display_title` | Auto from micro name | ServiceListingEditor | ServiceMarketplace, ServiceListingDetail | N/A | Yes (when live) |
| Listing description | `service_listings.short_description` | Empty (draft) | ServiceListingEditor | ServiceMarketplace, ServiceListingDetail | N/A | Yes |
| Hero image | `service_listings.hero_image_url` | Null (draft) | ServiceListingEditor | ServiceMarketplace, ServiceListingDetail | N/A | Yes |
| Pricing display | `service_pricing_items` + `service_listings.pricing_summary` | Empty | ServiceListingEditor | ServiceListingDetail | N/A | Yes |
| Gallery images | `service_listings.gallery` | Empty array | ServiceListingEditor | ServiceListingDetail | N/A | Yes |
| Verification status | `professional_profiles.verification_status` | Default 'unverified' | Admin only | Public badge | Admin | Yes (badge) |
| Onboarding phase | `professional_profiles.onboarding_phase` | Default 'not_started' | Each onboarding step advances it | Dashboard stage, route guards | N/A | No |
| Public visibility | `professional_profiles.is_publicly_listed` | Default false | ReviewStep "Go Live", ProfileEdit toggle | DB trigger enforces complete phase | N/A | Controls listing |
| Listing status | `service_listings.status` | Default 'draft' | ServiceListingEditor, MyServiceListings | Browse view, detail page | N/A | 'live' = visible |

### ⚠️ Flagged Conflicts

1. **`display_name` duplication**: Exists in both `profiles.display_name` and `professional_profiles.display_name`. BasicInfoStep writes to both. ProfileEdit only writes to `professional_profiles`. If a pro only uses ProfileEdit, `profiles.display_name` becomes stale.

2. **`profile_status` vs `onboarding_phase`**: `professional_profiles` has both `profile_status` ('draft'/'live') and `onboarding_phase` ('not_started'→'complete'). ReviewStep sets both when going live. But `profile_status` is never read in application code — it's dead state.

3. **Listing publish validation mismatch**: Client-side requires `hero_image_url`. DB trigger (for new listings) does NOT require it. Grandfathered listings skip all validation.

---

## Part 4: State / Lifecycle Map

### 4.1 Professional Profile Lifecycle

```
                    ┌──────────────┐
                    │  not_started │ ← Initial state
                    └──────┬───────┘
                           │ BasicInfoStep saves
                    ┌──────▼───────┐
                    │  basic_info  │
                    └──────┬───────┘
                           │ ServiceAreaStep saves
                    ┌──────▼───────┐
                    │ service_area │
                    └──────┬───────┘
                           │ ServiceUnlockStep saves
                    ┌──────▼───────┐
                    │ service_setup│
                    └──────┬───────┘
                           │ ReviewStep "Go Live"
                    ┌──────▼───────┐
                    │   complete   │ + is_publicly_listed = true
                    └──────────────┘
```

**Phase progression rules** (from `phaseProgression.ts`):
- Phases can ONLY advance forward, never regress
- Legacy phases normalized: `verification` → `service_area`, `services` → `service_setup`, `review` → `complete`
- `isPhaseReady()` = true when `service_setup` or `complete`

| State | Meaning | Who sets it | Dashboard | Admin | Public |
|-------|---------|-------------|-----------|-------|--------|
| not_started | Just created account | System | shows "Complete profile" | visible in users list | Hidden |
| basic_info | Name/phone filled | BasicInfoStep | shows "Choose services" | visible | Hidden |
| service_area | Zones selected | ServiceAreaStep | shows "Choose services" | visible | Hidden |
| service_setup | Services selected | ServiceUnlockStep | shows "Review & Go Live" | visible | Hidden |
| complete | Fully onboarded | ReviewStep | shows "Active" or "Turn on visibility" | visible | Visible (if is_publicly_listed) |

**DB Trigger guard**: `enforce_pro_public_listing_guard()` forces `is_publicly_listed = false` whenever `onboarding_phase != 'complete'`.

### 4.2 Service Listing Lifecycle

```
     ┌────────┐
     │  draft │ ← Auto-created when pro toggles a micro ON
     └────┬───┘
          │ Pro fills in details + clicks Publish
     ┌────▼───┐
     │  live  │ ← Visible on /services marketplace
     └────┬───┘
          │ Pro clicks Pause
     ┌────▼────┐
     │ paused  │ ← Hidden from marketplace
     └────┬────┘
          │ Pro clicks Unpause
          └──→ live
```

| From | To | Trigger | Actor | Validation |
|------|----|---------|-------|------------|
| draft | live | Publish button | Professional | Client: title + desc + hero + price. DB: title + desc + pricing item (new only) |
| live | paused | Pause button | Professional | None |
| paused | live | Unpause button | Professional | Same as publish (re-triggers DB validation) |
| any | draft | (not implemented) | — | **⚠️ No way to un-publish back to draft** |
| any | removed/archived | (not implemented) | — | **⚠️ No archive state exists** |

### 4.3 Critical Decision: What happens when a live listing is edited?

**Current behaviour**: It remains live. Edits are immediately public. No review step, no pending revision, no re-approval needed.

**Implication**: A pro can publish a listing, then edit it to contain inappropriate content with no moderation gate.

### 4.4 Dashboard Stage (derived, not persisted)

Computed by `deriveDashboardStage()` in `useProStats.ts`:

| Stage | Condition | Guidance Card |
|-------|-----------|---------------|
| needs_profile | No display_name | "Complete your profile" → `/professional/profile` |
| needs_services | display_name exists, 0 services | "Choose your services" → `/onboarding/professional?step=services` |
| needs_review | services > 0, phase < complete | "Review and go live" → `/onboarding/professional` |
| needs_visibility | phase = complete, not publicly listed | "Turn on visibility" → `/professional/profile` |
| active | complete + publicly listed | No card |

---

## Part 5: Route and Page Audit

### 5.1 Onboarding Routes

| Route | Purpose | Primary User | Reads From | Writes To | Primary CTA | Back Goes To | Next Step | Issues |
|-------|---------|-------------|------------|-----------|-------------|--------------|-----------|--------|
| `/onboarding/professional` | 4-step linear wizard | Professional | professional_profiles, profiles, professional_services | professional_profiles, profiles | Step-specific | Previous step / dashboard (edit mode) | Next step | ✅ Clean |
| `/onboarding/professional?edit=1` | Tracker overview for editing | Professional | Same | Same | Jump to any step | Dashboard | Step selected | ✅ Clean |
| `/onboarding/professional?step=services` | Deep-link to services step | Professional | taxonomy, professional_services | professional_services | "Continue" | Previous step | Review | Used from Dashboard + ProfileEdit |

### 5.2 Dashboard Routes

| Route | Purpose | Primary User | Reads From | Writes To | Primary CTA | Issues |
|-------|---------|-------------|------------|-----------|-------------|--------|
| `/dashboard` | Resolver — redirects by role | Any authed | useSession.activeRole | — | N/A | ✅ Clean |
| `/dashboard/pro` | Pro navigation hub | Professional | useProStats, useSession | — | Stage-dependent guidance card | ✅ Clean |
| `/dashboard/client` | Client dashboard | Client | jobs, conversations | — | View jobs | ✅ Clean |

### 5.3 Professional Management Routes

| Route | Purpose | Primary User | Reads From | Writes To | Primary CTA | Issues |
|-------|---------|-------------|------------|-----------|-------------|--------|
| `/professional/profile` | Edit profile | Professional | professional_profiles, profiles | professional_profiles, profiles | Save Profile → `/dashboard/pro` | **⚠️ Duplicates BasicInfoStep fields** |
| `/professional/listings` | Manage service listings | Professional | service_listings, service_micro_categories, service_pricing_items | — | Edit / Publish / Pause | ✅ Clean |
| `/professional/listings/:id/edit` | Edit single listing | Professional | service_listings, service_pricing_items | service_listings, service_pricing_items | Save / Publish | ✅ Clean |
| `/professional/services` | (registered but no component found) | Professional | — | — | — | **⚠️ Unused route?** |
| `/professional/portfolio` | (registered but no component found) | Professional | — | — | — | **⚠️ Unused route?** |
| `/professional/priorities` | Job priority preferences | Professional | professional_micro_preferences | professional_micro_preferences | Save | ✅ Clean |
| `/professional/insights` | Pro analytics | Professional | Various | — | — | ✅ Clean |

### 5.4 Public Routes

| Route | Purpose | Primary User | Reads From | Writes To | Issues |
|-------|---------|-------------|------------|-----------|--------|
| `/services` | Browse live listings | Anyone | service_listings_browse view | — | ✅ Clean |
| `/services/:categorySlug` | Browse by category | Anyone | service_listings_browse + filter | — | ✅ Clean |
| `/services/listing/:listingId` | View single listing | Anyone | service_listings, pricing_items, professional_profiles, taxonomy | service_views | ✅ Clean |
| `/professionals` | Browse professionals | Anyone | professional_profiles (is_publicly_listed) | — | ✅ Clean |
| `/professionals/:id` | View professional profile | Anyone | professional_profiles, professional_services | — | ✅ Clean |

### 5.5 Admin Routes

| Route | Purpose | Issues |
|-------|---------|--------|
| `/dashboard/admin` | Main admin cockpit | Has users tab but **no dedicated service listing review queue** |

**⚠️ Missing**: No admin route for reviewing/moderating service listings specifically. Admin can update listings via RLS but there's no UI for it.

---

## Part 6: Interaction Map

```
                    ┌─────────────────────┐
                    │   Onboarding Wizard  │
                    │  /onboarding/pro     │
                    └──────────┬──────────┘
                         writes│
                    ┌──────────▼──────────┐
                    │ professional_profiles│◄──── reads ──── Dashboard (useProStats)
                    │      profiles       │◄──── reads ──── ProfileEdit
                    │ professional_services│◄──── reads ──── ReviewStep
                    └──────────┬──────────┘
                         trigger│ (on professional_services INSERT)
                    ┌──────────▼──────────┐
                    │  service_listings    │◄──── writes ── ServiceListingEditor
                    │    (draft auto)      │◄──── reads ─── MyServiceListings
                    └──────────┬──────────┘
                         when live│
                    ┌──────────▼──────────┐
                    │ service_listings_    │◄──── reads ─── ServiceMarketplace
                    │   browse (view)      │◄──── reads ─── ServiceListingDetail
                    └─────────────────────┘

                    ┌─────────────────────┐
                    │   ProfileEdit       │
                    │ /professional/profile│
                    └──────────┬──────────┘
                         writes│ professional_profiles + profiles
                         reads │ professional_profiles + profiles
                         links │→ /onboarding/professional?edit=1&step=services
                         links │→ /professional/priorities
```

### CTA Routing Map

| From | CTA | Destination |
|------|-----|-------------|
| ServiceListingDetail | "Start a Job" | `/post?...` (wizard with micro context) |
| ServiceListingDetail | "View Tasker Profile" | `/professionals/:id` |
| ProDashboard (needs_profile) | "Edit Profile" | `/professional/profile` |
| ProDashboard (needs_services) | "Choose Your Services" | `/onboarding/professional?step=services` |
| ProDashboard (needs_review) | "Finish Setup" | `/onboarding/professional` |
| ProDashboard (needs_visibility) | "Edit Visibility" | `/professional/profile` |
| ProfileEdit | "Edit Services" | `/onboarding/professional?edit=1&step=services` |
| MyServiceListings | "Add / Remove Categories" | `/onboarding/professional?edit=1&step=services` |
| MyServiceListings | "Edit" | `/professional/listings/:id/edit` |

---

## Part 7: Duplicate Logic Audit

| Logic Area | Exists In | Should Own It | Problem Created | Action Needed |
|------------|-----------|---------------|-----------------|---------------|
| **Profile field collection** (name, phone, bio, tagline) | 1) BasicInfoStep 2) ProfileEdit | ProfileEdit (post-onboarding) | Same fields collected in two places with slightly different write patterns. BasicInfoStep writes `profiles.display_name`, ProfileEdit does not. | **Centralize**: Make ProfileEdit the canonical editor. Onboarding should use a simplified version or same component. |
| **Service selection** | ServiceUnlockStep only | ServiceUnlockStep ✅ | Clean — single owner | No action |
| **Profile completeness** | 1) `deriveDashboardStage()` 2) ReviewStep checklist 3) ProfessionalOnboarding `stepCompletion` | One shared function | Three independent calculations with different field checks | **Centralize** into a shared `getProfileCompleteness()` utility |
| **Listing completeness** | `getCompleteness()` in MyServiceListings | Single location ✅ | OK but only used for progress bar display | Consider elevating to shared util |
| **Publish eligibility** (listings) | 1) `canPublish` in MyServiceListings (title+desc+hero) 2) `canPublish` in ServiceListingEditor (title+desc+hero+price) 3) DB trigger `validate_service_listing_live` (title+desc+pricing item, new only) 4) DB trigger `enforce_service_listing_publish_gate` (title+desc+hero) | **DB trigger should be the single source** | Different validation at each layer! Editor requires hero+price, MyListings requires title+desc+hero, DB requires title+desc. Client and server disagree. | **Critical**: Unify validation. DB trigger should be the canonical gate. Client validation should mirror it exactly. |
| **Taxonomy resolution** | `useServiceTaxonomy()` hook + `service_search_index` view | useServiceTaxonomy ✅ | Clean | No action |
| **CTA destination logic** | Scattered across Dashboard, ProfileEdit, MyServiceListings | Each page determines its own CTAs | Minor — but "Edit Services" always routes to onboarding wizard, not a standalone page | Consider whether services editing should live outside onboarding |
| **Back navigation** | Each page hardcodes its back target | Consistent pattern (all go to `/dashboard/pro`) ✅ | Clean | No action |
| **Status display labels** | Translated via i18n keys (`status.draft`, `status.live`, `status.paused`) ✅ | i18n system | Clean | No action |

---

## Part 8: UX Flow Audit

### Journey 1: New Professional

| Step | Action | What Happens | Break Points | Confusion Points |
|------|--------|-------------|--------------|-----------------|
| 1 | Sign up selecting "professional" | Creates auth user + user_roles + professional_profiles | — | — |
| 2 | Redirected to `/onboarding/professional` | Step 1: BasicInfoStep | — | — |
| 3 | Fill name, phone, optional bio/tagline | Saves to DB, advances to service_area | — | — |
| 4 | Select service zones | Saves, advances to services | — | — |
| 5 | Select micro services (toggles) | Saves in real-time (debounced), creates draft listings | — | **User doesn't know draft listings are being auto-created** |
| 6 | Continue to Review | Shows checklist | — | — |
| 7 | "Go Live" | Sets `onboarding_phase=complete`, `is_publicly_listed=true` | — | **User might expect their services to appear on marketplace, but draft listings need separate publishing** |
| 8 | Redirected to `/dashboard/pro` | Shows "Active" state | — | **⚠️ Key confusion: "Go Live" makes the PROFILE live, not the service LISTINGS. Listings are still drafts.** |

**Critical finding**: There's a **disconnect between "Go Live" (profile) and "Publish" (listing)**. A pro can complete onboarding, be "live", but have zero published service listings visible on the marketplace.

### Journey 2: Returning Professional

| Step | Action | What Happens | Issues |
|------|--------|-------------|--------|
| 1 | Opens `/dashboard/pro` | Sees stage-aware guidance | ✅ |
| 2 | Clicks "Edit Profile" | Goes to `/professional/profile` | ✅ |
| 3 | Edits bio, clicks Save | Returns to dashboard | ✅ Autosave works |
| 4 | Clicks "My Listings" | Goes to `/professional/listings` | ✅ |
| 5 | Clicks Edit on a draft | Goes to `/professional/listings/:id/edit` | ✅ |
| 6 | Fills out listing, publishes | Listing goes live | ✅ |

**No major issues for returning users** — flow is clear.

### Journey 3: Admin Reviewer

| Step | Action | Issues |
|------|--------|--------|
| 1 | Opens `/dashboard/admin` | Sees overview stats |
| 2 | Wants to review service listings | **⚠️ No dedicated listing review queue** |
| 3 | Wants to moderate a listing | Must manually find it. Can update via RLS but no UI. |
| 4 | Wants to approve/reject verification | Can update `verification_status` via admin actions but **no structured workflow** |

**Critical finding**: Admin has no listing moderation interface.

### Journey 4: Client Discovery

| Step | Action | Issues |
|------|--------|--------|
| 1 | Browses `/services` | Sees all live listings | ✅ |
| 2 | Clicks a listing | Sees detail page with pricing, provider info | ✅ |
| 3 | Clicks "Start a Job" | Opens wizard with micro context preserved | ✅ |
| 4 | Clicks "View Tasker Profile" | Goes to `/professionals/:id` | ✅ |

**No major issues for client discovery** — flow is clean.

---

## Part 9: Decision Rules (Current State + Recommendations)

| Question | Current Answer | Recommendation |
|----------|---------------|----------------|
| What is the difference between a profile and a service? | Profile = identity. Service = matchable capability (binary toggle). Listing = publishable marketplace page. | ✅ Correct but the **three-entity model** (profile + service + listing) needs clearer user communication |
| Can a professional exist without a profile? | Yes — `professional_profiles` can have null display_name | ❌ Should require display_name on creation |
| Can a profile exist without a service? | Yes — `services_count` can be 0 | ✅ OK — dashboard guides user |
| Can a service exist without taxonomy? | No — FK constraint to micro_categories | ✅ |
| What makes a service listing public? | `status = 'live'` | ✅ |
| What makes a profile public? | `is_publicly_listed = true` (enforced by trigger when `onboarding_phase = 'complete'`) | ✅ |
| Can one professional have multiple services? | Yes — multiple `professional_services` → multiple `service_listings` | ✅ |
| Are listings independently approved? | No approval step — pro self-publishes | **⚠️ Should add moderation for new listings at minimum** |
| What happens when a live listing is edited? | Remains live immediately | **⚠️ Should at least flag for review or keep live with audit trail** |
| Should admin edit data directly? | Currently admin can update any listing via RLS | ✅ OK but needs UI |
| Is onboarding one-time or ongoing? | One-time flow + edit mode for returning users | ✅ Correct approach |
| Which page is the single home for editing services (toggles)? | `/onboarding/professional?step=services` (ServiceUnlockStep) | **⚠️ Should live in dashboard, not onboarding** |

---

## Part 10: Ideal Simplified Architecture

### Current vs Ideal

| Area | Current | Ideal |
|------|---------|-------|
| **Onboarding** | 4-step wizard + edit mode for returning | One-time only. After completion, never see wizard again. |
| **Service toggle editing** | Lives inside onboarding wizard (accessed via `?edit=1&step=services`) | Standalone page at `/professional/services` |
| **Profile editing** | Separate page (`/professional/profile`), duplicates some onboarding fields | ✅ Keep as-is but remove BasicInfoStep field duplication |
| **Listing management** | `/professional/listings` + per-listing editor | ✅ Keep as-is |
| **Admin moderation** | No UI for listing review | Add `/dashboard/admin?tab=listings` with review queue |
| **Public frontend** | ✅ Clean | ✅ Keep as-is |

### Target Data Flow
```
Onboarding (one-time)
  └─→ Creates: professional_profile + services + draft listings
  └─→ Ends at: Dashboard

Dashboard (ongoing hub)
  ├─→ Profile Edit (/professional/profile)
  ├─→ Service Toggles (/professional/services) ← NEW standalone page
  ├─→ Listing Editor (/professional/listings/:id/edit)
  └─→ Job Matching, Messages, Insights

Admin
  ├─→ User Review (existing)
  ├─→ Listing Moderation (NEW)
  └─→ Verification Workflow (NEW)

Public
  ├─→ /services → service_listings_browse (live only)
  ├─→ /professionals → professional_profiles (listed only)
  └─→ /services/listing/:id → full detail page
```

---

## Part 11: Rebuild Priorities

### Phase 1 — Truth and States (HIGH PRIORITY)
1. **Unify publish validation**: DB trigger should be the single gate. Client should pre-check the same rules.
2. **Resolve `display_name` duplication**: Decide canonical source. Write to one place.
3. **Remove dead `profile_status` column** or repurpose it.
4. **Centralize completeness calculation**: One shared utility function.

### Phase 2 — Routing and Page Purpose (MEDIUM)
5. **Extract service toggle editing** from onboarding into `/professional/services` standalone page.
6. **Verify unused routes** (`/professional/services`, `/professional/portfolio`) — remove or implement.
7. **Ensure onboarding "Go Live"** communicates that listings still need publishing.

### Phase 3 — Dashboard Simplification (MEDIUM)
8. **Add "Publish your first listing" guidance** after onboarding completion.
9. **Show listing publish status** in dashboard stats.

### Phase 4 — Admin Cleanup (MEDIUM)
10. **Add service listing review queue** to admin dashboard.
11. **Add verification workflow UI** (currently no structured admin flow).
12. **Log listing status changes** in admin_actions_log.

### Phase 5 — Public Frontend Polish (LOW)
13. **Fallback images** for listings without hero_image_url.
14. **"Coming Soon" badge** for grandfathered listings with incomplete data.
15. **Ensure professional profile** page links to their live listings.

---

## Part 12: Key Findings Summary

### Critical Issues
1. **Profile "Go Live" ≠ Listing "Publish"** — Users complete onboarding thinking they're live, but their service listings remain as drafts. This is the biggest UX gap.
2. **Publish validation mismatch** — Client, MyServiceListings, ServiceListingEditor, and DB trigger all check different fields. A listing can pass one gate but fail another.
3. **No admin listing moderation** — Listings go live without any review. No queue, no flagging, no audit trail for listing changes.

### Medium Issues
4. **`display_name` written to two tables** with inconsistent sync.
5. **Service toggle editing lives inside onboarding wizard** — confusing for returning users.
6. **Three independent completeness calculations** could drift.
7. **Dead `profile_status` column** adds confusion.

### Clean Areas (No Action Needed)
- Taxonomy system is clean and locked
- Phase progression is well-designed with forward-only advancement
- Public discovery flow (client side) is smooth
- RLS policies are appropriate
- CTA routing from public pages preserves context correctly
- Dashboard stage-aware guidance is well-implemented

---

## Part 13: Working Prompts for Implementation

### Prompt 1: Unify Publish Validation
"Review all service listing publish validation (client-side in MyServiceListings, ServiceListingEditor, and DB triggers validate_service_listing_live + enforce_service_listing_publish_gate). Create a single shared function that mirrors the DB trigger's requirements. Remove or align the second DB trigger."

### Prompt 2: Extract Service Editing
"Move the ServiceUnlockStep component out of the onboarding wizard into a standalone page at /professional/services. Update all links that currently point to /onboarding/professional?edit=1&step=services to use the new route instead."

### Prompt 3: Fix Go Live Communication
"After a professional completes onboarding and clicks 'Go Live', redirect them to /professional/listings with a toast explaining 'Your profile is live! Now publish your service listings so clients can find you.' Show the listing editor for their first draft listing."

### Prompt 4: Add Admin Listing Review
"Add a 'Listings' tab to the admin dashboard that shows all service_listings with filters by status (draft/live/paused). Allow admins to preview, approve, pause, or take down listings with actions logged to admin_actions_log."
