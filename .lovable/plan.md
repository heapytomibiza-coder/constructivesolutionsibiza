
# Two Lanes → One Hub Navigation Architecture

## Overview

Transform the route registry and navigation system to clearly separate **Hiring** (Client) and **Working** (Professional) pathways while showing where they **meet** in a **Shared Hub** (Messages, Settings, Community). This creates visual clarity without adding borders - just clear mental models.

---

## Current State Analysis

| Component | Issue |
|-----------|-------|
| `rules.ts` | Only has `AccessRule`, no concept of "lane" or "pathway" |
| `registry.ts` | Routes grouped by access, not by user journey |
| `match.ts` | Basic path matching, no lane helpers |
| `PublicNav.tsx` | Hardcoded links, no role-aware sections |
| `MobileNav.tsx` | Hardcoded links, no section headings |
| `RoleSwitcher.tsx` | Uses hardcoded labels ("Client"/"Professional") instead of i18n |

---

## Solution Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     PUBLIC DISCOVERY                         │
│      Home • Services • Jobs • Professionals • How it Works  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       PATHWAY FORK                          │
│                 (Intent Selector at Auth)                   │
│                                                             │
│    ┌─────────────────┐           ┌─────────────────┐       │
│    │   HIRING LANE   │           │  WORKING LANE   │       │
│    │    (Client)     │           │ (Professional)  │       │
│    │                 │           │                 │       │
│    │  • Post a Job   │           │  • Dashboard    │       │
│    │  • My Dashboard │           │  • Job Feed     │       │
│    └────────┬────────┘           └────────┬────────┘       │
│             │                             │                 │
│             └──────────────┬──────────────┘                 │
│                            ▼                                │
│    ┌─────────────────────────────────────────────────────┐ │
│    │                   SHARED HUB                         │ │
│    │                                                      │ │
│    │  Messages • Settings • Community • Profile           │ │
│    │                                                      │ │
│    │  (Same systems, role-aware content)                  │ │
│    └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/app/routes/rules.ts` | **Modify** | Add `RouteLane` and `NavSection` types |
| `src/app/routes/registry.ts` | **Modify** | Add `lane` and `nav` metadata to routes |
| `src/app/routes/match.ts` | **Modify** | Add `getLaneForPath()` and `getNavRoutes()` helpers |
| `src/app/routes/index.ts` | **Modify** | Export new types and helpers |
| `src/components/layout/LaneHeader.tsx` | **Create** | Mode indicator pill for key pages |
| `src/components/layout/MobileNav.tsx` | **Modify** | Section-based menu with headings |
| `src/components/layout/RoleSwitcher.tsx` | **Modify** | Use i18n for labels |
| `public/locales/en/common.json` | **Modify** | Add lane/section translation keys |
| `public/locales/es/common.json` | **Modify** | Add Spanish lane/section translations |

---

## Implementation Details

### 1. Update Route Types (`rules.ts`)

Add lane and navigation metadata types without changing existing access rules:

```typescript
// NEW: Visual pathway map
export type RouteLane = 'public' | 'auth' | 'client' | 'professional' | 'shared';

// NEW: Navigation sections for grouped menus
export type NavSection = 'public' | 'hiring' | 'working' | 'shared' | 'account';

export interface RouteConfig {
  path: string;
  access: AccessRule;
  redirectTo?: string;
  
  // NEW: Pathway mapping
  lane?: RouteLane;
  
  // NEW: Optional nav metadata (if present, route appears in auto-generated nav)
  nav?: {
    section: NavSection;
    labelKey: string;     // i18n key (e.g., 'nav.postJob')
    order?: number;       // Sort order within section
  };
}
```

### 2. Annotate Routes with Lanes (`registry.ts`)

Add `lane` and `nav` properties to key routes:

```typescript
// Public discovery
{ path: '/', access: 'public', lane: 'public', nav: { section: 'public', labelKey: 'nav.home', order: 1 } },
{ path: '/services', access: 'public', lane: 'public', nav: { section: 'public', labelKey: 'nav.services', order: 2 } },

// Hiring lane
{ path: '/post', access: 'public', lane: 'client', nav: { section: 'hiring', labelKey: 'nav.postJob', order: 1 } },
{ path: '/dashboard/client', access: 'role:client', lane: 'client', nav: { section: 'hiring', labelKey: 'nav.dashboard', order: 2 } },

// Working lane  
{ path: '/dashboard/pro', access: 'role:professional', lane: 'professional', nav: { section: 'working', labelKey: 'nav.dashboard', order: 1 } },

// Shared hub
{ path: '/messages', access: 'auth', lane: 'shared', nav: { section: 'shared', labelKey: 'nav.messages', order: 1 } },
{ path: '/settings', access: 'auth', lane: 'shared', nav: { section: 'account', labelKey: 'nav.settings', order: 99 } },
{ path: '/forum', access: 'public', lane: 'public', nav: { section: 'shared', labelKey: 'nav.community', order: 50 } },
```

### 3. Add Route Helpers (`match.ts`)

```typescript
// Cache for compiled regexes
const regexCache = new Map<string, RegExp>();

// Get current lane for any path
export function getLaneForPath(path: string): RouteLane {
  return getRouteConfig(path)?.lane ?? 'public';
}

// Get all nav-enabled routes (for auto-building menus)
export function getNavRoutes(): RouteConfig[] {
  return allRoutes
    .filter((r) => r.nav)
    .sort((a, b) => (a.nav!.order ?? 999) - (b.nav!.order ?? 999));
}
```

### 4. Create LaneHeader Component

A small persistent cue showing which mode the user is in:

```tsx
// src/components/layout/LaneHeader.tsx
export function LaneHeader() {
  const { activeRole } = useSession();
  const { t } = useTranslation();
  
  const isHiring = activeRole === 'client';
  const label = isHiring ? t('lanes.hiring') : t('lanes.working');
  
  return (
    <div className="bg-muted/50 py-1.5 border-b border-border/50">
      <div className="container flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <RoleSwitcher className="h-7 text-xs" />
      </div>
    </div>
  );
}
```

### 5. Update MobileNav with Section Headings

Transform flat link list into grouped sections:

```tsx
// Section headings make pathways clear
<p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
  {t('lanes.hiring')}
</p>
{/* Post Job, Client Dashboard */}

<p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
  {t('lanes.working')}
</p>
{/* Pro Dashboard */}

<p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
  {t('lanes.shared')}
</p>
{/* Messages, Community, Settings */}
```

### 6. Internationalize RoleSwitcher

Replace hardcoded labels with i18n:

```typescript
const roleLabels: Record<UserRole, string> = {
  client: t('roles.client'),        // "Hiring" / "Contratando"
  professional: t('roles.professional'), // "Working" / "Trabajando"
  admin: t('roles.admin'),
};
```

### 7. Add Translation Keys

**English (`en/common.json`):**
```json
{
  "nav": {
    "home": "Home",
    "settings": "Settings"
  },
  "lanes": {
    "hiring": "Hiring Mode",
    "working": "Working Mode",
    "shared": "Shared"
  },
  "roles": {
    "client": "Hiring",
    "professional": "Working",
    "admin": "Admin"
  }
}
```

**Spanish (`es/common.json`):**
```json
{
  "nav": {
    "home": "Inicio",
    "settings": "Ajustes"
  },
  "lanes": {
    "hiring": "Modo Contratación",
    "working": "Modo Trabajo",
    "shared": "Compartido"
  },
  "roles": {
    "client": "Contratando",
    "professional": "Trabajando",
    "admin": "Admin"
  }
}
```

---

## Navigation Rendering Logic

### Desktop Nav (PublicNav)

| Condition | Links Shown |
|-----------|-------------|
| Not authenticated | Public links + Sign In + Post Job |
| Authenticated as Client only | Public + Hiring section + Shared |
| Authenticated as Pro only | Public + Working section + Shared |
| Authenticated with both roles | Public + Active lane section + Shared + RoleSwitcher |

### Mobile Nav (MobileNav)

Render sections with headings based on user roles:

```text
DISCOVER
  Home
  Services
  Jobs
  Professionals
  How it Works

─────────────────────

HIRING              ← Only if has client role
  Post a Job
  Dashboard

WORKING             ← Only if has professional role
  Pro Dashboard

─────────────────────

SHARED
  Messages
  Community
  Settings

─────────────────────

Sign out
```

---

## Key Benefits

| Benefit | How Achieved |
|---------|--------------|
| **Clear pathways** | Lane metadata on routes + section headings in nav |
| **Obvious convergence** | Shared section clearly labeled |
| **No extra borders** | Spacing + headings, not lines |
| **Role-aware UI** | Navigation adapts to user's roles |
| **Maintainable** | Routes auto-derive nav from registry |
| **i18n ready** | All labels use translation keys |

---

## Testing Checklist

1. **Public visitor**: Sees public links only, no lane sections
2. **Client only**: Sees Hiring section + Shared section
3. **Professional only**: Sees Working section + Shared section
4. **Dual-role user**: Sees RoleSwitcher, active lane section changes with role
5. **Mobile menu**: Section headings render correctly
6. **Language switch**: All lane labels translate properly
7. **LaneHeader**: Shows correct mode on dashboard pages
