# Constructive Solutions Ibiza — Platform Architecture Pack

> **Version:** v1.0 · **Date:** 2026-03-05  
> **Scope:** Construction & property services only  
> **Current rollout phase:** `pipe-control` (Weeks 1–4)

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
┌─────────────┬──────────────────┬─────────────────────┬──────────────────────┐
│   PUBLIC     │   CLIENT (Asker) │ PROFESSIONAL (Tasker)│   SYSTEM             │
├─────────────┼──────────────────┼─────────────────────┼──────────────────────┤
│ Homepage    │                  │                     │                      │
│   ↓         │                  │                     │                      │
│ Browse Jobs │                  │                     │                      │
│ How It Works│                  │                     │                      │
│ Forum (read)│                  │                     │                      │
│ About       │                  │                     │                      │
│ Contact     │                  │                     │                      │
│   ↓         │                  │                     │                      │
│ Sign Up ────┼─→ Choose Role ───┼─→ Choose Role       │                      │
│             │   ↓              │   ↓                 │                      │
│             │ Post Job Wizard  │ Onboarding          │                      │
│             │   ↓              │   ↓ Basic Info      │                      │
│             │ Pick Category    │   ↓ Select Trades   │                      │
│             │   ↓              │   ↓ Service Area    │                      │
│             │ Pick Micro       │   ↓ Profile Setup   │                      │
│             │   ↓              │                     │                      │
│             │ Question Pack    │                     │                      │
│             │   ↓              │                     │                      │
│             │ Date/Budget/Area │                     │                      │
│             │   ↓              │                     │                      │
│             │ Review & Submit  │                     │ ← Job created        │
│             │                  │                     │   ↓                  │
│             │                  │                     │ Matching engine runs │
│             │                  │                     │   ↓                  │
│             │                  │ Matched Jobs Feed ←─┤ Pros notified       │
│             │                  │   ↓                 │                      │
│             │ ← Message Pro ──┼── Message Client    │ Realtime sync        │
│             │                  │   ↓                 │                      │
│             │                  │ Submit Quote        │ Quote stored         │
│             │   ↓              │                     │                      │
│             │ Receive Quote    │                     │                      │
│             │   ↓              │                     │                      │
│             │ Accept Quote     │                     │ Job → in_progress    │
│             │   ↓              │   ↓                 │                      │
│             │ Mark Complete    │ Complete Job        │ Job → completed      │
│             │   ↓              │   ↓                 │                      │
│             │ Leave Review     │ Receive Review      │ Stats updated        │
│             │                  │                     │                      │
│ 🔒 Browse   │                  │ 🔒 Service Listings │                      │
│   Pros      │                  │ 🔒 Portfolio        │                      │
│ 🔒 Services │                  │                     │                      │
│   Marketplace│                 │                     │ 🔒 Payments          │
│             │                  │                     │ 🔒 Escrow            │
│             │                  │                     │ 🔒 Disputes          │
└─────────────┴──────────────────┴─────────────────────┴──────────────────────┘
```

### Role Switching

A professional can also act as a client. One account, two roles. The `RoleSwitcher` component in the nav toggles between `activeRole: 'client' | 'professional'`. Dashboard resolves via `DashboardResolver` → routes to `/dashboard/client` or `/dashboard/pro`.

---

## 2. Route Map by Lane

Every route from `registry.ts`, tagged with lane, access rule, guard type, and rollout gate.

### Public Routes

| Route | Access | Guard | Rollout | Entry Points |
|-------|--------|-------|---------|--------------|
| `/` | public | — | LIVE | Direct, nav |
| `/jobs` | public | — | LIVE | Nav, homepage |
| `/how-it-works` | public | — | LIVE | Nav, footer |
| `/about` | public | — | LIVE | Nav, footer |
| `/contact` | public | — | LIVE | Footer |
| `/forum` | public | — | LIVE | Nav (shared section) |
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
| `/post` | public | — | Nav, homepage CTA, dashboard |
| `/dashboard/client` | role:client | RouteGuard | Nav (when authed), DashboardResolver |
| `/dashboard` | auth | RouteGuard | Redirects via DashboardResolver |

### Shared Routes (Both Lanes)

| Route | Access | Guard | Entry Points |
|-------|--------|-------|--------------|
| `/messages` | auth | RouteGuard | Nav, dashboard, notification bell |
| `/messages/:id` | auth | RouteGuard | Conversation list, job detail |
| `/settings` | auth | RouteGuard | Nav (account section) |
| `/forum/:categorySlug/new` | auth | RouteGuard | Forum category page |

### Professional Routes (Working Lane)

| Route | Access | Guard | Entry Points |
|-------|--------|-------|--------------|
| `/dashboard/pro` | role:professional | RouteGuard | Nav, DashboardResolver |
| `/onboarding/professional` | role:professional | RouteGuard | Post-signup redirect |
| `/professional/services` | role:professional | RouteGuard | Onboarding, dashboard |
| `/professional/listings` | role:professional | RouteGuard | Nav (working section) |
| `/professional/listings/:listingId/edit` | role:professional | RouteGuard | Listings page |
| `/professional/priorities` | role:professional | RouteGuard | Nav (working section) |
| `/professional/profile` | role:professional | RouteGuard | Dashboard, settings |
| `/professional/portfolio` | role:professional | RouteGuard | Dashboard, profile |

### Admin Routes

| Route | Access | Guard | Notes |
|-------|--------|-------|-------|
| `/dashboard/admin` | admin | RouteGuard | Admin nav only |
| `/dashboard/admin/insights/:metricKey` | admin | RouteGuard | Admin dashboard drilldown |
| `/dashboard/admin/insights/market-gap` | admin | RouteGuard | Insight sub-page |
| `/dashboard/admin/insights/funnels` | admin | RouteGuard | Insight sub-page |
| `/dashboard/admin/insights/pro-performance` | admin | RouteGuard | Insight sub-page |
| `/dashboard/admin/insights/pricing` | admin | RouteGuard | Insight sub-page |
| `/dashboard/admin/insights/trends` | admin | RouteGuard | Insight sub-page |
| `/dashboard/admin/insights/unanswered-jobs` | admin | RouteGuard | Insight sub-page |
| `/dashboard/admin/insights/repeat-work` | admin | RouteGuard | Insight sub-page |
| `/dashboard/admin/insights/onboarding-funnel` | admin | RouteGuard | Insight sub-page |
| `/dashboard/admin/insights/top-sources` | admin | RouteGuard | Insight sub-page |
| `/dashboard/admin/insights/messaging-pulse` | admin | RouteGuard | Insight sub-page |

### Guard System Summary

| Guard | Behaviour |
|-------|-----------|
| `RouteGuard` | Checks `AccessRule` + `minRollout`. Redirects to `/auth` (with return URL) if denied. |
| `PublicOnlyGuard` | Redirects authenticated users away from `/auth` to their dashboard. Admins exempt. |
| `RolloutGate` | Wraps gated public routes. Redirects to `/` if phase not reached. |
| `DashboardResolver` | `/dashboard` → resolves to `/dashboard/client` or `/dashboard/pro` based on `activeRole`. |

---

## 3. Feature-to-Page Matrix

### What features power each page, what data they touch.

| Page | Route | Feature Systems | Reads Tables/Views | Creates/Edits Tables | Notes |
|------|-------|----------------|--------------------|--------------------|-------|
| **Homepage** | `/` | Discovery, Search | `service_categories`, `service_search_index` | — | Entry point to wizard + job board |
| **Job Board** | `/jobs` | Job listing, Filters | `jobs_board` (view) | — | Public read of posted jobs |
| **Job Detail** | `/jobs` (modal) | Job detail, Quotes tab | `job_details` (view), `quotes`, `quote_line_items` | — | Modal overlay on job board |
| **Job Wizard** | `/post` | CanonicalJobWizard, Question Packs, Drafts, Taxonomy selector | `service_categories`, `service_subcategories`, `service_micro_categories`, `question_packs`, `service_search_index` | `jobs` (INSERT) | Creates job with `status: draft→posted`. Auth checkpoint at submit. |
| **Client Dashboard** | `/dashboard/client` | Job list, Stats, Quick actions, Pending reviews | `jobs` (own), `quotes`, `conversations`, `job_reviews` | `jobs` (UPDATE status) | Shows own jobs timeline + unread messages |
| **Job Ticket Detail** | `/dashboard/client` (sub) | Job detail, Match & Send, Quote acceptance | `job_details`, `quotes`, `professional_profiles`, `professional_matching_scores` | `job_invites` (INSERT), `quotes` (UPDATE status), `jobs` (UPDATE) | Client manages single job lifecycle |
| **Pro Dashboard** | `/dashboard/pro` | Matched jobs feed, Stats, Quick actions | `matched_jobs_for_professional` (view), `professional_micro_stats`, `conversations` | — | Shows jobs matching pro's services |
| **Messages List** | `/messages` | Conversation list, Unread counts, Support requests | `conversations`, `messages`, `profiles`, `support_requests` | `conversations` (UPDATE last_read) | Realtime subscription on `messages` |
| **Conversation** | `/messages/:id` | Thread view, Realtime, Quote links, Support escalation | `messages`, `conversations`, `quotes`, `support_requests` | `messages` (INSERT), `conversations` (UPDATE), `support_requests` (INSERT) | Core interaction page. Quote cards embedded. |
| **Settings** | `/settings` | Profile edit, Notification prefs, Language | `profiles`, `notification_preferences` | `profiles` (UPDATE), `notification_preferences` (UPSERT) | Shared by both roles |
| **Pro Onboarding** | `/onboarding/professional` | Multi-step wizard, Taxonomy browser, Zone picker | `service_categories`, `service_subcategories`, `service_micro_categories` | `professional_profiles` (INSERT/UPDATE), `professional_services` (INSERT) | 4 steps: Basic → Services → Area → Review |
| **Pro Services** | `/professional/services` | Service unlock, Micro preferences | `professional_services`, `service_micro_categories`, `professional_micro_preferences` | `professional_services` (INSERT/DELETE), `professional_micro_preferences` (UPSERT) | Manage which micros the pro offers |
| **Pro Listings** | `/professional/listings` | Listing cards, Status management | `service_listings` | `service_listings` (UPDATE status) | 🔒 service-layer |
| **Listing Editor** | `/professional/listings/:id/edit` | Rich editor, Image upload, Pricing | `service_listings`, `service_micro_categories` | `service_listings` (UPDATE) | 🔒 service-layer |
| **Pro Priorities** | `/professional/priorities` | Job type ranking, Recommended types | `professional_micro_stats`, `professional_services`, `service_micro_categories` | `professional_micro_preferences` (UPSERT) | Tune matching preferences |
| **Pro Profile** | `/professional/profile` | Profile editor, Avatar upload | `professional_profiles` | `professional_profiles` (UPDATE) | Business name, bio, rates, hours |
| **Forum Index** | `/forum` | Category list | `forum_categories` | — | Public read |
| **Forum Category** | `/forum/:slug` | Post list, Sorting | `forum_posts`, `forum_categories` | — | Public read |
| **Forum Post** | `/forum/post/:id` | Post detail, Replies, Voting | `forum_posts`, `forum_replies` | `forum_replies` (INSERT) | Auth required to reply |
| **Forum New Post** | `/forum/:slug/new` | Post editor | `forum_categories` | `forum_posts` (INSERT) | Auth required |
| **Professionals Directory** | `/professionals` | Ranked list, Filters | `professional_profiles`, `professional_micro_stats` | — | 🔒 founding-members |
| **Professional Detail** | `/professionals/:id` | Public profile, Reviews, Services | `public_professional_details` (view), `professional_services`, `job_reviews` | — | 🔒 founding-members |
| **Services Marketplace** | `/services` | Category grid, Featured | `service_categories` | — | 🔒 service-layer |
| **Service Category** | `/services/:slug` | Listing grid, Filters | `service_listings_browse` (view) | — | 🔒 service-layer |
| **Service Listing Detail** | `/services/listing/:id` | Full listing, Provider info | `service_listings`, `professional_profiles` | `service_views` (INSERT) | 🔒 service-layer |
| **Admin Dashboard** | `/dashboard/admin` | Stats, Health, Users, Jobs, Content, Support, Insights | `admin_users_list` (view), `jobs`, `forum_posts`, `forum_replies`, `support_requests`, `admin_support_inbox` (view), `analytics_events`, `error_events`, `network_failures`, `page_views`, `admin_actions_log` | `professional_profiles` (UPDATE verification), `jobs` (UPDATE status), `admin_actions_log` (INSERT) | Full platform ops |

---

## 4. Job Lifecycle State Machine

### Job Statuses

```
                          ┌────────────┐
                          │   DRAFT    │  Client saves wizard progress
                          └─────┬──────┘
                                │ Client submits
                                ▼
                          ┌────────────┐
                          │   POSTED   │  Job visible on board
                          └─────┬──────┘
                                │ System matches professionals
                                ▼
                          ┌────────────┐
                          │ IN_REVIEW  │  Matched pros can see job
                          └─────┬──────┘
                                │ Admin/system approves
                                ▼
                          ┌────────────┐
                          │    LIVE    │  Fully visible, quotes accepted
                          └─────┬──────┘
                                │ Client accepts a quote
                                ▼
                          ┌────────────┐
                          │   LOCKED   │  Assigned to one pro
                          └─────┬──────┘
                                │ Work begins
                                ▼
                          ┌────────────┐
                          │IN_PROGRESS │  Active work
                          └─────┬──────┘
                           ┌────┴────┐
                           ▼         ▼
                    ┌───────────┐ ┌──────────┐
                    │ COMPLETED │ │ DISPUTED │   🔒 Future
                    └─────┬─────┘ └──────────┘
                          │
                          ▼
                    ┌───────────┐
                    │ REVIEWED  │  (implicit — job_reviews exist)
                    └───────────┘

          ┌────────────┐
          │ CANCELLED  │  Client can cancel from: draft, posted, live
          └────────────┘
```

### State Transition Rules

| From | To | Who | Trigger | DB Write | Notification |
|------|----|-----|---------|----------|-------------|
| — | `draft` | Client | Wizard save | `jobs` INSERT | — |
| `draft` | `posted` | Client | Wizard submit | `jobs` UPDATE, `job_status_history` INSERT | — |
| `posted` | `in_review` | System | Matching runs | `jobs` UPDATE | Matched pros notified |
| `in_review` | `live` | Admin/System | Approval | `jobs` UPDATE | — |
| `live` | `locked` | Client | Accept quote | `jobs` UPDATE, `quotes` UPDATE | Pro notified |
| `locked` | `in_progress` | Both | Work confirmed | `jobs` UPDATE | — |
| `in_progress` | `completed` | Client | Mark complete | `jobs` UPDATE, `completed_at` set | Review prompt sent |
| `in_progress` | `disputed` | Either | 🔒 Escalation | 🔒 Future | 🔒 Future |
| any early | `cancelled` | Client | Cancel job | `jobs` UPDATE | Pro notified if assigned |

### Quote Statuses

```
  ┌───────────┐
  │ SUBMITTED │  Pro sends quote
  └─────┬─────┘
   ┌────┴────┬──────────┐
   ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌───────────┐
│ACCEPTED│ │REJECTED│ │  REVISED  │ → back to SUBMITTED (new revision)
└────────┘ └────────┘ └───────────┘
                ▼
          ┌───────────┐
          │ WITHDRAWN │  Pro withdraws
          └───────────┘
```

| From | To | Who | Trigger |
|------|----|-----|---------|
| — | `submitted` | Professional | Submit quote form |
| `submitted` | `revised` | Professional | Edit + resubmit (revision_number++) |
| `submitted` | `accepted` | Client | Accept quote |
| `submitted` | `rejected` | Client | Reject quote |
| `submitted` | `withdrawn` | Professional | Withdraw quote |

---

## 5. Data Spine

### Core Tables by System

#### 🔑 Identity System
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profile (both roles) | `user_id`, `display_name`, `phone` |
| `user_roles` | Role assignments | `user_id`, `role` |
| `admin_allowlist` | Admin email whitelist | `email` |

#### 🏗️ Service Taxonomy
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `service_categories` | Top-level categories (Electrical, Plumbing…) | `slug`, `name`, `icon_emoji` |
| `service_subcategories` | Mid-level grouping | `category_id`, `slug`, `name` |
| `service_micro_categories` | Atomic service types (the matching unit) | `subcategory_id`, `slug`, `name` |
| `question_packs` | Structured questions per micro | `micro_slug`, `questions` (JSONB) |
| `service_search_index` | Denormalized search view | `micro_name`, `search_text` |

#### 📋 Jobs System
| Table/View | Purpose | Key Columns |
|------------|---------|-------------|
| `jobs` | Core job record | `user_id`, `micro_slug`, `status`, `answers` |
| `job_status_history` | Audit trail of status changes | `job_id`, `from_status`, `to_status`, `changed_by` |
| `job_invites` | Client invites pro to job | `job_id`, `professional_id`, `status` |
| `jobs_board` (VIEW) | Public job listing | Filters: `status = 'live'`, `is_publicly_listed` |
| `job_details` (VIEW) | Full job info for detail page | Includes `is_owner` flag |
| `matched_jobs_for_professional` (VIEW) | Pro's matched feed | Joins `professional_services` ↔ `jobs` on micro |

#### 👷 Professional System
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `professional_profiles` | Pro business profile | `user_id`, `onboarding_phase`, `verification_status`, `service_zones` |
| `professional_services` | Which micros the pro offers | `user_id`, `micro_id`, `status`, `notify` |
| `professional_micro_preferences` | Per-micro tuning (distance, budget) | `user_id`, `micro_id`, `preference` |
| `professional_micro_stats` | Per-micro reputation | `user_id`, `micro_id`, `avg_rating`, `completed_jobs_count` |
| `professional_documents` | Uploaded certs/licenses | `user_id`, `document_type`, `status` |
| `service_listings` | Pro's marketplace listings | `provider_id`, `micro_id`, `status` |
| `professional_matching_scores` (VIEW) | Computed match ranking | `user_id`, `micro_id`, `match_score` |

#### 💬 Messaging System
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `conversations` | Job-scoped conversation | `job_id`, `client_id`, `pro_id` |
| `messages` | Individual messages | `conversation_id`, `sender_id`, `message_type` |
| `conversation_participants` | Extended participants (support agents) | `conversation_id`, `user_id`, `role_in_conversation` |

#### 💰 Quote System
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `quotes` | Structured quote per job | `job_id`, `professional_id`, `revision_number`, `status`, `total` |
| `quote_line_items` | Itemized pricing | `quote_id`, `description`, `unit_price`, `quantity` |

#### ⭐ Review System
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `job_reviews` | Post-job rating | `job_id`, `reviewer_user_id`, `reviewee_user_id`, `rating` |

#### 🔔 Notifications & Analytics
| Table | Purpose |
|-------|---------|
| `email_notifications_queue` | Queued email notifications processed by edge function |
| `job_notifications_queue` | Job event notifications |
| `notification_preferences` | Per-user notification settings |
| `analytics_events` | Tracked user events |
| `attribution_sessions` | UTM/referral tracking |
| `page_views` | Page view telemetry |
| `error_events` | Client-side error tracking |
| `network_failures` | Failed network request tracking |

#### 🛟 Support System
| Table/View | Purpose |
|------------|---------|
| `support_requests` | User-raised support tickets |
| `support_request_events` | Ticket event audit trail |
| `admin_support_inbox` (VIEW) | Admin view of support queue |
| `tester_reports` | Bug reports from testers |
| `admin_actions_log` | Admin action audit trail |

#### 🌐 Forum System
| Table | Purpose |
|-------|---------|
| `forum_categories` | Forum sections |
| `forum_posts` | Discussion threads |
| `forum_replies` | Threaded replies |

### Relationship Spine

```
                        ┌──────────┐
                        │  USER    │
                        │ (auth.id)│
                        └────┬─────┘
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌───────────┐  ┌────────────────┐
        │ profiles │  │ user_roles│  │ professional_  │
        └──────────┘  └───────────┘  │ profiles       │
                                     └───────┬────────┘
                                             │
                                     ┌───────┴────────┐
                                     │ professional_  │
                                     │ services       │
                                     └───────┬────────┘
                                             │ micro_id
                                     ┌───────┴────────┐
                                     │ service_micro_ │
                                     │ categories     │
                                     └───────┬────────┘
                                             │ matched via micro_slug
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                        ┌──────────┐  ┌────────────┐  ┌──────────┐
                        │   JOBS   │  │ question_  │  │ service_ │
                        │          │  │ packs      │  │ listings │
                        └────┬─────┘  └────────────┘  └──────────┘
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌──────────────┐ ┌──────────┐ ┌────────────┐
      │conversations │ │  quotes  │ │job_reviews │
      └──────┬───────┘ └────┬─────┘ └────────────┘
             ▼              ▼
      ┌──────────────┐ ┌──────────────┐
      │  messages    │ │quote_line_   │
      └──────────────┘ │items         │
                       └──────────────┘
```

**Every conversation belongs to a job. Every quote belongs to a job. Every review belongs to a job.**  
`JOB_ID` is the spine of the platform.

---

## Rollout Phase Summary

| Phase | Status | What It Unlocks |
|-------|--------|----------------|
| `pipe-control` | ✅ LIVE | Wizard, Jobs board, Forum, Messaging, Quotes, Reviews, Pro onboarding, Dashboards |
| `founding-members` | 🔒 Weeks 5–8 | `/professionals` directory, `/professionals/:id` public profiles |
| `service-layer` | 🔒 Weeks 9–12 | `/services` marketplace, Service listings, Listing editor |
| `trust-engine` | 🔒 Future | Trust badges, Verification tiers, Public review display |
| `escrow-beta` | 🔒 Future | Payment protection, Milestone payments |
| `scale-ready` | 🔒 Future | Full automation, Subscription tiers |

---

## Edge Functions (Backend)

| Function | Purpose | Trigger |
|----------|---------|---------|
| `send-notifications` | Process email notification queue | Cron / DB trigger |
| `send-job-notification` | Notify matched pros of new job | Job status change |
| `send-auth-email` | Custom auth emails | Auth events |
| `translate-content` | i18n translation for jobs | Job creation |
| `backfill-translations` | Batch translate existing content | Manual |
| `collect-attribution` | Store UTM/referral data server-side | Page load |
| `update-user-email` | Admin email change | Admin action |
| `seedpacks` | Seed question packs | Manual/deploy |
| `ping` | Health check | Monitoring |

---

## The Golden Rules

1. **Every conversation belongs to a JOB** — no orphan messaging
2. **Quotes are versioned** — `revision_number` increments, client accepts a specific revision
3. **Reviews attach to micro-services** — `professional_micro_stats` tracks per-trade reputation
4. **One user, multiple roles** — `RoleSwitcher` toggles `activeRole`, no separate accounts
5. **State machine is law** — jobs move through defined statuses only, tracked in `job_status_history`
6. **Rollout gates are code** — `isRolloutActive()` + `RolloutGate` component, change one value to unlock features

---

## Traceability Test

> "Can I pick any feature and trace it end-to-end?"

**Example: Quote Flow**
1. **UI Page:** `/messages/:id` → `SubmitQuoteForm` component
2. **API Call:** `supabase.from('quotes').insert(...)` + `supabase.from('quote_line_items').insert(...)`
3. **DB Tables:** `quotes`, `quote_line_items`
4. **State Change:** Quote `status: submitted`, shown in `QuoteCard` on conversation thread
5. **Realtime:** Message of type `system` posted to conversation announcing quote
6. **Permissions:** RLS — pro can insert own quotes within their conversation; client can view/accept quotes on own jobs

✅ If you can do this for every feature, the architecture is complete.
