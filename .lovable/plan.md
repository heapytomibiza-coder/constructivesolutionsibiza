

## Plan: Clean Navigation-Hub Dashboards

Both dashboards (Client + Tasker) will be redesigned as **clean menu screens** — no stats, no job feeds, no data on the first screen. Just clear action tiles with titles, hints, and icons. Each tile leads to its own focused page.

### Design Philosophy
- First screen = **navigation hub**, not information dump
- Every tile has: **icon + clear title + one-line hint**
- No stats, no graphs, no job cards on landing
- Sections grouped logically (Work, Communication, Account)
- Guidance text only where needed
- Unread message banner stays (it's actionable, not informational)

### Client (Asker) Dashboard

Remove the 4 stat cards and job list from the landing page. Replace with grouped action tiles:

```text
Welcome back

YOUR JOBS
┌─────────────────────────┐  ┌─────────────────────────┐
│ + Post a Job            │  │ 📋 My Jobs              │
│   Describe what you     │  │   Track progress and    │
│   need done             │  │   quotes                │
└─────────────────────────┘  └─────────────────────────┘

COMMUNICATION
┌─────────────────────────┐  ┌─────────────────────────┐
│ 💬 Messages             │  │ 🗣 Community Forum      │
│   Chat with Taskers     │  │   Ask questions, get    │
│                         │  │   recommendations       │
└─────────────────────────┘  └─────────────────────────┘

ACCOUNT
┌─────────────────────────┐
│ ⚙ Settings              │
│   Account & preferences │
└─────────────────────────┘
```

- Unread messages banner remains at top (contextual, actionable)
- Badge on Messages tile if unread count > 0

### Tasker (Pro) Dashboard

Remove stats row, matched jobs card, and profile status. Replace with grouped action tiles:

```text
Welcome back

MY WORK
┌─────────────────────────┐  ┌─────────────────────────┐
│ ✅ Edit My Services     │  │ 🏪 My Public Ads        │
│   Add or remove the     │  │   What clients see      │
│   jobs you accept       │  │   when browsing         │
└─────────────────────────┘  └─────────────────────────┘
┌─────────────────────────┐  ┌─────────────────────────┐
│ 💼 Browse Jobs          │  │ ⭐ Job Priorities       │
│   Find work that        │  │   Get more of the work  │
│   matches your skills   │  │   you want              │
└─────────────────────────┘  └─────────────────────────┘

COMMUNICATION
┌─────────────────────────┐  ┌─────────────────────────┐
│ 💬 Messages             │  │ 🗣 Community Forum      │
│   Chat with Askers      │  │   Ask questions, get    │
│                         │  │   recommendations       │
└─────────────────────────┘  └─────────────────────────┘

PROFILE & ACCOUNT
┌─────────────────────────┐  ┌─────────────────────────┐
│ 👤 Edit Profile         │  │ ⚙ Settings              │
│   Update your Tasker    │  │   Account & preferences │
│   profile               │  │                         │
└─────────────────────────┘  └─────────────────────────┘
```

- Services-first guidance card stays if `servicesCount === 0` (it's onboarding, not data)
- Unread badge on Messages tile

### Files to modify
1. **`src/pages/dashboard/professional/ProDashboard.tsx`** — strip stats row, matched jobs card, profile status; replace with grouped `QuickActionTile` sections
2. **`src/pages/dashboard/client/ClientDashboard.tsx`** — strip stat cards, job list, desktop quick actions card; replace with grouped tile sections
3. **`src/pages/dashboard/shared/components/QuickActionTile.tsx`** — add optional `badge` prop for unread count
4. **`public/locales/en/dashboard.json`** + **`public/locales/es/dashboard.json`** — add section headers and new hint text

### What stays
- Top nav bar (logo, role switcher, settings, sign out)
- Welcome header with email
- Unread messages banner (client)
- Services-first onboarding card (tasker, only when no services)

### What gets removed from first screen
- All stat number cards
- All job lists / matched jobs
- Profile status checklist
- PendingReviewsCard (move to a sub-page later)

Jobs, stats, and matched jobs remain accessible — they just live on their own pages (`/jobs`, `/messages`, etc.) where users navigate to them intentionally.

