# Architecture Guide

> Domain-first architecture for Constructive Solutions Ibiza

## Folder Map

| Path | Purpose |
|------|---------|
| `src/features/` | Domain modules (wizard, search) |
| `src/pages/` | Route pages, organized by domain |
| `src/shared/` | Cross-domain components & utilities |
| `src/components/ui/` | shadcn primitives ONLY |
| `src/guard/` | Route protection & access control |
| `src/domain/` | Platform identity & scope |
| `src/core/` | Platform fundamentals (future expansion) |

---

## Role Model

| Role | Dashboard | Key Routes |
|------|-----------|------------|
| Client | `/dashboard/client` | `/post`, `/jobs`, `/messages` |
| Professional | `/dashboard/pro` | `/professional/*`, `/jobs`, `/messages` |
| Admin | (future) | `/admin/*` |

### Role Switching

Users can hold multiple roles (e.g., client + professional). The `active_role` field in `user_roles` table determines current context. `RoleSwitcher` component in `src/shared/components/layout/` handles UI toggling.

---

## Domain Structure

### Feature Modules (`src/features/`)

```
src/features/
├── wizard/                  # Job creation wizard
│   ├── canonical/           # Main wizard component
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── steps/
│   │   └── types.ts
│   ├── db-powered/          # Category/subcategory selectors
│   └── lib/
│       ├── wizardLink.ts    # URL builder
│       └── evaluatePackRules.ts
└── search/                  # Universal search
    └── lib/
        └── searchSynonyms.ts
```

### Dashboard Structure (`src/pages/dashboard/`)

```
src/pages/dashboard/
├── client/                  # Client-specific
│   ├── ClientDashboard.tsx
│   ├── components/
│   └── hooks/
├── professional/            # Professional-specific
│   ├── ProDashboard.tsx
│   └── hooks/
└── shared/                  # Shared across roles
    ├── components/
    └── hooks/
```

### Shared Components (`src/shared/components/`)

```
src/shared/components/
├── layout/                  # Layout blocks (HeroBanner, PublicNav, etc.)
├── EmptyState.tsx           # Standardized empty state
└── StatTile.tsx             # Dashboard stat cards
```

---

## Data Flow

```
Route → Page → hooks (queries/mutations) → Supabase
                 ↓
              actions/ (write operations)
              queries/ (read operations)
```

### Query/Action Pattern

Each domain in `src/pages/` follows:

```
src/pages/jobs/
├── actions/               # Write operations
│   ├── completeJob.action.ts
│   ├── submitReview.action.ts
│   └── index.ts
├── queries/               # Read operations
│   ├── jobBoard.query.ts
│   ├── jobDetails.query.ts
│   └── keys.ts
├── components/            # Domain-specific UI
├── lib/                   # Pure logic
└── types.ts
```

---

## Key Journeys

### 1. Client Posts Job

```
/post → wizard (7 steps) → jobs table → /dashboard/client
```

The wizard resolves its mode from URL parameters via `resolveWizardMode()`. Never mutate wizard state directly from external components.

### 2. Professional Matches Job

```
/dashboard/pro → matched_jobs_for_professional view → message → /messages
```

Matching is based on `professional_services` table linking pros to micro-categories.

### 3. Search to Wizard

```
UniversalSearchBar → buildWizardUrlFromHit() → /post?... → resolveWizardMode()
```

The "Smart Ladder" ensures search hits always land on a valid wizard state.

---

## Guard System

Located in `src/guard/`:

| Guard | Purpose |
|-------|---------|
| `RouteGuard` | Protects authenticated routes |
| `PublicOnlyGuard` | Redirects logged-in users (e.g., /auth) |
| `proReadiness` | Checks professional can receive jobs |

### Access Rules

Defined in `src/app/routes/registry.ts`. Each route declares:
- `access`: required auth level (`public`, `auth`, `role:client`, etc.)
- `lane`: mental mode (`hiring`, `working`, `discovery`)

---

## Import Conventions

### Correct

```typescript
// Features
import { CanonicalJobWizard } from '@/features/wizard/canonical/CanonicalJobWizard';
import { buildWizardLink } from '@/features/wizard/lib/wizardLink';

// Shared layout
import { PublicLayout, HeroBanner } from '@/shared/components/layout';
import { EmptyState } from '@/shared/components/EmptyState';

// shadcn primitives
import { Button } from '@/components/ui/button';

// Domain queries/actions
import { useJobsBoard } from '@/pages/jobs/queries';
import { completeJob } from '@/pages/jobs/actions';
```

### Avoid

```typescript
// ❌ Don't use deprecated paths
import { PublicLayout } from '@/components/layout';  // Use @/shared/components/layout

// ❌ Don't import Supabase directly in UI components
import { supabase } from '@/integrations/supabase/client';  // Use domain hooks/actions
```

---

## "New Dev Test"

Can you answer these in under 60 seconds?

**Q: "Where do I edit the Client sign-up and role switch?"**
A: `src/guard/` for logic, `src/shared/components/layout/RoleSwitcher.tsx` for UI

**Q: "Where is the Worker onboarding flow?"**
A: `src/pages/onboarding/` for pages, `src/features/wizard/db-powered/` for service selection

**Q: "Where do I add a new job action?"**
A: `src/pages/jobs/actions/` - create `myAction.action.ts` and export from `index.ts`

**Q: "Where do I change an Admin action?"**
A: `src/pages/admin/` (future) or `src/pages/jobs/actions/` for job-related admin actions

---

## i18n

- Namespace files: `public/locales/{en,es}/*.json`
- Core namespaces: `common`, `auth`, `dashboard`, `wizard`, `jobs`
- Category translations: `src/i18n/categoryTranslations.ts`

---

## Security

- RLS enabled on all tables
- `user_id` columns reference `auth.users`
- Views (`jobs_board`, `matched_jobs_for_professional`) handle filtered access
- Never expose raw `auth.users` data - use `profiles` table
