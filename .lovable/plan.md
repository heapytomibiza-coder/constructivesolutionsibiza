

# V2 MVP Execution Plan (Refined)

## Overview

This is the final, execution-ready plan incorporating all feedback. The project is **~75% complete** - this plan closes the remaining 25% in **5 focused phases**.

---

## Key Technical Decisions (Locked)

Based on audit and feedback, these decisions are now locked:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Professional services storage** | New `professional_services` table | Links pros to `service_micro_categories` by ID |
| **Matched jobs** | VIEW not RPC | Aligns with existing pattern (`jobs_board`, `job_details` are views) |
| **Micro identifier** | `micro_slug` is canonical | Job wizard saves `micro_slug`, job board reads `micro_slug` |
| **services_count** | Computed, not stored | Avoids sync bugs; use `COUNT(*)` from `professional_services` |
| **Fallback question pack** | Required | Prevents wizard dead-ends when packs are missing |

---

## Database Changes Required

### 1. New Table: `professional_services`

```sql
CREATE TABLE professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  micro_id UUID NOT NULL REFERENCES service_micro_categories(id) ON DELETE CASCADE,
  notify BOOLEAN DEFAULT true,
  searchable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, micro_id)
);

-- RLS
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own services"
  ON professional_services FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for matching queries
CREATE INDEX idx_professional_services_micro
  ON professional_services(micro_id);
```

### 2. New View: `matched_jobs_for_professional`

```sql
CREATE VIEW matched_jobs_for_professional AS
SELECT DISTINCT
  jb.*,
  ps.user_id AS professional_user_id
FROM jobs_board jb
JOIN service_micro_categories smc ON smc.slug = jb.micro_slug
JOIN professional_services ps ON ps.micro_id = smc.id
WHERE jb.is_publicly_listed = true
  AND jb.status = 'open';
```

This view enables:
- Pro dashboard: `WHERE professional_user_id = auth.uid()`
- Job board filter: Same condition when pro is logged in

### 3. Fallback Question Pack

```sql
INSERT INTO question_packs (micro_slug, title, questions, is_active, version)
VALUES (
  '__fallback__',
  'General Project Details',
  '[
    {"id": "description", "label": "Describe your project", "type": "textarea", "required": true, "placeholder": "What do you need help with?"},
    {"id": "size_estimate", "label": "Project size (if applicable)", "type": "text", "placeholder": "e.g. 2 rooms, 50m², 3 units"},
    {"id": "materials", "label": "Do you have materials already?", "type": "radio", "options": ["Yes", "No", "Partially"]},
    {"id": "access_notes", "label": "Any access considerations?", "type": "textarea", "placeholder": "Parking, stairs, building access, etc."}
  ]'::jsonb,
  true,
  1
);
```

---

## Phase 1: Professional Service Selection (Day 1-2)

### Goal
Professionals can select which micro-services they offer.

### Files to Create

**`src/pages/professional/ProfessionalServiceSetup.tsx`**
- Full-page wizard for service selection
- Reuses `CategorySelector`, `SubcategorySelector`, `MicroStep`
- Allows selecting micros across multiple categories
- Saves to `professional_services` table
- Updates `professional_profiles.onboarding_phase` to `'complete'`

**`src/hooks/useProfessionalServices.ts`**
- `useQuery` to fetch current pro's selected services
- `useMutation` for add/remove operations
- Computed `servicesCount` derived from query result

### Files to Modify

**`src/pages/onboarding/ProfessionalOnboarding.tsx`**
- Update step 3 ("Set Up Services") to link to `/professional/service-setup`
- Show services count if already configured

**`src/App.tsx`**
- Add route: `/professional/service-setup` → `ProfessionalServiceSetup`

**`src/app/routes/registry.ts`**
- Add: `{ path: '/professional/service-setup', access: 'role:professional', redirectTo: '/auth' }`

**`src/components/wizard/db-powered/MicroStep.tsx`**
- Add optional prop `selectedSubcategoryId` to allow fetching micros from a different subcategory
- This enables multi-category selection in pro setup

### Acceptance Criteria
- Pro signs up → completes onboarding → selects 5 services
- `professional_services` table has 5 rows with correct `micro_id`s
- `onboarding_phase` = `'complete'` in `professional_profiles`

---

## Phase 2: Dashboard Real Data (Day 2-3)

### Goal
Dashboards show actual data, not placeholder 0s.

### Files to Create

**`src/pages/dashboard/hooks/useClientStats.ts`**
```typescript
// Returns: { activeJobs, draftJobs, totalJobs, unreadMessages }
// Query: jobs WHERE user_id = auth.uid()
// Query: conversations with unread count
```

**`src/pages/dashboard/hooks/useProStats.ts`**
```typescript
// Returns: { servicesCount, matchedJobsCount, unreadMessages }
// Query: COUNT(*) FROM professional_services
// Query: COUNT(*) FROM matched_jobs_for_professional
// Query: conversations with unread count
```

**`src/components/layout/RoleSwitcher.tsx`**
- Dropdown component showing current role
- Only visible if `roles.length > 1`
- Calls `switchRole()` on selection
- **Critical**: Invalidates TanStack Query cache on role change

### Files to Modify

**`src/pages/dashboard/ClientDashboard.tsx`**
- Replace hardcoded stats with `useClientStats()`
- Fetch and display user's jobs list
- Add `RoleSwitcher` to nav if pro role exists

**`src/pages/dashboard/ProDashboard.tsx`**
- Replace hardcoded stats with `useProStats()`
- Add "Matched Jobs" section using `matched_jobs_for_professional` view
- Add `RoleSwitcher` to nav
- Add link to `/professional/service-setup` if services incomplete

### Cache Invalidation (Critical)

```typescript
// In RoleSwitcher.tsx
const handleSwitch = async (role: UserRole) => {
  await switchRole(role);
  // Invalidate all role-dependent queries
  queryClient.invalidateQueries({ queryKey: ['jobs'] });
  queryClient.invalidateQueries({ queryKey: ['matched_jobs'] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
};
```

### Acceptance Criteria
- Client sees their posted jobs count and list
- Pro sees their services count and matched jobs count
- Role switcher appears and works
- Dashboard data updates immediately after role switch

---

## Phase 3: Matched Jobs Filter (Day 3-4)

### Goal
Professionals see jobs relevant to their services.

### Files to Create

**`src/hooks/useMatchedJobs.ts`**
```typescript
// Fetches from matched_jobs_for_professional view
// Filter: WHERE professional_user_id = auth.uid()
// Returns: JobsBoardRow[] with same shape as jobs_board
```

### Files to Modify

**`src/pages/jobs/JobsMarketplace.tsx`**
- Add toggle: "All Jobs" / "Matched Jobs"
- Toggle only visible when `activeRole === 'professional'`
- When "Matched" selected, use `useMatchedJobs()` instead of all jobs
- Keep all existing filters operational on matched subset

**`src/pages/dashboard/ProDashboard.tsx`**
- "Matched Jobs" section shows first 5 from `useMatchedJobs()`
- "View All" links to `/jobs?matched=true`

### Micro Alignment Verification

This is the "gotcha" the user flagged. Verified:
- Job wizard saves: `micro_slug` (line 271-319 in `buildJobPayload.ts`)
- `jobs_board` view exposes: `micro_slug` column
- Matching view joins: `smc.slug = jb.micro_slug`
- Pro services link: `ps.micro_id = smc.id`

**The chain is complete and consistent.**

### Acceptance Criteria
- Pro with "ac-installation" service sees AC installation jobs
- Empty state when no matches
- Toggle between All/Matched works
- Filters apply on top of matched subset

---

## Phase 4: Data Completion (Day 4-5)

### Goal
100% question pack coverage (285/285) + fallback protection.

### Tasks

1. **Add Fallback Pack** (migration)
   - Insert `__fallback__` pack as defined above

2. **Update QuestionsStep** (code)
   - If no packs found for selected micros, load `__fallback__`
   - Never show empty questions step

**`src/components/wizard/canonical/steps/QuestionsStep.tsx`** changes:
```typescript
// After line 73, before setMissingPacks:
if (parsedPacks.length === 0) {
  // Load fallback pack
  const { data: fallback } = await supabase
    .from('question_packs')
    .select('*')
    .eq('micro_slug', '__fallback__')
    .single();
  
  if (fallback) {
    parsedPacks.push({
      id: fallback.id,
      micro_slug: '__fallback__',
      title: fallback.title,
      questions: fallback.questions as QuestionDef[],
    });
  }
}
```

3. **Seed Remaining Packs** (operations)
   - Audit: 93/285 = 33% coverage
   - Use existing `seedpacks` edge function
   - Batch by category (electrical, plumbing, etc.)
   - Dry run first: `?dry_run=1`

### Acceptance Criteria
- Wizard never shows "No questions" - always shows fallback at minimum
- Question pack count reaches 285 (or close)
- Seeder runs are idempotent

---

## Phase 5: Polish & QA (Day 5-6)

### Mobile FAB

**`src/components/MobileFAB.tsx`** (new)
```typescript
// Floating action button, bottom-right on mobile
// Shows "Post Job" with + icon
// Visible on: /, /jobs, /services
// Hidden on: /post (wizard), small screens during typing
```

### Files to Modify

**`src/pages/jobs/JobBoardPage.tsx`**
- Add `<MobileFAB />` at bottom of layout
- Hide when user is in job wizard

**`src/pages/Index.tsx`**
- Add `<MobileFAB />` on homepage

### Empty States Audit

Check these pages for proper empty states:
- Client dashboard: "No jobs yet" → CTA to post
- Pro dashboard: "No matched jobs" → CTA to browse all
- Messages: "No conversations" → CTA to explore jobs
- Pro services: "No services selected" → CTA to add

### Full QA Script

| Step | Action | Expected |
|------|--------|----------|
| 1 | Sign up as client | Lands on `/` or `/dashboard/client` |
| 2 | Post a job | Wizard completes, job visible in board |
| 3 | See job in dashboard | Stats show 1 active job |
| 4 | Sign up as pro | Directed to onboarding |
| 5 | Complete pro onboarding | Select services, phase = complete |
| 6 | See matched jobs | Dashboard shows relevant jobs |
| 7 | Message client | Conversation starts |
| 8 | Check messaging | Client sees message, unread badge |
| 9 | Role switch | Pro → Client, dashboard changes |
| 10 | Realtime | New message shows without refresh |

### Performance Verification
- Job board loads in <2s with 100+ jobs
- No N+1 queries (check Network tab)
- Realtime subscriptions are scoped (no global listeners)

---

## File Summary

### New Files (8)
```
src/pages/professional/ProfessionalServiceSetup.tsx
src/hooks/useProfessionalServices.ts
src/pages/dashboard/hooks/useClientStats.ts
src/pages/dashboard/hooks/useProStats.ts
src/hooks/useMatchedJobs.ts
src/components/layout/RoleSwitcher.tsx
src/components/MobileFAB.tsx
supabase/migrations/[timestamp]_professional_services.sql
```

### Modified Files (9)
```
src/App.tsx (add route)
src/app/routes/registry.ts (add route config)
src/pages/onboarding/ProfessionalOnboarding.tsx
src/pages/dashboard/ClientDashboard.tsx
src/pages/dashboard/ProDashboard.tsx
src/pages/jobs/JobsMarketplace.tsx
src/pages/jobs/JobBoardPage.tsx
src/pages/Index.tsx
src/components/wizard/canonical/steps/QuestionsStep.tsx
```

---

## Timeline

| Phase | Duration | Outcome |
|-------|----------|---------|
| Phase 1 | 1-2 days | Pros can select services |
| Phase 2 | 1 day | Real dashboard data |
| Phase 3 | 1 day | Matched jobs working |
| Phase 4 | 0.5 days | Data complete + fallback |
| Phase 5 | 0.5-1 day | Polish + QA pass |

**Total: 5-6 days to ship V2 MVP**

---

## What NOT to Build (V2 Excluded)

Per scope documentation, these are **explicitly out**:
- Payments / Escrow
- Disputes / Resolution
- Admin dashboard (beyond basic)
- Analytics dashboards
- PWA features
- AI matching engine
- Full verification flow (placeholder only)
- Reviews / Ratings system

These are V3+ features.

