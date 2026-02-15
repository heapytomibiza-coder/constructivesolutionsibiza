
# Phase 5: Entity Detail Drawers

## Overview

Add right-side Sheet drawers for Jobs and Users that open from any table row click across the admin panel. This eliminates tab-hopping and creates the "canvas" where future Phases 6 (alerts) and 7 (funnels) will land.

## Architecture

### Drawer Provider Pattern

A single `AdminDrawerProvider` wraps the admin dashboard. Any table row in any tab/page calls `openDrawer({ type, id })` to open the relevant drawer. Drawers fetch their own data by ID -- no fat objects passed around.

```text
AdminDashboard
  +-- AdminDrawerProvider (context)
       +-- Tabs / TabsContent...
       +-- JobDetailDrawer (renders when type === 'job')
       +-- UserDetailDrawer (renders when type === 'user')
```

### New Files

| File | Purpose |
|------|---------|
| `src/pages/admin/context/AdminDrawerContext.tsx` | Provider + `useAdminDrawer()` hook |
| `src/pages/admin/components/JobDetailDrawer.tsx` | Job detail Sheet with summary, client, convos, timeline, admin actions |
| `src/pages/admin/components/UserDetailDrawer.tsx` | User/Pro detail Sheet with profile, activity counts, admin actions |
| `src/pages/admin/queries/adminJobDetails.query.ts` | Query hook fetching job + related data |
| `src/pages/admin/queries/adminUserDetails.query.ts` | Query hook fetching user + pro profile + activity counts |

### Modified Files

| File | Change |
|------|--------|
| `AdminDashboard.tsx` | Wrap content in `AdminDrawerProvider` |
| `JobsSection.tsx` | Add row click -> `openDrawer({ type: 'job', id })` |
| `UsersSection.tsx` | Add row click -> `openDrawer({ type: 'user', id })` |
| `SupportInbox.tsx` | Add row click -> open job or user drawer from ticket context |
| `MetricInsightPage.tsx` | Wire `onRowClick` on DrilldownTable for job/user metrics |
| `UnansweredJobsPage.tsx` | Wire row click on job tables |
| `src/pages/admin/queries/keys.ts` | Add `jobDetail` and `userDetail` key factories |

## Drawer Contents

### JobDetailDrawer

- **Header**: Title, status badge, safety badge, flags
- **Summary grid**: Category/subcategory, area, budget, timing, created date
- **Client row**: Display name + phone (clickable -- opens UserDrawer via cross-link)
- **Assigned Pro row**: If assigned, display name (clickable -- opens UserDrawer)
- **Conversations**: Count + list of conversation previews (last message, pro name)
- **Status Timeline**: From `job_status_history` table (ordered, with timestamps)
- **Admin Actions footer**: Force Complete, Archive, Copy WhatsApp, Open Public Page -- reusing existing action functions

### UserDetailDrawer

- **Header**: Display name, phone, role badges, joined date
- **Activity counts**: Jobs posted, conversations, support tickets
- **Pro section** (if professional role): Verification status, onboarding phase, services count, is_listed status, service zones
- **Admin Actions footer**: Verify/Reject Pro, Suspend/Unsuspend -- reusing existing action functions
- Cross-link: "View their jobs" opens Jobs tab filtered

## Data Fetching

### Job Details Query

Uses existing Supabase client queries (no new RPC needed for V1):
- `jobs` table for the job record (admin can SELECT all via RLS)
- `profiles` table for client display_name (admin can SELECT all)
- `professional_profiles` for assigned pro info
- `conversations` filtered by job_id (admin needs a SELECT policy -- already covered by view)
- `job_status_history` filtered by job_id (admin SELECT policy exists)

### User Details Query

- `profiles` table for basic info
- `user_roles` for roles
- `professional_profiles` if professional
- Count queries: jobs where user_id = X, conversations where client_id or pro_id = X, support_requests where created_by_user_id = X

## Wiring Summary

Every admin table row becomes clickable:

- **JobsSection**: Row click calls `openDrawer({ type: 'job', id: job.id })`. Action buttons stay in the actions column for quick access; drawer provides full context.
- **UsersSection**: Row click (on the row, not the dropdown) calls `openDrawer({ type: 'user', id: user.id })`. Dropdown menu stays for quick actions.
- **SupportInbox**: Row click opens `openDrawer({ type: 'job', id: ticket.job_id })` if job exists, otherwise no-op.
- **MetricInsightPage**: Pass `onRowClick` to DrilldownTable. For job-based metrics (jobs_posted, open_jobs, completed_jobs, active_jobs), open job drawer. For user-based metrics (new_users, new_pros), open user drawer.
- **UnansweredJobsPage**: Row click opens job drawer.

## UI Specifications

- Uses existing `Sheet` component (right side, `sm:max-w-lg` width)
- Skeleton loading state while data fetches
- Sticky header with entity name + close button
- Scrollable content area
- Fixed footer with admin action buttons
- Confirm dialogs for destructive actions (reusing existing Dialog pattern from JobsSection)
- Cross-links between drawers: clicking "Client: John" in JobDrawer opens UserDrawer (replaces current drawer state)

## Build Order

1. Create `AdminDrawerContext` provider + hook
2. Create `JobDetailDrawer` with data query
3. Wire JobsSection row clicks + wrap AdminDashboard
4. Create `UserDetailDrawer` with data query
5. Wire UsersSection row clicks
6. Wire MetricInsightPage drilldown rows
7. Wire UnansweredJobsPage + SupportInbox rows

## What This Does NOT Include

- No new database RPCs (V1 uses existing client queries with admin RLS)
- No new database tables or migrations
- No SupportTicketDrawer (can be added later as an extension)
- No changes to the drawer contents of ProProfileDrawer (that's a client-facing component, separate concern)
