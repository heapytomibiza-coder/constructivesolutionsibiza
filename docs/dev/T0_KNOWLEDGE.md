# Constructive Solutions Ibiza — T=0 Knowledge Snapshot

**Date:** 2026-04-12  
**Version:** v0.9 (pre-launch)  
**Status:** Active development, staging environment

---

## 1. What This Platform Is

Constructive Solutions Ibiza is a **high-trust construction marketplace** connecting property owners, developers, and villa managers in Ibiza with verified construction professionals.

It is **not** a generic freelance marketplace. It is purpose-built infrastructure for medium-to-large construction projects (€1k–€100k+), designed to replace the WhatsApp-and-hope workflow that dominates Ibiza's construction industry.

### Core Value Proposition

| For Clients | For Professionals |
|---|---|
| Clear, structured project briefs | Serious, pre-qualified jobs |
| Vetted professional matching | Structured scope — less time quoting |
| Payment protection | Fair dispute resolution |
| Full project record | Reputation building |

---

## 2. Platform Identity

| Property | Value |
|---|---|
| **Name** | Constructive Solutions Ibiza |
| **Short Name** | Constructive |
| **Mark** | CS |
| **Industry** | Construction only |
| **Scope** | Construction & property services — no lifestyle, concierge, or general freelance |
| **Tone** | Trustworthy, premium, clear, no fluff |

### Locked Terminology

The platform uses a narrative-driven vocabulary:

| Internal Term | User-Facing Term | Meaning |
|---|---|---|
| Client | **Asker** | Person with a construction problem |
| Professional | **Tasker** | Person who solves it |
| Job | **Problem** | The work to be done |
| Completed work | **Solution** | The outcome |
| Hiring journey | **Asker Lane** | Client-side flow |
| Working journey | **Tasker Lane** | Professional-side flow |
| Job wizard | **Problem Builder** | Guided job creation |

**Core narrative:** Problem → Asker → Constructive Solutions → Tasker → Solution

---

## 3. Target Audience

### Clients (Askers)
- Property owners in Ibiza (residents, holiday home owners)
- Villa managers overseeing maintenance and renovation
- Developers running construction projects
- Budget range: €1,000 – €100,000+
- Need: clarity, reliability, protection from poor outcomes

### Professionals (Taskers)
- Builders, carpenters, electricians, plumbers, painters
- Architects, designers, project managers
- Pool/spa specialists, HVAC technicians, landscapers
- Need: serious clients, clear briefs, fair payment, reputation growth

---

## 4. Service Taxonomy (16 Main Categories)

1. Construction
2. Carpentry
3. Plumbing
4. Electrical
5. HVAC
6. Painting & Decorating
7. Cleaning
8. Gardening & Landscaping
9. Pool & Spa
10. Architects, Design & Management
11. Transport & Logistics
12. Kitchen & Bathroom
13. Floors, Doors & Windows
14. Handyman & General
15. Commercial & Industrial
16. Legal & Regulatory

Each category has subcategories and micro-services (335 total taxonomy items). The taxonomy is the foundation for matching, routing, and pricing.

---

## 5. Core Loop (Lifecycle)

Every interaction follows a 5-stage lifecycle:

```
1. problem_definition  → Asker describes the problem (wizard)
2. finding_clarity     → CS structures the task into a ProblemCard
3. matching            → CS matches qualified Taskers
4. solution_execution  → Conversation, quoting, assignment, work
5. learning            → Reviews update reputation + system patterns
```

### Domain Model Contracts

| Model | Purpose |
|---|---|
| **ProblemCard** | Structured wizard output (micros, answers, location, timing, budget, flags) |
| **TaskerProfile** | Professional capability profile (services, zones, verification, stats) |
| **Match** | Bridge between problem and provider (score, reasons, micro_ids) |

### Job Status Machine

```
draft → open → in_progress → completed
  ↓       ↓         ↓
cancelled cancelled cancelled (rollback to open possible)
```

Terminal states (`completed`, `cancelled`) are locked by database trigger.

---

## 6. Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Vite 5, Tailwind CSS v3, shadcn/ui |
| State | React Query (TanStack Query) |
| Backend | Supabase (Postgres, Realtime, Auth, Edge Functions) |
| i18n | i18next (EN / ES) |
| Testing | Vitest (73 tests) |
| CI | GitHub Actions |

### Project Structure

```
src/
├── domain/          → Domain models, scope, rollout, entitlements, guardrails
├── features/        → Feature modules (search, wizard)
├── pages/           → Route-level components by domain
├── components/      → Shared UI components
├── app/routes/      → Route registry, rules, nav derivation
├── hooks/           → Custom React hooks
├── contexts/        → Auth, role, language providers
├── guard/           → Route guards and auth protection
├── i18n/            → i18next config (EN/ES)
├── integrations/    → Supabase client + auto-generated types
├── lib/             → Utilities (monitoring, helpers)
└── assets/          → Static assets

supabase/
├── migrations/      → 93+ versioned SQL migrations
└── functions/       → Edge functions (notifications, translations)
```

### Provider Architecture

- **main.tsx** — Infrastructure layer: ErrorBoundary, Suspense, chunk-reload guard
- **App.tsx** — Application layer: QueryClient, BrowserRouter, SessionProvider, TooltipProvider, routes

### Route System

- **Registry-driven** — All routes defined in `src/app/routes/registry.ts`
- **Lane-tagged** — public, client, professional, shared, admin
- **Access-controlled** — public, auth, role:client, role:professional, proReady, admin
- **Rollout-gated** — Features hidden until rollout phase reached
- **Nav-derivable** — Navigation auto-generated from registry metadata

---

## 7. Security Model

### Authentication
- Email + password (min 8 chars, HIBP leak check)
- Google OAuth
- Mandatory email confirmation (no auto-confirm)

### Authorization
- Row-Level Security (RLS) on all tables
- `has_role()` SECURITY DEFINER function for role checks
- `is_admin_email()` for admin access (dual-gate: role + allowlist)
- Views use `security_invoker = true`

### Data Protection
- Private storage buckets for dispute evidence and progress photos
- Atomic SECURITY DEFINER RPCs for state transitions
- No foreign keys to `auth.users` — profiles table used instead

### Role Model
- Roles stored in separate `user_roles` table (never on profile)
- Intent-based assignment: "I need help" → client only; "I offer services" → client + professional
- `become_professional()` RPC for explicit upgrade
- `switch_active_role()` for runtime role switching

---

## 8. Rollout System

Features are drip-fed via a phase-based rollout gate:

| Phase | Features Unlocked |
|---|---|
| **pipe-control** | Wizard, Jobs, Forum, Messaging |
| **founding-members** | Professional directory, Pro onboarding |
| **service-layer** ← CURRENT | Services marketplace, Listings |
| **trust-engine** | Reviews, Ratings, Badges, Pricing page |
| **protection-beta** | Milestone payments, Resolution engine |
| **scale-ready** | Full automation |

Current phase: `service-layer`

---

## 9. Subscription & Monetisation

### Tiers

| Tier | Price/mo | Commission | Listings | Quotes/day |
|---|---|---|---|---|
| Bronze | Free | 18% | 15 | 5 |
| Silver | €49 | 12% | 30 | 15 |
| Gold | €99 | 9% | Unlimited | 30 |
| Elite | €199 | 6% | Unlimited | 50 |

- Bronze = default (no purchase needed)
- Silver & Elite = purchasable via Stripe
- Gold = earned, invite-only
- Commission rate source of truth: `subscriptions.commission_rate` (DB)
- Stripe checkout: **not yet live** (`STRIPE_CHECKOUT_LIVE = false`)

### Entitlement System
- `hasFeature(tier, feature)` / `getLimit(tier, limit)` — never raw tier checks
- Features: visibility boost, portfolio limit, insights, priority matching, demand data, featured slots

---

## 10. Payment Protection (Planned)

Legal positioning: **Structured Payment Protection** (never "escrow" or "fund holding")

### Guardrails (protection-beta phase)

| Rule | Value |
|---|---|
| Max project value | €35,000 |
| Milestones per project | 2–10 |
| Max single milestone | €15,000 |
| Default retention | 10% |
| Retention range | 5%–15% |
| Manual review threshold | €20,000 |
| Resolution max days | 28 |
| Auto-progression on non-response | 72 hours |
| All disputes human-reviewed | Yes (beta) |

---

## 11. Matching Engine

Matching is merit-based with tier-aware visibility:

### Scoring Weights
- Professional preference (love: 30, like: 20, neutral: 10, avoid: -50)
- Activity (completed jobs × 2, avg rating × 5)
- Verification level (expert: 50, verified: 30, progressing: 10)
- Live listing bonus: +25 points

### Filters
- Micro-service alignment via `job_micro_links` junction table
- Location-aware via `service_zones`
- Budget-aware via `min_budget_eur`

---

## 12. Key Database Tables

| Table | Purpose |
|---|---|
| `jobs` | Core project data (ProblemCards) |
| `professional_profiles` | Tasker profiles |
| `service_listings` | Published professional offerings |
| `service_pricing_items` | Structured pricing per listing |
| `conversations` / `messages` | In-platform messaging |
| `job_reviews` | Post-job ratings |
| `disputes` | 28-day resolution records |
| `user_roles` | Role assignments (separate from profiles) |
| `subscriptions` | Tier + commission data |
| `job_status_history` | Audit trail for all status changes |
| `daily_platform_metrics` | Admin analytics |

93+ migrations define the full schema history.

---

## 13. What Is Live Now

✅ Job posting wizard (7-step structured input)  
✅ Job board with category/area filtering  
✅ Professional onboarding (3-step activation flow)  
✅ Matching system (micro-service + location + budget)  
✅ In-platform messaging (linked to jobs)  
✅ Quote system (structured: labour + materials + costs)  
✅ Review and rating system  
✅ Dispute resolution flow (28-day structured)  
✅ Admin dashboard with platform metrics  
✅ Forum (public read, auth write)  
✅ i18n (English / Spanish)  
✅ Service marketplace & listings  
✅ Role switching (client ↔ professional)  
✅ Subscription tier system (entitlements defined, Stripe not live)

---

## 14. What Is Not Yet Live

🔒 Payment protection / milestone payments  
🔒 Stripe checkout integration  
🔒 WhatsApp notification bridge  
🔒 Public professional directory (rollout-gated)  
🔒 AI-assisted job scoping  
🔒 Worker reputation scoring with trust metrics  
🔒 Mobile-optimised experience polish  
🔒 E2E test suite (Playwright)

---

## 15. Design Principles

1. **Clarity over flexibility** — structured inputs, not free-text chaos
2. **Structure over ambiguity** — every job is a defined ProblemCard
3. **Trust over volume** — fewer, better matches beat lead spam
4. **Prevention over cure** — clear scope prevents disputes
5. **System enforcement over manual discipline** — DB enforces, frontend guides
6. **Database is source of truth** — critical logic lives in SQL, not components
7. **Async must not block** — translations, notifications, images fail safely
8. **Atomic over chained** — single RPCs, not multi-step frontend flows

---

## 16. Prohibited Patterns

- ❌ "Escrow" or "fund holding" language (legal risk)
- ❌ Frontend-only critical validation
- ❌ Foreign keys to `auth.users`
- ❌ Roles on profile/users table
- ❌ Anonymous signups
- ❌ Raw tier checks (`tier === 'gold'`)
- ❌ Lifestyle, concierge, or general freelance services
- ❌ Admin tools outside `/dashboard/admin/*` route group
- ❌ Silent error swallowing for critical actions
- ❌ `ready` as a persisted job status (UI-only concept)

---

## 17. Current Technical Debt & Known Gaps

| Item | Severity | Notes |
|---|---|---|
| No E2E tests | Medium | Playwright setup needed |
| App.tsx still large | Low | Admin routes extracted; further splitting possible |
| Chunk reload guard is string-fragile | Low | TTL added, but browser message variance remains |
| Monitor assumes table contract | Low | Dev-only debug logging added |
| Some ranking labels not rendered in all views | Low | Known UI gap |
| Stripe checkout not live | Planned | `STRIPE_CHECKOUT_LIVE = false` |

---

*This document is the authoritative T=0 snapshot. Update when architecture changes materially.*
