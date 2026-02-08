

# Admin Domain Refactoring + Support Section

This plan refactors the existing Admin domain to match the proposed architecture and adds the Support section that integrates with the @csi-support feature.

---

## Current State Analysis

The Admin domain is already functional with 4 phases implemented:

| Phase | Status | What Exists |
|-------|--------|-------------|
| 1. Overview | ✅ Complete | Stats dashboard with platform metrics |
| 2. Users | ✅ Complete | User list, search, suspend/unsuspend, pro verification |
| 3. Jobs | ✅ Complete | Job moderation, force-complete, archive |
| 4. Content | ✅ Complete | Forum post/reply moderation |
| 5. Support | ❌ Missing | Not yet built |

**Current folder structure:**
```text
src/pages/admin/
  AdminDashboard.tsx
  index.ts
  types.ts
  actions/
    suspendUser.action.ts
    verifyProfessional.action.ts
    forceCompleteJob.action.ts
    archiveJob.action.ts
    removeContent.action.ts
  hooks/
    useAdminStats.ts
    useAdminUsers.ts
    useAdminJobs.ts
    useAdminContent.ts
  sections/
    UsersSection.tsx     (250 lines - monolithic)
    JobsSection.tsx      (337 lines - monolithic)
    ContentSection.tsx   (305 lines - monolithic)
```

---

## Proposed Architecture

### Target folder structure

```text
src/pages/admin/
  AdminLayout.tsx              # Shared layout with sidebar nav (optional)
  AdminDashboard.tsx           # Entry point
  index.ts
  types.ts                     # Shared admin types
  
  actions/                     # Admin-specific writes + audit
    index.ts
    suspendUser.action.ts
    unsuspendUser.action.ts
    verifyProfessional.action.ts
    archiveJob.action.ts
    forceCompleteJob.action.ts
    removeContent.action.ts
    assignSupportTicket.action.ts   # NEW
    updateSupportStatus.action.ts   # NEW
    joinSupportThread.action.ts     # NEW
    
  queries/                     # Admin read queries (NEW folder)
    index.ts
    keys.ts                    # Query key factory
    adminStats.query.ts
    adminUsers.query.ts
    adminJobs.query.ts
    adminContent.query.ts
    supportRequests.query.ts   # NEW
    
  sections/
    users/
      UsersSection.tsx
      components/
        UserTable.tsx          # Extracted
        UserStatusBadge.tsx    # Extracted
        SuspendUserDialog.tsx  # Extracted
      hooks/
        useAdminUsers.ts       # Moved from parent hooks/
      index.ts
        
    jobs/
      JobsSection.tsx
      components/
        JobModerationTable.tsx
        JobStatusBadge.tsx
        ForceCompleteDialog.tsx
        ArchiveJobDialog.tsx
      hooks/
        useAdminJobs.ts
      index.ts
        
    content/
      ContentSection.tsx
      components/
        ContentTable.tsx
        ContentTypeBadge.tsx
        RemoveContentDialog.tsx
      hooks/
        useAdminContent.ts
      index.ts
        
    support/                   # NEW SECTION
      SupportInbox.tsx         # Main view - ticket list
      SupportThreadView.tsx    # View conversation + context
      components/
        SupportTicketRow.tsx
        SupportStatusBadge.tsx
        SupportPriorityBadge.tsx
        JoinChatButton.tsx
        AssignDialog.tsx
      hooks/
        useSupportRequests.ts
        useSupportContext.ts   # Thread + job context
      index.ts
      
  lib/
    formatters.ts              # Admin-specific formatting
    filters.ts                 # Filter logic utilities
```

---

## Implementation Plan

### Step 1: Create queries/ folder (extraction)

Move query logic out of hooks into dedicated query files. This follows the pattern already established in `src/pages/jobs/queries/`.

**Files to create:**
- `queries/keys.ts` - Query key factory for cache invalidation
- `queries/adminStats.query.ts` - Extract from useAdminStats
- `queries/adminUsers.query.ts` - Extract from useAdminUsers
- `queries/adminJobs.query.ts` - Extract from useAdminJobs
- `queries/adminContent.query.ts` - Extract from useAdminContent

**Benefits:**
- Consistent with jobs domain pattern
- Enables query reuse across different hooks
- Cleaner separation of concerns

### Step 2: Restructure sections into nested folders

Migrate each section to its own subfolder with components, hooks, and index.

**For Users section:**
```text
sections/users/
  UsersSection.tsx        # Slimmed down, uses extracted components
  components/
    UserTable.tsx         # Table rendering logic
    UserStatusBadge.tsx   # Status badge logic
    SuspendUserDialog.tsx # Confirmation dialog
  hooks/
    useAdminUsers.ts      # Wrapper hook
  index.ts
```

Apply same pattern to Jobs and Content sections.

### Step 3: Add Support section (Phase 5)

This section is the **trust engine** - where @csi-support tickets land.

**Database requirements (already designed):**
- `support_requests` table - Tickets with status, priority, assignment
- `support_request_events` table - Audit trail
- `conversation_participants` table - Support join tracking

**New files:**

| File | Purpose |
|------|---------|
| `sections/support/SupportInbox.tsx` | Ticket list with filters (Open, Triage, Assigned, Resolved) |
| `sections/support/SupportThreadView.tsx` | Read conversation + job context, take actions |
| `components/SupportTicketRow.tsx` | Table row with SLA age indicator |
| `components/SupportStatusBadge.tsx` | Status badge component |
| `components/SupportPriorityBadge.tsx` | Priority indicator |
| `components/JoinChatButton.tsx` | "Join conversation" action |
| `hooks/useSupportRequests.ts` | Fetch tickets with filters |
| `hooks/useSupportContext.ts` | Fetch conversation + messages for review |

**Actions:**
- `assignSupportTicket.action.ts` - Self-assign or assign to team member
- `updateSupportStatus.action.ts` - Triage → Joined → Resolved
- `joinSupportThread.action.ts` - Add support to conversation participants

### Step 4: Update AdminDashboard

- Add Support tab (5th tab with Headset icon)
- Add support stats to Overview:
  - Open tickets count
  - Avg response time (later)
  - Tickets requiring attention

### Step 5: Optional AdminLayout

Consider adding `AdminLayout.tsx` for:
- Persistent sidebar navigation (current tabs stay in header)
- Breadcrumbs for nested views
- Session info / quick actions

---

## Technical Details

### Query Keys Pattern

```typescript
// queries/keys.ts
export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  users: (filter?: string) => [...adminKeys.all, 'users', { filter }] as const,
  jobs: (filter?: string) => [...adminKeys.all, 'jobs', { filter }] as const,
  content: (filter?: string) => [...adminKeys.all, 'content', { filter }] as const,
  support: (filter?: string) => [...adminKeys.all, 'support', { filter }] as const,
  supportDetail: (id: string) => [...adminKeys.all, 'support', id] as const,
};
```

### Support Ticket Workflow

```text
User triggers @csi-support → creates support_request (status: open)
                                    ↓
Support sees in Inbox ─────────────────────────────────────────────────
                                    ↓
        ┌───────────────────────────┼───────────────────────────┐
        ↓                           ↓                           ↓
  Assign to self              Change priority              Add note
        ↓                           ↓                           ↓
        └───────────────────────────┼───────────────────────────┘
                                    ↓
                         View conversation context
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            "Join chat"                      Mark resolved
                    ↓                               ↓
          Messages in thread               Close ticket
```

### RLS Policies for Support

**Support can read conversations when:**
- A support_request exists for that conversation_id, OR
- They are in conversation_participants for that conversation

**This protects privacy while enabling intervention.**

---

## Implementation Order

| Order | Task | Effort |
|-------|------|--------|
| 1 | Create `queries/` folder + extract query functions | Small |
| 2 | Create `queries/keys.ts` for consistent cache keys | Small |
| 3 | Restructure Users section to nested folder | Medium |
| 4 | Restructure Jobs section to nested folder | Medium |
| 5 | Restructure Content section to nested folder | Medium |
| 6 | Create Support section schema (migration) | Medium |
| 7 | Build SupportInbox component | Medium |
| 8 | Build support actions (assign, status, join) | Medium |
| 9 | Build SupportThreadView with conversation context | Large |
| 10 | Update AdminDashboard with Support tab | Small |

---

## Key Decisions

1. **Keep actions in root `/actions/`** rather than per-section
   - Consistent with current pattern
   - All admin actions share audit logging pattern
   - Easier to maintain

2. **Extract components within sections** (not to root `/components/`)
   - Each section owns its components
   - Avoids premature abstraction
   - If a component is needed across sections, promote it then

3. **Support section starts read-only**
   - Phase 1: View tickets + conversation context
   - Phase 2: Add actions (assign, status change)
   - Phase 3: Join chat capability

4. **AdminLayout is optional**
   - Current tab-based UI works well
   - Add layout when/if we need persistent sidebar

---

## Files to Create/Modify

### New Files (17)
- `queries/index.ts`
- `queries/keys.ts`
- `queries/adminStats.query.ts`
- `queries/adminUsers.query.ts`
- `queries/adminJobs.query.ts`
- `queries/adminContent.query.ts`
- `queries/supportRequests.query.ts`
- `sections/support/SupportInbox.tsx`
- `sections/support/SupportThreadView.tsx`
- `sections/support/components/SupportTicketRow.tsx`
- `sections/support/components/SupportStatusBadge.tsx`
- `sections/support/hooks/useSupportRequests.ts`
- `sections/support/index.ts`
- `actions/assignSupportTicket.action.ts`
- `actions/updateSupportStatus.action.ts`
- `actions/joinSupportThread.action.ts`
- `lib/formatters.ts`

### Modified Files (5)
- `AdminDashboard.tsx` - Add Support tab
- `index.ts` - Update exports
- `types.ts` - Add support types
- `actions/index.ts` - Export new actions
- `hooks/index.ts` - Update after restructure

### Database Migration (1)
- Support tables schema (support_requests, support_request_events, conversation_participants)

---

## Summary

This refactoring:

1. **Aligns with domain-first architecture** - Admin consumes existing domains
2. **Adds the Support section** - The operational heart of @csi-support
3. **Improves maintainability** - Clearer separation, extracted components
4. **Follows existing patterns** - Consistent with jobs domain structure
5. **Enables future growth** - Analytics, escalation workflows, SLA tracking

**Recommendation:** Implement in phases, starting with the Support section (highest business value) while restructuring incrementally as you touch each section.

