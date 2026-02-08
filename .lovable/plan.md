
# Admin Domain Design

> Structure for platform administration — ready for implementation when needed.

## Overview

The Admin domain enables platform operators to manage users, moderate content, review jobs, and monitor platform health. It **consumes** existing domain services rather than owning business logic.

---

## Folder Structure

```
src/pages/admin/
├── AdminDashboard.tsx        # Entry point with section navigation
├── index.ts                  # Barrel exports
│
├── sections/
│   ├── UsersSection.tsx      # User management
│   ├── JobsSection.tsx       # Job moderation
│   ├── ContentSection.tsx    # Forum/Help Desk moderation
│   ├── AnalyticsSection.tsx  # Platform metrics
│   └── index.ts
│
├── components/
│   ├── AdminSidebar.tsx      # Section navigation
│   ├── UserRow.tsx           # User list item
│   ├── JobModerationCard.tsx # Flagged job card
│   ├── ContentReviewCard.tsx # Flagged post/reply
│   ├── StatCard.tsx          # Analytics metric
│   └── index.ts
│
├── hooks/
│   ├── useAdminUsers.ts      # User list + search
│   ├── useAdminJobs.ts       # Flagged/pending jobs
│   ├── useAdminContent.ts    # Flagged forum content
│   ├── useAdminStats.ts      # Platform metrics
│   └── index.ts
│
├── actions/
│   ├── suspendUser.action.ts
│   ├── verifyProfessional.action.ts
│   ├── forceCompleteJob.action.ts
│   ├── archiveJob.action.ts
│   ├── removeContent.action.ts
│   └── index.ts
│
├── queries/
│   ├── adminUsers.query.ts
│   ├── adminJobs.query.ts
│   ├── adminContent.query.ts
│   ├── adminStats.query.ts
│   ├── keys.ts
│   └── index.ts
│
└── types.ts                  # Admin-specific types
```

---

## Route Configuration

Add to `src/app/routes/registry.ts`:

```typescript
{
  path: '/admin',
  access: 'admin2FA',  // Uses existing access rule
  lane: 'admin',
  label: 'Admin',
  navSection: null,    // Not in public nav
}
```

**Sub-routes** (optional, can use tab-based navigation instead):
- `/admin/users`
- `/admin/jobs`
- `/admin/content`
- `/admin/analytics`

---

## Section Capabilities

### 1. Users Section

| Feature | Description |
|---------|-------------|
| User list | Paginated table with search/filter |
| Role management | View roles, cannot self-elevate |
| Suspend/unsuspend | Toggle user access |
| Professional verification | Approve/reject pending pros |
| View activity | Jobs posted, messages sent, reviews |

**Reuses:**
- `user_roles` table (existing)
- `professional_profiles` table (existing)

### 2. Jobs Section

| Feature | Description |
|---------|-------------|
| Flagged jobs | Jobs with safety flags (red/amber) |
| Force complete | Mark job done if stuck |
| Archive | Remove from marketplace |
| Reassign | Change assigned professional |
| View full details | Including answers, photos |

**Reuses:**
- `src/pages/jobs/queries/` (existing)
- `src/pages/jobs/actions/completeJob.action.ts` (existing)
- `src/pages/jobs/lib/evaluatePackRules.ts` (existing)

### 3. Content Section

| Feature | Description |
|---------|-------------|
| Flagged posts | User-reported content |
| Remove content | Delete posts/replies |
| User warnings | Track moderation history |
| Category management | Enable/disable forum categories |

**Reuses:**
- `forum_posts`, `forum_replies` tables (existing)
- `src/pages/forum/queries/` (existing)

### 4. Analytics Section

| Feature | Description |
|---------|-------------|
| Platform stats | Total users, jobs, professionals |
| Activity trends | Jobs/day, signups/week |
| Category breakdown | Popular services |
| Health indicators | Response times, completion rates |

**New views needed:**
- `admin_platform_stats` (aggregated counts)
- `admin_activity_log` (audit trail, future)

---

## Database Requirements

### New Table: `admin_actions_log`

Audit trail for admin actions:

```sql
CREATE TABLE public.admin_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,  -- 'suspend_user', 'verify_pro', 'archive_job', etc.
  target_type TEXT NOT NULL,  -- 'user', 'job', 'post'
  target_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Only admins can read/write
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins only" ON public.admin_actions_log
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

### New View: `admin_platform_stats`

```sql
CREATE VIEW public.admin_platform_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM public.user_roles WHERE 'professional' = ANY(roles)) AS total_professionals,
  (SELECT COUNT(*) FROM public.professional_profiles WHERE is_publicly_listed = true) AS active_professionals,
  (SELECT COUNT(*) FROM public.jobs) AS total_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'open') AS open_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'completed') AS completed_jobs,
  (SELECT COUNT(*) FROM public.forum_posts) AS total_posts;
```

---

## Access Control

### Guard Integration

The existing `admin2FA` access rule in `src/guard/access.ts` handles admin routes:

```typescript
case 'admin2FA':
  return ctx.isAuthenticated && ctx.hasRole('admin');
```

### Security Considerations

1. **No self-elevation** — Admins cannot grant themselves higher roles
2. **Audit logging** — All admin actions logged to `admin_actions_log`
3. **Rate limiting** — Consider for bulk actions (future)
4. **2FA** — Reserved in access rule name for future implementation

---

## Integration Points

| Admin Action | Existing Domain | Reuse |
|--------------|-----------------|-------|
| View job details | Jobs | `useJobDetails` hook |
| Complete job | Jobs | `completeJob.action.ts` |
| Archive job | Jobs | New action, same pattern |
| View user roles | Guard | `user_roles` table |
| Verify professional | Onboarding | `professional_profiles` table |
| View forum posts | Forum | `forumQueries.ts` |

---

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Admin Dashboard                        [User Menu] │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  👥 Users    │  [Section Content]                   │
│  📋 Jobs     │                                      │
│  💬 Content  │  - Stats cards at top                │
│  📊 Analytics│  - Filterable table/list             │
│              │  - Action buttons per row            │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

---

## Implementation Order

When ready to build:

1. **Phase 1: Foundation**
   - AdminDashboard + tab navigation
   - Admin route in registry
   - Basic stats query

2. **Phase 2: Users**
   - User list with search
   - Suspend/unsuspend action
   - Professional verification

3. **Phase 3: Jobs**
   - Flagged jobs view
   - Force complete action
   - Archive action

4. **Phase 4: Content**
   - Flagged posts list
   - Remove content action

5. **Phase 5: Analytics**
   - Platform stats view
   - Activity trends charts

---

## Open Questions

- [ ] Should Help Desk (formerly Forum) moderation be in Admin or separate?
- [ ] Do we need admin notifications for new flagged content?
- [ ] Should analytics include export functionality?

---

## Related Files

| File | Purpose |
|------|---------|
| `src/guard/access.ts` | `admin2FA` rule already exists |
| `src/app/routes/registry.ts` | Add admin route |
| `src/pages/jobs/actions/` | Reuse job actions |
| `src/pages/forum/queries/` | Reuse forum queries |
