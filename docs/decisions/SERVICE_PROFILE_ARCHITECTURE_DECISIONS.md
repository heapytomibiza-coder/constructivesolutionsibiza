# Service–Profile Architecture Decision Pack
**Date:** 2026-03-19  
**Status:** LOCKED — All decisions below are final unless explicitly reopened  
**Derived from:** `docs/audits/SERVICE_PROFILE_SYSTEM_AUDIT.md` + product review

---

## 1. Locked System Definitions

These three objects are the core of the professional side of the platform. Every feature, page, and component must respect these boundaries.

### 1.1 Profile
**What it is:** The professional's identity, trust signals, and public presence.  
**Canonical table:** `professional_profiles`  
**Supplementary table:** `profiles` (phone)  
**Contains:** display_name, business_name, bio, tagline, avatar, service_zones, verification_status  
**Does NOT contain:** individual service offerings, pricing, public sales copy  
**Owned by:** The professional (writes), admin (verification_status only)  
**Public visibility gate:** `is_publicly_listed = true` AND `display_name IS NOT NULL`

### 1.2 Service Selection
**What it is:** The internal capability-matching layer. Controls what jobs a professional can be matched to.  
**Canonical table:** `professional_services` (junction: user_id ↔ micro_id)  
**Supporting tables:** `professional_micro_preferences`, `professional_micro_stats`  
**Contains:** which micro-categories the pro offers, notification preferences, matching scores  
**Does NOT contain:** public-facing descriptions, pricing, imagery  
**Owned by:** The professional  
**Public visibility:** Never directly visible. Powers matching engine and seeds listing creation.

### 1.3 Listing
**What it is:** The public marketplace offer — a sales page for a specific service.  
**Canonical table:** `service_listings`  
**Supporting table:** `service_pricing_items`  
**Contains:** display_title, short_description, hero_image, gallery, pricing items, location_base  
**Does NOT contain:** matching logic, service zone definitions, profile identity  
**Owned by:** The professional (writes), admin (moderation)  
**Public visibility gate:** `status = 'live'` (enforced by DB trigger `validate_service_listing_live`)  
**Public display surface:** `service_listings_browse` view (SECURITY INVOKER = false)

### Rule
> If any component or page conflates these three objects, it is a bug. Profile is identity. Service selection is capability. Listing is the public offer.

---

## 2. Locked Lifecycle States

### 2.1 Professional Profile Lifecycle

| State | Meaning | Set by | Dashboard shows | Admin sees | Public sees |
|-------|---------|--------|-----------------|------------|-------------|
| `draft` | Profile exists but incomplete | System (default) | Setup progress | In users list | Nothing |
| `live` | Profile is complete and active | Professional (via "Go Live") | Full dashboard | Active pro | Profile page |
| `suspended` | Admin has suspended the professional | Admin | Suspension notice | Flagged | Nothing |

**`onboarding_phase` values** (progression, not status):
- `not_started` → `basic_info` → `service_area` → `services` → `review` → `complete`

**`verification_status` values** (trust layer, NOT a visibility gate):
- `unverified` → `pending` → `verified` | `rejected`

**Key rule:** Verification is a trust badge, not an activation gate. Unverified pros CAN be live.

### 2.2 Service Listing Lifecycle

| State | Meaning | Set by | Dashboard shows | Admin sees | Public sees |
|-------|---------|--------|-----------------|------------|-------------|
| `draft` | Created but not yet publishable | System (default) | Edit CTA | In review queue | Nothing |
| `live` | Published and visible on marketplace | Professional (self-publish) | Live badge + stats | Active listing | Full listing page |
| `hidden` | Pro has temporarily hidden it | Professional | Hidden badge | Hidden listing | Nothing |
| `rejected` | Admin has taken it down | Admin | Rejection notice | Flagged | Nothing |

**Publish validation (DB trigger `validate_service_listing_live`):**  
For listings created after 2026-03-19:
- `display_title` must not be empty
- `short_description` must not be empty  
- At least 1 `service_pricing_item` must exist

**Pre-existing listings:** Grandfathered — can remain live without meeting new requirements.

### 2.3 Transition Rules

| From | To | Trigger | Actor | Allowed? | Notes |
|------|----|---------|-------|----------|-------|
| `draft` → `live` | Publish | Professional | ✅ | Must pass validation trigger |
| `live` → `draft` | Unpublish | Professional | ✅ | Removes from marketplace |
| `live` → `hidden` | Hide | Professional | ✅ | Temporary removal |
| `hidden` → `live` | Unhide | Professional | ✅ | Must still pass validation |
| `live` → `rejected` | Takedown | Admin | ✅ | Logged in admin_actions_log |
| `rejected` → `draft` | Appeal/fix | Admin | ✅ | Pro must re-publish after fixing |
| Any → edited | Edit while live | Professional | ✅ | **Decision: edits go live immediately** (no pending revision system for MVP) |

**Critical decision: When a live listing is edited, it remains live.**  
Rationale: The platform is pre-scale. Adding a revision/approval queue adds complexity without proportional trust benefit at current volume. Revisit when listing volume exceeds admin capacity.

---

## 3. Locked User Journey

### 3.1 Canonical Progression (first-time professional)

```
Sign up
  → Select "professional" role  
  → Onboarding Step 1: Basic Info (name, phone, business name)
  → Onboarding Step 2: Service Area (zones)
  → Onboarding Step 3: Service Selection (micro-categories)
  → Onboarding Step 4: Review & Go Live
  → Profile goes live → is_publicly_listed = true
  → Land on Dashboard
  → Dashboard shows: "Profile: Live | Listings: 0 published"
  → Primary CTA: "Create your first service listing"
  → Pro creates/enriches listing → publishes → listing appears on /services
```

**Key decision: Listing publication is OPTIONAL for profile activation.**  
Rationale: Requiring a fully enriched listing before "Go Live" creates too much friction for first activation. The professional should be matchable by service selection immediately. Listings are the enrichment layer.

**BUT: The dashboard must make the distinction painfully clear.**

### 3.2 Returning Professional Journey

```
Open dashboard
  → See profile status (Live/Draft)
  → See listing count (X published, Y drafts)
  → See incomplete items clearly
  → Edit profile → stays on dashboard
  → Edit services → stays on dashboard (NOT onboarding)
  → Edit/create listings → dedicated listings management page
  → Understand immediately what is public vs private
```

### 3.3 Client Discovery Journey

```
Browse /services
  → See only live listings
  → Click listing → full listing page with provider info sidebar
  → CTA: "Request a Quote" or "Start a Job" → wizard pre-filled with context
  → OR browse /professionals → see live profiles → view their listings
```

---

## 4. Locked Route Ownership

### 4.1 Routes That Stay (with clarified purpose)

| Route | Purpose | Owner | Entry | Exit |
|-------|---------|-------|-------|------|
| `/onboarding/professional` | First-time activation ONLY | Professional (new) | After role selection | Dashboard |
| `/dashboard/pro` | Permanent management hub | Professional | Login / nav | — |
| `/professional/profile` | Edit own profile | Professional | Dashboard link | Back to dashboard |
| `/professional/services` | Manage service selections + listings | Professional | Dashboard link | Back to dashboard |
| `/services` | Public marketplace browse | Anyone | Nav / search | Listing detail |
| `/services/:id` | Public listing detail | Anyone | Browse / search | Wizard / contact |
| `/professionals/:id` | Public professional profile | Anyone | Listing sidebar / search | Listing / wizard |
| `/dashboard/admin` | Admin cockpit | Admin | Nav | — |

### 4.2 Onboarding Scope (LOCKED)

Onboarding is a **one-time activation flow**. It should:
- ✅ Create the initial professional profile record
- ✅ Capture enough information to form a valid draft
- ✅ Guide user through service area + service selection
- ✅ Present review checklist and "Go Live" button
- ✅ Redirect to dashboard on completion

Onboarding should **NOT**:
- ❌ Be the permanent edit environment for services
- ❌ Duplicate full dashboard editing features
- ❌ Be accessible to returning professionals who have completed it
- ❌ Allow re-entry after `onboarding_phase = 'complete'`

### 4.3 Dashboard Scope (LOCKED)

The dashboard is the **single permanent management hub**. It should:
- ✅ Show profile status clearly (Live / Draft)
- ✅ Show listing count (X published, Y drafts)  
- ✅ Show missing fields / incomplete items
- ✅ Make next action obvious
- ✅ Link to profile edit, service management, listing management
- ✅ Show verification status as trust badge

---

## 5. Locked Data Ownership

### 5.1 Field Ownership Matrix

| Field / Concern | Canonical Source | Created in | Edited in | Displayed in |
|----------------|-----------------|------------|-----------|-------------|
| Professional headline (display_name) | `professional_profiles.display_name` | Onboarding (BasicInfoStep) | Dashboard (ProfileEdit) | Public profile, listing sidebar |
| Phone | `profiles.phone` | Onboarding (BasicInfoStep) | Dashboard (ProfileEdit) | Internal only |
| Bio / description | `professional_profiles.bio` | Dashboard (ProfileEdit) | Dashboard (ProfileEdit) | Public profile |
| Service zones | `professional_profiles.service_zones` | Onboarding (ServiceAreaStep) | Dashboard (ProfileEdit) | Matching engine |
| Service selection | `professional_services` rows | Onboarding (ServicesStep) | Dashboard (services page) | Matching engine |
| Listing title | `service_listings.display_title` | Dashboard (listing editor) | Dashboard (listing editor) | Public marketplace |
| Listing description | `service_listings.short_description` | Dashboard (listing editor) | Dashboard (listing editor) | Public marketplace |
| Listing pricing | `service_pricing_items` rows | Dashboard (listing editor) | Dashboard (listing editor) | Public marketplace |
| Listing status | `service_listings.status` | System (default: draft) | Professional (publish) / Admin (reject) | Controls visibility |
| Verification status | `professional_profiles.verification_status` | System (default: unverified) | Admin only | Trust badge |
| Profile completeness | **Computed** (not stored) | — | — | Dashboard, onboarding review |
| Listing completeness | **DB trigger** (`validate_service_listing_live`) | — | — | Dashboard, publish gate |
| Publish eligibility | **DB trigger** (canonical) | — | — | Listing editor |

### 5.2 Duplicate Field: `display_name`

**Current state:** Exists in both `profiles.display_name` AND `professional_profiles.display_name`.  
**Decision:** `professional_profiles.display_name` is canonical for professional context.  
`profiles.display_name` is the generic user display name (used for clients, forum posts, etc.)  
**Action:** These are intentionally separate. No sync needed. Document this clearly in code.

---

## 6. Implementation Tickets (Priority Order)

### Phase 1 — Semantic Truth (do first, before any UI changes)

| # | Ticket | Description | Effort |
|---|--------|-------------|--------|
| 1.1 | **Centralise completeness calculation** | Create `src/lib/profileCompleteness.ts` with pure functions used by onboarding review AND dashboard. Single source of truth. | S |
| 1.2 | **Align publish validation** | Ensure frontend publish-eligibility checks match DB trigger `validate_service_listing_live` exactly. Remove any divergent client-side checks. | S |
| 1.3 | **Document field ownership** | Add JSDoc comments to key components clarifying which table owns which field. Reference this decision doc. | S |

### Phase 2 — User Journey Correction (highest UX impact)

| # | Ticket | Description | Effort |
|---|--------|-------------|--------|
| 2.1 | **Dashboard activation state display** | After "Go Live," dashboard must show: "Profile: Live · Listings: X published, Y drafts" with clear CTA to create first listing if 0 published. | M |
| 2.2 | **Move service management out of onboarding** | Create standalone `/professional/services` page for service toggle management. Onboarding service step becomes initial selection only. Returning pros edit from dashboard. | L |
| 2.3 | **Block onboarding re-entry** | If `onboarding_phase = 'complete'`, redirect `/onboarding/professional` to `/dashboard/pro`. | S |
| 2.4 | **Fix "Go Live" meaning** | Ensure "Go Live" toast/success messaging accurately describes what happened: "Your profile is now live. Create a service listing to appear on the marketplace." | S |

### Phase 3 — Code Cleanup

| # | Ticket | Description | Effort |
|---|--------|-------------|--------|
| 3.1 | **Remove dead column `profile_status`** | Audit all reads of `profile_status`. If only used for `live`/`draft` which is already covered by `onboarding_phase` + `is_publicly_listed`, deprecate. | S |
| 3.2 | **Clean up legacy onboarding phases** | Remove frontend handling of `verification` and `services` legacy phases (already normalized in `phaseProgression.ts`). | S |
| 3.3 | **Remove duplicate routes** | Audit for any dead `/marketplace` or duplicate service routes. Ensure 301 redirects are in place. | S |

### Phase 4 — Admin & Moderation

| # | Ticket | Description | Effort |
|---|--------|-------------|--------|
| 4.1 | **Admin listing review queue** | Add listing review tab to admin dashboard. Show all listings with status filter. Allow approve/reject/takedown with admin_actions_log entry. | L |
| 4.2 | **Admin verification workflow** | Formalize verification status changes. Currently ad-hoc. Add explicit checklist and status transition buttons. | M |
| 4.3 | **Moderation policy: first listing review** | Implement optional flag: first listing from a new pro is held for admin review before going live. Later listings self-publish. | M |

### Phase 5 — Public Frontend Polish

| # | Ticket | Description | Effort |
|---|--------|-------------|--------|
| 5.1 | **Ensure listing→profile connection** | Public listing page sidebar should always link to provider's full profile. Profile page should list all live listings. | S |
| 5.2 | **CTA context preservation** | When user clicks "Request Quote" on a listing, wizard should pre-fill category + micro from listing context. | M |
| 5.3 | **Empty state handling** | If a pro is live but has 0 listings, their public profile should show services offered (from service selection) but no listing cards, with appropriate messaging. | S |

---

## 7. Decision Summary — Quick Reference

| Question | Decision |
|----------|----------|
| Can a professional be live without listings? | **Yes** — but dashboard must show this clearly |
| Can a listing go live without profile being live? | **No** — profile must be live first |
| Are listings self-published or moderated? | **Self-published for MVP** — first-listing moderation as Phase 4 option |
| What happens when a live listing is edited? | **Stays live** — no revision queue for MVP |
| Is onboarding one-time or ongoing? | **One-time activation only** |
| Where do returning pros edit services? | **Dashboard, never onboarding** |
| What is the single home for editing listings? | **Dashboard → listings management page** |
| Is verification a gate for going live? | **No** — it's a trust badge only |
| What makes a profile public? | `is_publicly_listed = true` AND `display_name IS NOT NULL` |
| What makes a listing public? | `status = 'live'` (enforced by DB trigger) |

---

## 8. The One Rule

> **A professional should never feel finished before the system has made clear what is still private, what is public, and what still needs publishing.**

This is the test for every page, component, and CTA in the system.

---

*This document is the canonical reference for all service-profile architecture decisions. Implementation PRs should reference specific section numbers from this document.*
