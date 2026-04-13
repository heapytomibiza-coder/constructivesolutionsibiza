# Constructive Solutions Ibiza — Rollout Plan

**Version:** v1.0  
**Date:** 2026-04-13  
**Current phase:** `service-layer`  
**Source of truth:** `src/domain/rollout.ts` (line 34)

---

## How to Use This Document

1. **Check the phase before building any feature.** If a feature belongs to a phase that is not yet active, do not build it — even if partial code exists.
2. **Use this as the reference for rollout sequencing.** All phase ordering, gating, and feature allocation comes from the codebase files listed below.
3. **If implementation and documentation ever disagree, flag it clearly.** The current source of truth is always `src/domain/rollout.ts` (`CURRENT_ROLLOUT`) for the active phase, and `src/app/routes/registry.ts` for route-level gating.
4. **Do not treat later-phase items as ready just because partial code exists.** Code behind a rollout gate is explicitly not released. It may be incomplete, untested, or architecturally provisional.

### Reference files

| File | Purpose |
|------|---------|
| `src/domain/rollout.ts` | Phase definitions, ordering, current phase constant |
| `src/app/routes/registry.ts` | Route registry with `minRollout` assignments |
| `src/guard/RolloutGate.tsx` | Gate component for public routes |
| `docs/ARCHITECTURE_PACK.md` | Feature-to-page matrix and status (LIVE / GATED / PLANNED) |

---

## 1. Overview

The platform uses a **6-phase progressive rollout system** instead of a traditional fixed release calendar.

### How it works

- Each phase is a named milestone: `pipe-control` → `founding-members` → `service-layer` → `trust-engine` → `protection-beta` → `scale-ready`.
- The constant `CURRENT_ROLLOUT` in `src/domain/rollout.ts` controls which phase is active.
- The function `isRolloutActive(min)` returns `true` if the current phase is equal to or later than `min`.
- Routes in `registry.ts` can declare `minRollout` — if the current phase hasn't reached that value, the route is hidden from navigation and blocked at access time.
- `RolloutGate` wraps public routes. If the phase isn't active, it renders a `ComingSoonPage` (unless the user is an admin, who can preview gated pages).
- `RouteGuard` handles authenticated routes and also checks `minRollout` before granting access.

### Design principles

- **One constant controls everything.** Change `CURRENT_ROLLOUT` to unlock the next phase.
- **Progressive, not big-bang.** Each phase builds on the previous one.
- **Gated ≠ ready.** Code may exist behind a gate but remain incomplete or untested.
- **Admin preview.** Admins can access gated pages for QA before a phase goes live.

---

## 2. Phase Timeline Mapping

Phases map to a 12-week structure with 2-week windows per phase.

| Weeks | Phase | Status | Description |
|-------|-------|--------|-------------|
| 1–2 | `pipe-control` | ✅ Complete | Core platform: wizard, jobs board, forum, messaging |
| 3–4 | `founding-members` | ✅ Complete | Professional directory, pro onboarding, public profiles |
| 5–6 | **`service-layer`** | 🔵 **Current** | Services marketplace, listings, category browsing |
| 7–8 | `trust-engine` | 🔒 Next | Reviews, ratings, reputation, pricing page |
| 9–10 | `protection-beta` | 🔒 Future | Milestone payments, dispute resolution engine |
| 11–12 | `scale-ready` | 🔒 Future | Full automation, platform scaling |

**To advance a phase:** update `CURRENT_ROLLOUT` in `src/domain/rollout.ts`.

---

## 3. Phase-by-Phase Breakdown

### Phase 1: `pipe-control` (Weeks 1–2) ✅

**Purpose:** Establish the core loop — clients post jobs, professionals see them, both can communicate.

**What is unlocked:**
- `/` — Homepage
- `/jobs` — Public jobs board
- `/post` — Job wizard (public start, auth at submit)
- `/forum`, `/forum/:categorySlug`, `/forum/post/:postId` — Forum (public read)
- `/forum/:categorySlug/new` — Forum write (auth required)
- `/how-it-works`, `/about`, `/contact`, `/dispute-policy` — Static pages
- `/messages`, `/messages/:id` — Messaging (auth required)
- `/settings` — User settings
- `/dashboard/client` — Client dashboard
- `/dashboard/pro` — Professional dashboard
- `/onboarding/professional` — Pro onboarding flow
- `/professional/services`, `/professional/priorities`, `/professional/profile`, `/professional/portfolio` — Pro management pages
- `/dashboard/admin` — Admin console

**What exists in codebase:** All routes above are LIVE with full implementations.

**Go / No-Go criteria (to move to founding-members):**
- ✅ Job wizard creates valid jobs
- ✅ Professionals can view jobs board
- ✅ Messaging works between client and professional
- ✅ Forum read/write functional
- ✅ Auth flow (signup, login, role selection) working
- ✅ Admin dashboard operational

**Risks if moved too early:** Core loop is the foundation — if jobs, messaging, or auth are broken, nothing else works.

---

### Phase 2: `founding-members` (Weeks 3–4) ✅

**Purpose:** Make professionals discoverable. Enable public professional profiles and directory browsing.

**What is unlocked:**
- `/professionals` — Professional directory
- `/professionals/:id` — Individual professional profile page

**What exists in codebase:** Routes exist, gated with `minRollout: 'founding-members'`. Views (`public_professional_details`) and profile pages are implemented.

**Go / No-Go criteria (to move to service-layer):**
- ✅ Professional profiles display correctly
- ✅ Directory filtering/search functional
- ✅ Pro onboarding produces complete profiles
- ✅ RLS policies protect private data

**Risks if moved too early:** Incomplete profiles visible publicly could damage trust.

---

### Phase 3: `service-layer` (Weeks 5–6) 🔵 CURRENT

**Purpose:** Launch the services marketplace. Professionals can create and publish service listings. Public users can browse services by category.

**What is unlocked:**
- `/services` — Services marketplace index
- `/services/:categorySlug` — Category browsing
- `/services/listing/:listingId` — Individual listing detail
- `/dashboard/pro/listings` — Pro listing management
- `/dashboard/pro/listings/:listingId/edit` — Listing editor

**What exists in codebase:**
- Service listings CRUD (create, read, update, publish)
- Service categories and micro-categories (taxonomy)
- `service_listings_browse` view for public marketplace
- Listing readiness validation (DB triggers)
- Service pricing items
- Professional matched jobs feed (`matched_jobs_for_professional` view)
- Pro dashboard links default to matched feed (`/jobs?matched=true`)

**What is partially implemented:**
- Service listing SEO and public discoverability
- Listing analytics / view tracking (`service_views` table exists)

**What is still missing or needs validation:**
- End-to-end listing publish → public browse → contact flow verification
- Marketplace search and filtering completeness
- Listing quality gates (minimum content standards)

**Go / No-Go criteria (to move to trust-engine):**
- [ ] Service listings can be created, published, and browsed publicly
- [ ] Category pages render listings correctly
- [ ] Listing detail page shows complete information
- [ ] Professional can manage listings from dashboard
- [ ] Matched jobs feed works correctly for professionals
- [ ] No broken public URLs from marketplace

**Risks if moved too early:**
- Incomplete listings visible publicly → trust damage
- Missing pricing items → unclear service offerings
- Broken category navigation → poor user experience
- Service listings depend on complete taxonomy data

**Dependencies:** Auth, professional profiles, service taxonomy, listing validation triggers.

---

### Phase 4: `trust-engine` (Weeks 7–8) 🔒

**Purpose:** Add reputation, reviews, and trust signals. Make the platform a quality-filtered marketplace rather than a simple directory.

**What is unlocked:**
- `/for-professionals` — Professional landing page
- `/pricing` — Platform pricing page
- `/reputation` — Reputation system explainer

**What exists in codebase:**
- `job_reviews` table (schema exists)
- `client_reputation` table (schema exists)
- `professional_micro_stats` table (schema exists, tracks ratings)
- Routes registered in `registry.ts` with `minRollout: 'trust-engine'`

**What is partially implemented:**
- Review data model exists but review submission flow is not confirmed end-to-end
- Reputation scoring fields exist but calculation logic may be incomplete
- Trust badges defined in `client_reputation.badges` but display logic unconfirmed

**What is still missing:**
- Review submission UI
- Review display on professional profiles and listings
- Reputation badge display
- Pricing page content
- For-professionals landing page content

**Go / No-Go criteria (to move to protection-beta):**
- [ ] Reviews can be submitted after job completion
- [ ] Reviews display on professional profiles
- [ ] Reputation scores calculate correctly
- [ ] Pricing page accurately reflects platform model
- [ ] Trust badges render where appropriate

**Risks if moved too early:**
- Reviews without moderation → abuse potential
- Incorrect reputation scores → unfair professional ranking
- Pricing page without finalised business model → confusion
- Depends on: completed jobs existing in the system (requires service-layer to be stable)

---

### Phase 5: `protection-beta` (Weeks 9–10) 🔒

**Purpose:** Introduce payment protection and structured dispute resolution. This is the high-trust differentiator.

**What is unlocked:**
- `/disputes/raise` — Dispute submission
- `/disputes/:disputeId` — Dispute detail / resolution

**What exists in codebase:**
- Full dispute data model: `disputes`, `dispute_inputs`, `dispute_evidence`, `dispute_analysis`, `dispute_status_history`, `dispute_ai_events`
- Dispute enums: `dispute_status`, `dispute_issue_type`, `resolution_pathway`
- Routes registered with `minRollout: 'protection-beta'`
- AI-assisted dispute analysis schema (confidence scores, suggested pathways)

**What is partially implemented:**
- Dispute schema is comprehensive but UI flows are unconfirmed
- AI dispute analysis structure exists but integration status unknown
- 28-day resolution timeline defined in business logic but enforcement unconfirmed

**What is still missing:**
- Payment holding system (Stripe integration for milestone payments)
- Dispute submission UI
- Dispute resolution workflow UI
- Counterparty response flow
- Evidence upload and review interface
- Admin dispute management interface

**Go / No-Go criteria (to move to scale-ready):**
- [ ] Payment holding system operational (NOT called escrow)
- [ ] Disputes can be raised with evidence
- [ ] Counterparty notification and response works
- [ ] 28-day resolution timeline enforced
- [ ] Admin can review and intervene in disputes
- [ ] Legal language reviewed and compliant

**Risks if moved too early:**
- Payment handling without proper Stripe integration → financial risk
- Disputes without complete workflow → user frustration
- Legal language non-compliance → regulatory risk
- Depends on: trust-engine (reviews provide context for disputes), stable messaging, complete job lifecycle

---

### Phase 6: `scale-ready` (Weeks 11–12) 🔒

**Purpose:** Full automation and platform scaling. Remove manual bottlenecks, optimise matching, automate operations.

**What is unlocked:** Full platform capabilities, no remaining gates.

**What exists in codebase:**
- Matching infrastructure (`matched_jobs_for_professional` view)
- Analytics and metrics tables (`daily_platform_metrics`, `daily_category_metrics`, `daily_worker_metrics`)
- Notification queue systems (`email_notifications_queue`, `job_notifications_queue`)
- Demand snapshots for market intelligence
- Admin monitoring and alert systems (`platform_alerts`)

**What is still missing:**
- Automated matching optimisation
- Self-service professional verification
- Automated quality enforcement
- Scale testing and performance validation

**Go / No-Go criteria:**
- [ ] All previous phases stable in production
- [ ] Automated notifications reliable
- [ ] Matching quality validated with real data
- [ ] Platform handles concurrent load targets
- [ ] Admin monitoring catches anomalies

**Risks if moved too early:**
- Automation on incomplete systems → cascading failures
- Scale without quality gates → trust erosion

---

## 4. Current Phase Status: `service-layer`

**Set in:** `src/domain/rollout.ts` line 34  
**Value:** `export const CURRENT_ROLLOUT: RolloutPhase = 'service-layer';`

### What is working

| Feature | Status | Notes |
|---------|--------|-------|
| Job wizard | ✅ Working | Full flow: draft → posted |
| Jobs board | ✅ Working | Public browse, filters |
| Professional matched feed | ✅ Working | `/jobs?matched=true` default from pro dashboard |
| Messaging | ✅ Working | Realtime, conversations |
| Forum | ✅ Working | Read/write, categories |
| Auth + roles | ✅ Working | Client, professional, admin |
| Pro onboarding | ✅ Working | Multi-step flow |
| Pro dashboard | ✅ Working | Job management, matched feed link |
| Client dashboard | ✅ Working | Job management, messaging |
| Professional directory | ✅ Working | Unlocked in founding-members |
| Admin dashboard | ✅ Working | Metrics, insights, monitoring |

### What needs completion before `trust-engine`

| Item | Status | Blocker? |
|------|--------|----------|
| Service listings publish flow | 🔶 Verify | Must confirm end-to-end |
| Services marketplace browsing | 🔶 Verify | Category pages + listing detail |
| Listing readiness validation | 🔶 Verify | DB triggers enforcing quality |
| Pro listing management UI | 🔶 Verify | CRUD from dashboard |
| Marketplace search/filtering | 🔶 Verify | Completeness check needed |

### What should NOT be built yet

- Review submission UI (trust-engine)
- Reputation badges (trust-engine)
- Payment holding system (protection-beta)
- Dispute resolution flows (protection-beta)
- Pricing page content (trust-engine)
- Automated matching optimisation (scale-ready)

---

## 5. Feature Gating Map

All routes with `minRollout` assignments from `src/app/routes/registry.ts`:

### Routes with no gate (LIVE since `pipe-control`)

| Route | Lane | Access |
|-------|------|--------|
| `/` | public | public |
| `/jobs` | public | public |
| `/post` | client | public (auth at submit) |
| `/how-it-works` | public | public |
| `/about` | public | public |
| `/contact` | public | public |
| `/forum` | public | public |
| `/forum/:categorySlug` | public | public |
| `/forum/post/:postId` | public | public |
| `/forum/:categorySlug/new` | shared | auth |
| `/dispute-policy` | public | public |
| `/dashboard` | shared | auth |
| `/dashboard/client` | client | role:client |
| `/dashboard/client/jobs` | client | role:client |
| `/dashboard/jobs/:jobId` | shared | auth |
| `/dashboard/jobs/:jobId/invite` | shared | auth |
| `/dashboard/jobs/:jobId/compare` | shared | auth |
| `/messages` | shared | auth |
| `/messages/:id` | shared | auth |
| `/settings` | shared | auth |
| `/onboarding/professional` | professional | role:professional |
| `/professional/services` | professional | role:professional |
| `/professional/portfolio` | professional | role:professional |
| `/professional/priorities` | professional | role:professional |
| `/professional/profile` | professional | role:professional |
| `/professional/listings` | professional | role:professional |
| `/professional/listings/:listingId/edit` | professional | role:professional |
| `/professional/insights` | professional | role:professional |
| `/dashboard/pro` | professional | role:professional |
| `/dashboard/pro/jobs` | professional | role:professional |
| `/dashboard/pro/job/:jobId` | professional | role:professional |
| `/dashboard/pro/listings` | professional | role:professional |
| `/dashboard/pro/listings/:listingId/edit` | professional | role:professional |
| `/dashboard/pro/insights` | professional | role:professional |
| `/dashboard/admin` | admin | admin |
| `/dashboard/admin/*` | admin | admin |

### Routes gated by `founding-members`

| Route | Lane | Access |
|-------|------|--------|
| `/professionals` | public | public |
| `/professionals/:id` | public | public |

### Routes gated by `service-layer` (current phase — now active)

| Route | Lane | Access |
|-------|------|--------|
| `/services` | public | public |
| `/services/:categorySlug` | public | public |
| `/services/listing/:listingId` | public | public |

### Routes gated by `trust-engine`

| Route | Lane | Access |
|-------|------|--------|
| `/for-professionals` | public | public |
| `/pricing` | public | public |
| `/reputation` | public | public |

### Routes gated by `protection-beta`

| Route | Lane | Access |
|-------|------|--------|
| `/disputes/raise` | shared | auth |
| `/disputes/:disputeId` | shared | auth |

### Not yet in registry (PLANNED)

| Feature | Expected Phase | Notes |
|---------|---------------|-------|
| `/payments/*` | protection-beta | Excluded from V2 registry |
| `/contracts/*` | protection-beta | Excluded from V2 registry |

---

## 6. Next Actions

### Immediate (current phase: `service-layer`)

1. **Verify service listings end-to-end flow** — Create listing → publish → appears in `/services` marketplace → detail page renders correctly
2. **Verify marketplace category browsing** — `/services/:categorySlug` renders filtered listings
3. **Verify listing readiness validation** — DB triggers enforce minimum quality before publish
4. **Verify pro listing management** — Dashboard CRUD operations work from `/dashboard/pro/listings`
5. **Confirm matched jobs default** — Pro dashboard CTA lands on `/jobs?matched=true` with matched feed active ✅ (completed 2026-04-13)

### Do NOT build yet

| Feature | Phase | Reason |
|---------|-------|--------|
| Review submission UI | trust-engine | Phase not active |
| Reputation badges | trust-engine | Phase not active |
| Pricing page content | trust-engine | Phase not active |
| For-professionals landing | trust-engine | Phase not active |
| Payment holding system | protection-beta | Phase not active, legal review needed |
| Dispute resolution flows | protection-beta | Phase not active, depends on payments |
| Automated matching | scale-ready | Phase not active, needs production data |

### Phase transition checklist

To advance from `service-layer` to `trust-engine`:

1. All items in "What needs completion" (Section 4) verified ✅
2. No critical bugs in service listings flow
3. Marketplace browsable with real or representative data
4. Update `CURRENT_ROLLOUT` in `src/domain/rollout.ts` from `'service-layer'` to `'trust-engine'`
5. Update this document's "Current phase" header

---

*This document reflects the codebase as of 2026-04-13. If implementation changes, update this document in the same PR.*
