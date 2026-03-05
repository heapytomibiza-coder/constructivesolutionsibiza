# Constructive Solutions Ibiza — Architecture Pack

**Type:** Documentation deliverable (no code changes)  
**Version:** v1.0  
**Date:** 2026-03-05  
**Scope:** Construction & property services only  
**Current rollout phase:** `pipe-control` (Weeks 1–4)

---

## Definition of Done (DoD)

This document is accepted when:

- Every route in `registry.ts` is listed exactly once in Section 2.
- Every route has: lane, access rule, guard, rollout gate, and entry points.
- Every *shipped* page appears in the Feature-to-Page Matrix (Section 3).
- Every feature in Section 3 lists at least one concrete table/view it reads or writes.
- Job + Quote status enums match the actual canonical values used in code/DB.
- Gated vs Planned is explicit (LIVE / GATED / PLANNED) across all sections.

**Owner:** Engineering Lead  
**Maintainer:** Product/Founder + Engineering (changes PR'd with app changes)

Legend:
- **LIVE** = available in `pipe-control`
- **GATED** = exists in code but behind rollout phase guard
- **PLANNED** = not built yet

---

## Table of Contents

1. [Swimlane User Journeys](#1-swimlane-user-journeys)  
2. [Route Map by Lane](#2-route-map-by-lane)  
3. [Feature-to-Page Matrix](#3-feature-to-page-matrix)  
4. [Job Lifecycle State Machine](#4-job-lifecycle-state-machine)  
5. [Data Spine](#5-data-spine)  

---

## 1. Swimlane User Journeys

Four lanes trace every user path. Items marked 🔒 are gated behind future rollout phases.

```
┌─────────────┬──────────────────┬──────────────────────┬──────────────────────┐
│ PUBLIC      │ CLIENT (Asker)   │ PROFESSIONAL (Tasker)│ SYSTEM               │
├─────────────┼──────────────────┼──────────────────────┼──────────────────────┤
│ Homepage    │                  │                      │                      │
│ ↓           │                  │                      │                      │
│ Browse Jobs │                  │                      │                      │
│ How It Works│                  │                      │                      │
│ Forum (read)│                  │                      │                      │
│ About       │                  │                      │                      │
│ Contact     │                  │                      │                      │
│ ↓           │                  │                      │                      │
│ Sign Up ────┼─→ Choose Role ───┼─→ Choose Role        │                      │
│             │ ↓                │ ↓                    │                      │
│             │ Post Job Wizard  │ Pro Onboarding       │                      │
│             │ ↓                │ ↓ Basic Info         │                      │
│             │ Pick Category    │ ↓ Select Trades      │                      │
│             │ ↓                │ ↓ Service Area       │                      │
│             │ Pick Micro       │ ↓ Profile Setup      │                      │
│             │ ↓                │                      │                      │
│             │ Question Pack    │                      │                      │
│             │ ↓                │                      │                      │
│             │ Date/Budget/Area │                      │                      │
│             │ ↓                │                      │                      │
│             │ Review & Submit  │                      │ ← Job created        │
│             │                  │                      │ ↓                    │
│             │                  │                      │ Matching runs        │
│             │                  │                      │ ↓                    │
│             │                  │ Matched Jobs Feed ←──┤ Pros notified        │
│             │                  │ ↓                    │                      │
│             │ ← Message Pro ───┼── Message Client     │ Realtime sync        │
│             │                  │ ↓                    │                      │
│             │                  │ Submit Quote         │ Quote stored         │
│             │ ↓                │                      │                      │
│             │ Receive Quote    │                      │                      │
│             │ ↓                │                      │                      │
│             │ Accept Quote     │                      │ Job → in_progress    │
│             │ ↓                │ ↓                    │                      │
│             │ Mark Complete    │ Complete Job         │ Job → completed      │
│             │ ↓                │ ↓                    │                      │
│             │ Leave Review     │ Receive Review       │ Stats updated        │
│             │                  │                      │                      │
│ 🔒 Browse   │                  │ 🔒 Service Listings  │                      │
│   Pros      │                  │ 🔒 Portfolio         │                      │
│ 🔒 Services │                  │                      │                      │
│   Marketplace│                 │                      │ 🔒 Payments          │
│             │                  │                      │ 🔒 Escrow            │
│             │                  │                      │ 🔒 Disputes          │
└─────────────┴──────────────────┴──────────────────────┴──────────────────────┘
```

### Role Switching

A professional can also act as a client. One account, two roles.
`RoleSwitcher` toggles `activeRole: 'client' | 'professional'`.
`DashboardResolver` routes `/dashboard` → `/dashboard/client` or `/dashboard/pro`.

---

## 2. Route Map by Lane

Every route from `registry.ts`, tagged with lane, access rule, guard type, rollout gate, and entry points.

### Public Routes

| Route | Access | Guard | Rollout | Entry Points |
|-------|--------|-------|---------|--------------|
| `/` | public | — | LIVE | Direct, nav |
| `/jobs` | public | — | LIVE | Nav, homepage |
| `/how-it-works` | public | — | LIVE | Nav, footer |
| `/about` | public | — | LIVE | Nav, footer |
| `/contact` | public | — | LIVE | Footer |
| `/forum` | public | — | LIVE | Nav |
| `/forum/:categorySlug` | public | — | LIVE | Forum index |
| `/forum/post/:postId` | public | — | LIVE | Forum category |
| `/dispute-policy` | public | — | LIVE | Footer |
| `/professionals` | public | — | 🔒 founding-members | Nav |
| `/professionals/:id` | public | — | 🔒 founding-members | Directory |
| `/services` | public | — | 🔒 service-layer | Nav |
| `/services/:categorySlug` | public | — | 🔒 service-layer | Services index |
| `/services/listing/:listingId` | public | — | 🔒 service-layer | Category page |

### Auth Routes

| Route | Access | Guard | Notes |
|-------|--------|-------|-------|
| `/auth` | public | PublicOnlyGuard | Redirects authed users to dashboard |
| `/auth/callback` | public | — | OAuth callback handler |

### Client Routes (Hiring Lane)

| Route | Access | Guard | Entry Points |
|-------|--------|-------|--------------|
| `/post` | public* | — | Nav, homepage CTA, dashboard |
| `/dashboard/client` | role:client | RouteGuard | Nav (authed), DashboardResolver |
| `/dashboard` | auth | RouteGuard | Redirects via DashboardResolver |

\*Note: `/post` can be public until submit; submit enforces auth.

### Shared Routes (Both Lanes)

| Route | Access | Guard | Entry Points |
|-------|--------|-------|--------------|
| `/messages` | auth | RouteGuard | Nav, dashboard, notification bell |
| `/messages/:id` | auth | RouteGuard | Conversation list |
| `/settings` | auth | RouteGuard | Nav (account section) |
| `/forum/:categorySlug/new` | auth | RouteGuard | Forum category page |

### Professional Routes (Working Lane)

| Route | Access | Guard | Entry Points |
|-------|--------|-------|--------------|
| `/dashboard/pro` | role:professional | RouteGuard | Nav, DashboardResolver |
| `/onboarding/professional` | role:professional | RouteGuard | Post-signup redirect |
| `/professional/services` | role:professional | RouteGuard | Onboarding, dashboard |
| `/professional/listings` | role:professional | RouteGuard | Nav |
| `/professional/listings/:listingId/edit` | role:professional | RouteGuard | Listings page |
| `/professional/priorities` | role:professional | RouteGuard | Nav |
| `/professional/profile` | role:professional | RouteGuard | Dashboard |
| `/professional/portfolio` | role:professional | RouteGuard | Dashboard |

### Admin Routes

| Route | Access | Guard | Notes |
|-------|--------|-------|-------|
| `/dashboard/admin` | admin | RouteGuard | Admin nav only |
| `/dashboard/admin/insights/:metricKey` | admin | RouteGuard | Drilldown |
| `/dashboard/admin/insights/market-gap` | admin | RouteGuard | Insight page |
| `/dashboard/admin/insights/funnels` | admin | RouteGuard | Insight page |
| `/dashboard/admin/insights/pro-performance` | admin | RouteGuard | Insight page |
| `/dashboard/admin/insights/pricing` | admin | RouteGuard | Insight page |
| `/dashboard/admin/insights/trends` | admin | RouteGuard | Insight page |
| `/dashboard/admin/insights/unanswered-jobs` | admin | RouteGuard | Insight page |
| `/dashboard/admin/insights/repeat-work` | admin | RouteGuard | Insight page |
| `/dashboard/admin/insights/onboarding-funnel` | admin | RouteGuard | Insight page |
| `/dashboard/admin/insights/top-sources` | admin | RouteGuard | Insight page |
| `/dashboard/admin/insights/messaging-pulse` | admin | RouteGuard | Insight page |

### Guard System Summary

| Guard | Behaviour |
|-------|-----------|
| `RouteGuard` | Checks `AccessRule` + `minRollout`. Redirects to `/auth` (with return URL) if denied. |
| `PublicOnlyGuard` | Redirects authenticated users away from `/auth` to dashboard. |
| `RolloutGate` | Wraps gated public routes. Redirects to `/` if phase not reached. |
| `DashboardResolver` | `/dashboard` → resolves by `activeRole`. |

---

## 3. Feature-to-Page Matrix

Maps every page to: feature systems used, DB reads, DB writes, and what it changes.

| Page | Route | Feature Systems | Reads Tables/Views | Writes Tables | Notes |
|------|-------|-----------------|-------------------|--------------|-------|
| Homepage | `/` | Discovery | `service_categories`, `service_search_index` | — | Entry to job board + wizard |
| Job Board | `/jobs` | Listing, Filters | `jobs_board` (view) | — | Public read |
| Job Wizard | `/post` | Wizard, Question Packs, Drafts | taxonomy tables, `question_packs` | `jobs` | Draft → posted on submit |
| Client Dashboard | `/dashboard/client` | Jobs list, Messaging, Quotes | `jobs`, `quotes`, `conversations` | `jobs` | Status controls |
| Pro Dashboard | `/dashboard/pro` | Matching feed | `matched_jobs_for_professional` (view) | — | Feed is view-driven |
| Messages | `/messages` | Messaging list, Realtime | `conversations`, `messages` | `conversations` | last_read updates |
| Conversation | `/messages/:id` | Realtime thread, Quote cards | `messages`, `quotes` | `messages` | Core interaction |
| Settings | `/settings` | Profile, prefs | `profiles`, `notification_preferences` | `profiles`, `notification_preferences` | Shared |
| Pro Onboarding | `/onboarding/professional` | Onboarding flow | taxonomy tables | `professional_profiles`, `professional_services` | Defines matching |
| Pro Services | `/professional/services` | Service selection | `professional_services`, `service_micro_categories` | `professional_services` | Manage offered micros |
| Pro Listings | `/professional/listings` | Listing manager | `service_listings` | `service_listings` | 🔒 service-layer |
| Listing Editor | `/professional/listings/:id/edit` | Listing CRUD | `service_listings`, `service_micro_categories` | `service_listings` | 🔒 service-layer |
| Pro Priorities | `/professional/priorities` | Lead preferences | `professional_micro_preferences` | `professional_micro_preferences` | Match tuning |
| Pro Profile | `/professional/profile` | Profile editor | `professional_profiles` | `professional_profiles` | Public-facing profile |
| Pro Portfolio | `/professional/portfolio` | Portfolio uploads | `professional_documents` | `professional_documents` | Future gallery |
| Forum Index | `/forum` | Forum read | `forum_categories` | — | Public read |
| Forum Category | `/forum/:slug` | Forum read | `forum_posts` | — | Public read |
| Forum Post | `/forum/post/:id` | Read + reply | `forum_posts`, `forum_replies` | `forum_replies` | Reply requires auth |
| Forum New Post | `/forum/:slug/new` | Forum write | `forum_categories` | `forum_posts` | Auth required |
| How It Works | `/how-it-works` | Static content | — | — | SEO landing |
| About | `/about` | Static content | — | — | SEO landing |
| Contact | `/contact` | Static content | — | — | SEO landing |
| Admin Dashboard | `/dashboard/admin` | Stats, Jobs, Users, Content, Support | all admin views | `admin_actions_log` | Full ops console |
| Admin Insights | `/dashboard/admin/insights/*` | Analytics, Drilldown | `analytics_events`, `jobs`, `quotes` | — | Read-only analysis |
| Professionals | `/professionals` | Directory | `public_professional_details` (view) | — | 🔒 founding-members |
| Professional Detail | `/professionals/:id` | Profile view | `professional_profiles`, `professional_micro_stats` | — | 🔒 founding-members |
| Services | `/services` | Marketplace | `service_categories`, `service_listings_browse` (view) | — | 🔒 service-layer |
| Service Category | `/services/:slug` | Category browse | `service_listings_browse` (view) | — | 🔒 service-layer |
| Service Listing | `/services/listing/:id` | Listing detail | `service_listings`, `service_views` | `service_views` | 🔒 service-layer |

---

## 4. Job Lifecycle State Machine

Canonical job statuses (construction scope).

Job statuses:
`draft → posted → in_review → live → locked → in_progress → completed → cancelled → disputed`

```
DRAFT
└─(client submits)→ POSTED
   └─(system matching)→ IN_REVIEW
      └─(admin/system approve)→ LIVE
         └─(client accepts quote)→ LOCKED
            └─(work begins)→ IN_PROGRESS
               ├─(client marks complete)→ COMPLETED
               └─(either escalates)→ DISPUTED 🔒

CANCELLED: reachable from early states by client.
```

### Transition Rules

| From | To | Who | Trigger | DB Write | Notification |
|------|----|-----|---------|----------|--------------|
| — | `draft` | Client | wizard save | `jobs` INSERT | — |
| `draft` | `posted` | Client | submit | `jobs` UPDATE, `job_status_history` INSERT | — |
| `posted` | `in_review` | System | matching run | `jobs` UPDATE | pros notified |
| `in_review` | `live` | Admin/System | approve | `jobs` UPDATE | — |
| `live` | `locked` | Client | accept quote | `jobs` UPDATE, `quotes` UPDATE | pro notified |
| `locked` | `in_progress` | Both | start confirmed | `jobs` UPDATE | — |
| `in_progress` | `completed` | Client | mark complete | `jobs` UPDATE | review prompt |
| `in_progress` | `disputed` | Either | 🔒 escalation | 🔒 | 🔒 |
| early | `cancelled` | Client | cancel | `jobs` UPDATE | notify if assigned |

### Quote Statuses (versioned)

`submitted → accepted | rejected | withdrawn`  
`revised` is represented by creating a new revision row with `revision_number++`.

### Milestone Statuses (PLANNED)

`pending → funded → in_progress → awaiting_client_approval → approved → released → disputed`

---

## 5. Data Spine

Core tables grouped by system. Relationships are anchored on:
- `user_id` — identity spine
- `job_id` — job spine (the central object)
- `professional_id` — supply-side spine

### Identity

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | Unified user profile | `user_id`, `display_name`, `phone` |
| `user_roles` | Role assignments | `user_id`, `role` |
| `admin_allowlist` | Admin access control | `email` |
| `notification_preferences` | Email/digest settings | `user_id`, `email_messages`, `digest_frequency` |
| `attribution_sessions` | Marketing attribution | `user_id`, `session_id`, `utm_source` |

### Service Taxonomy (Construction-only)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `service_categories` | Top-level trades (16 categories) | `slug`, `name`, `icon_emoji` |
| `service_subcategories` | Mid-level grouping | `category_id`, `slug`, `name` |
| `service_micro_categories` | Atomic service types (matching unit) | `subcategory_id`, `slug`, `name` |
| `question_packs` | Wizard question packs per micro | `micro_slug`, `questions` (jsonb), `version` |
| `service_search_index` (view) | Denormalized search | `search_text`, `micro_slug`, `has_pack` |

### Professionals

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `professional_profiles` | Pro-specific profile | `user_id`, `business_name`, `onboarding_phase`, `verification_status` |
| `professional_services` | What micros a pro offers | `user_id`, `micro_id`, `status`, `notify` |
| `professional_micro_preferences` | Matching preferences per micro | `user_id`, `micro_id`, `preference`, `min_budget_eur` |
| `professional_micro_stats` | Aggregated performance per micro | `user_id`, `micro_id`, `avg_rating`, `completed_jobs_count` |
| `professional_documents` | Certifications, portfolio | `user_id`, `document_type`, `file_path`, `status` |
| `professional_matching_scores` (view) | Ranked match scores | `user_id`, `micro_id`, `match_score` |
| `public_professional_details` (view) | Public-safe profile data | `id`, `display_name`, `verification_status` |

### Jobs

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `jobs` | Core job record (the spine) | `id`, `user_id`, `micro_slug`, `status`, `category` |
| `job_status_history` | Audit trail of state transitions | `job_id`, `from_status`, `to_status`, `changed_by` |
| `job_invites` | Client invites pro to job | `job_id`, `professional_id`, `status` |
| `job_reviews` | Reviews per completed job | `job_id`, `reviewer_user_id`, `reviewee_user_id`, `rating` |
| `job_notifications_queue` | Notification dispatch queue | `job_id`, `event`, `sent_at` |
| `jobs_board` (view) | Public job board (filtered) | `id`, `title`, `category`, `status` |
| `job_details` (view) | Enriched job view (owner-aware) | `id`, `is_owner`, `status`, `answers` |
| `matched_jobs_for_professional` (view) | Pro's matched feed | `id`, `professional_user_id`, `micro_slug` |

### Messaging

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `conversations` | Thread container (always job-scoped) | `id`, `job_id`, `client_id`, `pro_id` |
| `conversation_participants` | Extended participants (support agents) | `conversation_id`, `user_id`, `role_in_conversation` |
| `messages` | Message events (realtime-enabled) | `conversation_id`, `sender_id`, `body`, `message_type` |

### Quotes

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `quotes` | Versioned proposals | `job_id`, `professional_id`, `revision_number`, `status`, `total` |
| `quote_line_items` | Structured cost breakdown | `quote_id`, `description`, `unit_price`, `quantity` |

### Reviews

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `job_reviews` | Review per completed job | `job_id`, `reviewer_user_id`, `reviewee_user_id`, `rating`, `comment` |
| `professional_micro_stats` | Aggregated stats per micro | `user_id`, `micro_id`, `avg_rating`, `completed_jobs_count`, `rating_count` |

### Service Listings (🔒 service-layer)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `service_listings` | Pro-created service pages | `provider_id`, `micro_id`, `status`, `display_title` |
| `service_views` | View tracking per listing | `service_listing_id`, `viewer_user_id` |
| `service_listings_browse` (view) | Public browse view | `id`, `provider_name`, `micro_name`, `starting_price` |

### Admin / Ops

| Table/View | Purpose | Key Columns |
|------------|---------|-------------|
| `admin_actions_log` | Audit of admin actions | `admin_user_id`, `action_type`, `target_id` |
| `admin_users_list` (view) | Admin user management view | `id`, `roles`, `status` |
| `admin_support_inbox` (view) | Support ticket overview | `ticket_number`, `status`, `priority` |
| `support_requests` | Help/escalation tickets | `conversation_id`, `job_id`, `issue_type`, `status` |
| `support_request_events` | Ticket event log | `support_request_id`, `event_type`, `actor_user_id` |

### Observability

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `analytics_events` | Product analytics | `event_name`, `user_id`, `metadata` |
| `page_views` | Page view tracking | `user_id`, `route`, `load_time_ms` |
| `error_events` | Client-side error log | `error_type`, `message`, `route` |
| `network_failures` | Failed network requests | `request_url`, `status_code`, `route` |
| `email_notifications_queue` | Email dispatch queue | `event_type`, `recipient_user_id`, `sent_at` |
| `tester_reports` | QA bug reports | `user_id`, `description`, `status` |

### Forum

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `forum_categories` | Forum sections | `slug`, `name`, `is_active` |
| `forum_posts` | Forum threads | `category_id`, `author_id`, `title` |
| `forum_replies` | Thread replies | `post_id`, `author_id`, `content` |

---

## Edge Functions

| Function | Purpose | Triggers |
|----------|---------|----------|
| `send-notifications` | Email dispatch from queue | `email_notifications_queue` |
| `send-job-notification` | Job-specific notifications | `job_notifications_queue` |
| `send-auth-email` | Custom auth emails | Auth events |
| `translate-content` | i18n translation | Job/listing creation |
| `backfill-translations` | Batch translate existing content | Manual/admin |
| `collect-attribution` | Store marketing attribution | Page load |
| `update-user-email` | Email change flow | Settings |
| `seedpacks` | Seed question packs | Admin/dev |
| `ping` | Health check | Monitoring |

---

## PLANNED Systems (not built yet)

- **Payments:** Stripe integration, payment intents, receipts
- **Escrow:** Milestone-based fund holding + release
- **Disputes:** Formal escalation flow with resolution
- **Trust badges:** Verified, insured, top-rated
- **Push notifications:** Mobile/browser push
- **File attachments:** In-message file sharing

---

## Golden Rules

1. **Every conversation belongs to a job.** No orphan messaging.
2. **Quotes are versioned, never edited.** New revision = new row.
3. **Reviews attach to job + micro.** Per-service reputation, not just per-person.
4. **One user, two roles.** Role switching, not separate accounts.
5. **Status transitions are audited.** Every change writes to `job_status_history`.
6. **Matching is micro-level.** `job.micro_slug` ↔ `professional_services.micro_id` via taxonomy.
7. **Construction only.** Platform scope is locked to trades and property services.
