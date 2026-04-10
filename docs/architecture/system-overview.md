# System Overview

**Last updated:** 2026-03-07
**Owner:** Engineering Lead

## Purpose

Single-page orientation for anyone joining the project. Understand the full platform architecture in under 5 minutes.

## Scope

Covers all runtime components: frontend, backend, edge functions, external integrations, and their connections.

## Current State

Production platform running on Lovable Cloud (Supabase) with 12 edge functions, 30+ database tables, and a React/Vite frontend.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐ │
│  │ Wizard   │  │ Dashboards│  │ Messages │  │ Forum  │ │
│  │ Canonical│  │ Client/Pro│  │ Realtime │  │ Public │ │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │              │              │             │      │
│  ┌────┴──────────────┴──────────────┴─────────────┴────┐ │
│  │              GUARD LAYER                             │ │
│  │  RouteGuard → checkAccess() → RolloutGate            │ │
│  │  src/guard/access.ts  src/guard/RolloutGate.tsx      │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                                │
│  ┌──────────────────────┴──────────────────────────────┐ │
│  │           STATE & DATA LAYER                         │ │
│  │  useSessionSnapshot (auth + roles + pro profile)     │ │
│  │  React Query (staleTime-based caching)               │ │
│  │  Supabase Realtime (messages channel)                │ │
│  └──────────────────────┬──────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               SUPABASE (Lovable Cloud)                   │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐ │
│  │  Auth     │  │  Database │  │ Realtime │  │Storage │ │
│  │  (email)  │  │  (Postgres│  │ (WS)    │  │(docs,  │ │
│  │          │  │   + RLS)  │  │          │  │photos) │ │
│  └──────────┘  └─────┬─────┘  └──────────┘  └────────┘ │
│                      │                                   │
│  ┌───────────────────┴────────────────────────────────┐  │
│  │              EDGE FUNCTIONS (11)                    │  │
│  │                                                     │  │
│  │  send-notifications      → Gmail SMTP queue worker  │  │
│  │  send-job-notification   → Resend + Telegram alerts │  │
│  │  collect-attribution     → Attribution binding      │  │
│  │  translate-content       → i18n translation         │  │
│  │  search-stock-photos     → Stock photo search       │  │
│  │  update-user-email       → Email change flow        │  │
│  │  ping                    → Health check             │  │
│  │  seedpacks / seed-*      → DB seeding utilities     │  │
│  │  backfill-translations   → Batch translation        │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                           │
│                                                          │
│  Gmail SMTP ─── Email delivery (send-notifications)      │
│  Resend     ─── Email delivery (send-job-notification)   │
│  Telegram   ─── Admin alerts (bot API)                   │
│  CallMeBot  ─── WhatsApp admin alerts                    │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Route System & Rollout Gating

- **Registry:** `src/app/routes/registry.ts` — all routes with access rules, lanes, and nav config
- **Rules:** `src/app/routes/rules.ts` — AccessRule and RouteLane types
- **Guard:** `src/guard/RouteGuard.tsx` → calls `checkAccess()` from `src/guard/access.ts`
- **Rollout:** `src/domain/rollout.ts` — phased feature reveal via `CURRENT_ROLLOUT`
  - Phases: `pipe-control` → `founding-members` → `service-layer` → `trust-engine` → `protection-beta` → `scale-ready`
  - Currently at: **`pipe-control`**

### 2. Auth & Roles

- **Session:** `src/hooks/useSessionSnapshot.ts` — single source of truth for auth state
- **Roles:** `user_roles` table with `roles[]` array and `active_role` column
- **Role switching:** `switch_active_role` RPC function
- **Admin:** Dual-gated via `has_role('admin')` AND `is_admin_email()` SQL functions
- **Pro readiness:** `src/guard/proReadiness.ts` — action-based gating (MESSAGE/APPLY vs BOOK/PAYOUT)

### 3. Domain Model

- **Core contracts:** `src/domain/models.ts` — `ProblemCard`, `TaskerProfile`, `Match`
- **Core loop stages:** `problem_definition` → `problem_structured` → `matching` → `conversation` → `assignment` → `completion` → `review` → `learning`

### 4. Service Taxonomy (3-tier)

```
service_categories (16 groups)
  └── service_subcategories
        └── service_micro_categories
```

- **Search index:** `service_search_index` view (denormalized for fast lookup)
- **Matching:** `matched_jobs_for_professional` view (joins jobs ↔ professional_services via micro_id)
- **Question packs:** `question_packs` table (one pack per micro_slug)

### 5. Key Database Views

| View | Purpose |
|------|---------|
| `service_search_index` | Flattened taxonomy for search |
| `matched_jobs_for_professional` | Pro job matching |
| `jobs_board` | Public job listing |
| `job_details` | Secure job detail (with `is_owner` flag) |
| `service_listings_browse` | Public service marketplace |
| `admin_users_list` | Admin user management |
| `admin_support_inbox` | Support ticket overview |
| `professional_matching_scores` | Pro ranking data |

## Design Decisions

- **Supabase RLS everywhere:** Every table has row-level security. Admin tables use dual gate (`has_role` + `is_admin_email`).
- **Single account, multiple roles:** Users don't create separate accounts per role. One auth identity switches between client/professional/admin.
- **Edge functions for side effects:** All email, WhatsApp, Telegram notifications are processed via edge functions, never from the client.
- **DB-backed queues:** `email_notifications_queue` and `job_notifications_queue` tables act as job queues processed by edge functions.

## Failure Modes / Risks

- **Gmail SMTP rate limits:** 500 emails/day. Throttled at 600ms/send in `send-notifications`.
- **Resend free tier:** Only sends to account owner email. Domain verification needed for production.
- **Edge function cold starts:** First invocation after idle period can be slow (~1-2s).
- **Realtime connection limits:** Supabase free tier limits concurrent WebSocket connections.

## Future Considerations

- Stripe payment integration (designed but not built)
- AI-enhanced job matching scoring
- Push notifications (beyond email/WhatsApp/Telegram)
- CDN for static assets and service listing images

## Related Files

- `docs/ARCHITECTURE_PACK.md` — Detailed system blueprint
- `docs/START_HERE.md` — 10-minute audit path
- `src/domain/models.ts` — Core domain contracts
- `src/domain/rollout.ts` — Rollout phase system
- `src/app/routes/registry.ts` — Route registry
