
# Codebase Restructuring Plan: Domain-First Architecture

## Overview

Transform the current structure into a **domain-first architecture** that makes role separation, business logic ownership, and navigation instantly clear for any developer.

**Target Score: 9/10** (up from current 6.5/10)

---

## Current State Analysis

```text
src/
├── components/
│   ├── layout/       ← 10 files, app-level blocks mixed with navigation
│   ├── ui/           ← 50+ files, shadcn primitives + custom (empty-state, stat-tile)
│   └── wizard/       ← DOMAIN (canonical + db-powered), wrong location
├── pages/
│   ├── dashboard/    ← client + pro MIXED in same folder
│   ├── jobs/         ← GOLD STANDARD (actions/queries/lib/types)
│   ├── professional/ ← Pro management pages
│   └── ...
├── lib/
│   ├── services/     ← categoryMapping (orphaned)
│   ├── wizardLink.ts ← wizard-owned, wrong location
│   ├── evaluatePackRules.ts ← jobs-owned, wrong location
│   └── searchSynonyms.ts    ← search-owned
└── shared/
    └── lib/userError.ts  ← underutilized
```

### Key Issues

1. **Wizard lives in `components/`** — It's a full domain with state, persistence, and rules
2. **Dashboard roles mixed** — `ClientDashboard.tsx` and `ProDashboard.tsx` side-by-side
3. **Domain logic scattered in `lib/`** — `wizardLink.ts`, `evaluatePackRules.ts` should live with their domains
4. **Shared components unclear** — `PageHeader`, `StatTile`, `EmptyState` are app blocks, not UI primitives
5. **No `features/` folder** — Domain modules have no dedicated home

---

## Target State

```text
src/
├── features/
│   ├── wizard/           ← MOVED from components/wizard
│   │   ├── canonical/
│   │   ├── db-powered/
│   │   ├── lib/
│   │   │   ├── wizardLink.ts      ← MOVED from lib/
│   │   │   ├── evaluatePackRules.ts ← MOVED from lib/
│   │   │   └── ...
│   │   └── index.ts
│   └── search/           ← NEW, search domain
│       └── lib/
│           └── searchSynonyms.ts  ← MOVED from lib/
│
├── pages/
│   ├── dashboard/
│   │   ├── client/       ← NEW subfolder
│   │   │   ├── ClientDashboard.tsx
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── professional/ ← NEW subfolder
│   │   │   ├── ProDashboard.tsx
│   │   │   └── hooks/
│   │   └── shared/       ← NEW subfolder
│   │       └── components/
│   └── jobs/             ← Already good, minor cleanup
│
├── shared/
│   ├── components/
│   │   ├── layout/       ← MOVED from components/layout
│   │   ├── EmptyState.tsx ← MOVED from components/ui/empty-state.tsx
│   │   └── StatTile.tsx   ← MOVED from components/ui/stat-tile.tsx
│   └── lib/
│       └── userError.ts
│
├── components/
│   └── ui/               ← shadcn primitives ONLY
│
├── core/                 ← NEW, platform fundamentals
│   ├── permissions/
│   └── constants/
│
└── lib/
    ├── utils.ts          ← Keep (cn, formatters)
    ├── formatters.ts
    └── i18n-utils.ts
```

---

## Phase 1: Create Features Folder + Move Wizard (High Impact)

### Step 1.1: Create `src/features/wizard/`

Create the new folder structure:

```text
src/features/
└── wizard/
    ├── canonical/
    │   ├── hooks/
    │   ├── lib/
    │   ├── steps/
    │   ├── CanonicalJobWizard.tsx
    │   ├── index.ts
    │   └── types.ts
    ├── db-powered/
    │   ├── CategorySelector.tsx
    │   ├── SubcategorySelector.tsx
    │   ├── MicroStep.tsx
    │   ├── ServiceSearchBar.tsx
    │   └── index.ts
    ├── lib/
    │   ├── wizardLink.ts         ← Move from src/lib/
    │   └── evaluatePackRules.ts  ← Move from src/lib/
    └── index.ts
```

### Step 1.2: File Moves for Wizard

| From | To |
|------|-----|
| `src/components/wizard/canonical/*` | `src/features/wizard/canonical/*` |
| `src/components/wizard/db-powered/*` | `src/features/wizard/db-powered/*` |
| `src/lib/wizardLink.ts` | `src/features/wizard/lib/wizardLink.ts` |
| `src/lib/evaluatePackRules.ts` | `src/features/wizard/lib/evaluatePackRules.ts` |

### Step 1.3: Create Re-export Stub (Prevents Import Churn)

Keep `src/components/wizard/index.ts` as a re-export:

```typescript
// DEPRECATED: Import from @/features/wizard instead
export * from '@/features/wizard';
```

### Step 1.4: Update Imports (4 files)

| File | Change |
|------|--------|
| `src/pages/jobs/PostJob.tsx` | `@/components/wizard/canonical` → `@/features/wizard/canonical` |
| `src/pages/professional/ProfessionalServiceSetup.tsx` | `@/components/wizard/db-powered` → `@/features/wizard/db-powered` |
| `src/pages/public/ServiceCategory.tsx` | `@/lib/wizardLink` → `@/features/wizard/lib/wizardLink` |
| `src/pages/public/Professionals.tsx` | `@/lib/wizardLink` → `@/features/wizard/lib/wizardLink` |
| `src/pages/public/ProfessionalDetails.tsx` | `@/lib/wizardLink` → `@/features/wizard/lib/wizardLink` |

---

## Phase 2: Split Dashboard by Role

### Step 2.1: Create Role Subfolders

```text
src/pages/dashboard/
├── client/
│   ├── ClientDashboard.tsx
│   ├── components/
│   │   └── ClientJobCard.tsx
│   ├── hooks/
│   │   ├── useClientStats.ts
│   │   └── index.ts
│   └── index.ts
├── professional/
│   ├── ProDashboard.tsx
│   ├── hooks/
│   │   ├── useProStats.ts
│   │   └── index.ts
│   └── index.ts
└── shared/
    ├── components/
    │   ├── AssignProSelector.tsx
    │   ├── PendingReviewsCard.tsx
    │   └── index.ts
    └── hooks/
        ├── usePendingReviews.ts
        └── index.ts
```

### Step 2.2: File Moves for Dashboard

| From | To |
|------|-----|
| `src/pages/dashboard/ClientDashboard.tsx` | `src/pages/dashboard/client/ClientDashboard.tsx` |
| `src/pages/dashboard/ProDashboard.tsx` | `src/pages/dashboard/professional/ProDashboard.tsx` |
| `src/pages/dashboard/components/ClientJobCard.tsx` | `src/pages/dashboard/client/components/ClientJobCard.tsx` |
| `src/pages/dashboard/hooks/useClientStats.ts` | `src/pages/dashboard/client/hooks/useClientStats.ts` |
| `src/pages/dashboard/hooks/useProStats.ts` | `src/pages/dashboard/professional/hooks/useProStats.ts` |
| `src/pages/dashboard/components/AssignProSelector.tsx` | `src/pages/dashboard/shared/components/AssignProSelector.tsx` |
| `src/pages/dashboard/components/PendingReviewsCard.tsx` | `src/pages/dashboard/shared/components/PendingReviewsCard.tsx` |
| `src/pages/dashboard/hooks/usePendingReviews.ts` | `src/pages/dashboard/shared/hooks/usePendingReviews.ts` |

### Step 2.3: Update App.tsx Imports

```typescript
// Before
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import ProDashboard from "./pages/dashboard/ProDashboard";

// After
import ClientDashboard from "./pages/dashboard/client/ClientDashboard";
import ProDashboard from "./pages/dashboard/professional/ProDashboard";
```

---

## Phase 3: Organize Shared Components

### Step 3.1: Create `src/shared/components/`

```text
src/shared/
├── components/
│   ├── layout/
│   │   ├── HeroBanner.tsx
│   │   ├── LaneHeader.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── MobileNav.tsx
│   │   ├── PageHeader.tsx
│   │   ├── PublicFooter.tsx
│   │   ├── PublicLayout.tsx
│   │   ├── PublicNav.tsx
│   │   ├── RoleSwitcher.tsx
│   │   ├── ScrollToTop.tsx
│   │   └── index.ts
│   ├── EmptyState.tsx
│   ├── StatTile.tsx
│   └── index.ts
└── lib/
    └── userError.ts
```

### Step 3.2: File Moves for Shared

| From | To |
|------|-----|
| `src/components/layout/*` | `src/shared/components/layout/*` |
| `src/components/ui/empty-state.tsx` | `src/shared/components/EmptyState.tsx` |
| `src/components/ui/stat-tile.tsx` | `src/shared/components/StatTile.tsx` |

### Step 3.3: Update Imports (12+ files)

All files importing from `@/components/layout` will change to `@/shared/components/layout`.

| Pattern | New Path |
|---------|----------|
| `@/components/layout` | `@/shared/components/layout` |
| `@/components/ui/empty-state` | `@/shared/components/EmptyState` |
| `@/components/ui/stat-tile` | `@/shared/components/StatTile` |

---

## Phase 4: Create Search Feature + Clean lib/

### Step 4.1: Create `src/features/search/`

```text
src/features/search/
├── lib/
│   └── searchSynonyms.ts  ← Move from src/lib/
└── index.ts
```

### Step 4.2: Clean Up lib/

After moves, `src/lib/` will contain only utilities:

```text
src/lib/
├── utils.ts           ← Keep (cn function)
├── formatters.ts      ← Keep
├── formatMessageTime.ts ← Keep
├── i18n-utils.ts      ← Keep
└── services/          ← DELETE (empty after categoryMapping audit)
```

**Note:** `categoryMapping.ts` has no imports — verify if it's unused and can be deleted, or move to `features/wizard/lib/` if needed.

---

## Phase 5: Create Core Module

### Step 5.1: Create `src/core/`

```text
src/core/
├── permissions/
│   └── roles.ts       ← Role types, can move from guard/access.ts later
├── constants/
│   └── platform.ts    ← Could move PLATFORM from domain/scope.ts
└── index.ts
```

This is a **future-ready** structure. For now, keep `src/domain/scope.ts` and `src/guard/` in place — they work well.

---

## Phase 6: Documentation

### Step 6.1: Create `docs/ARCHITECTURE.md`

```markdown
# Architecture Guide

## Folder Map

| Path | Purpose |
|------|---------|
| `src/features/` | Domain modules (wizard, search) |
| `src/pages/` | Route pages, organized by domain |
| `src/shared/` | Cross-domain components & utilities |
| `src/components/ui/` | shadcn primitives only |
| `src/guard/` | Route protection & access control |
| `src/domain/` | Platform identity & scope |

## Role Model

| Role | Dashboard | Key Routes |
|------|-----------|------------|
| Client | `/dashboard/client` | `/post`, `/jobs`, `/messages` |
| Professional | `/dashboard/pro` | `/professional/*`, `/jobs`, `/messages` |
| Admin | (future) | `/admin/*` |

## Data Flow

Route → Page → hooks (queries/mutations) → Supabase
                 ↓
              actions/ (write operations)
              queries/ (read operations)

## Key Journeys

1. Client posts job: `/post` → wizard → jobs table → `/dashboard/client`
2. Pro matches job: `/dashboard/pro` → matched_jobs view → message → `/messages`
```

---

## Implementation Sequence

Execute in this order to minimize breakage:

| Step | Risk | Files Affected | Est. Time |
|------|------|----------------|-----------|
| Phase 1: Wizard to features | Low | ~15 files | 30 min |
| Phase 2: Dashboard split | Low | ~10 files | 20 min |
| Phase 3: Shared components | Medium | ~15 files | 30 min |
| Phase 4: Search + lib cleanup | Low | ~5 files | 15 min |
| Phase 5: Core module | Low | New files only | 10 min |
| Phase 6: Documentation | None | 2 new files | 15 min |

**Total: ~2 hours**

---

## Verification Checklist

After restructuring, verify:

- [ ] `npm run build` passes
- [ ] `/post` wizard loads and functions
- [ ] `/dashboard/client` and `/dashboard/pro` load correctly
- [ ] All layout components render (HeroBanner, PageHeader, etc.)
- [ ] Import paths use new structure (no `../../../` chains)

---

## "New Dev Test" After Restructuring

**Q: "Where do I edit the Client sign-up and role switch?"**
A: `src/guard/` for logic, `src/shared/components/layout/RoleSwitcher.tsx` for UI

**Q: "Where is the Worker onboarding flow?"**
A: `src/pages/onboarding/` for pages, `src/features/wizard/db-powered/` for service selection

**Q: "Where do I change an Admin action?"**
A: `src/pages/admin/` (future) or `src/pages/jobs/actions/` for job-related admin actions

All answers now take less than 60 seconds to find.
