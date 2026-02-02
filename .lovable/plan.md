

# Plan: Fix Cache Invalidation & Enable End-to-End QA

## Problem Summary

There's a query key mismatch causing role switching to not refresh the job board:
- **RoleSwitcher.tsx** line 44: `invalidateQueries({ queryKey: ['jobs'] })`
- **JobsMarketplace.tsx** line 88: `queryKey: ["jobs_board"]`

This means when a user switches roles, the job board data stays stale.

---

## Phase 1: Fix Cache Invalidation (30 seconds)

**File:** `src/components/layout/RoleSwitcher.tsx`

**Change:** Add the missing `jobs_board` invalidation at line 44-50:

```typescript
// Line 44-50 should become:
queryClient.invalidateQueries({ queryKey: ['jobs'] });
queryClient.invalidateQueries({ queryKey: ['jobs_board'] }); // ADD THIS LINE
queryClient.invalidateQueries({ queryKey: ['matched_jobs'] });
queryClient.invalidateQueries({ queryKey: ['conversations'] });
queryClient.invalidateQueries({ queryKey: ['client_stats'] });
queryClient.invalidateQueries({ queryKey: ['client_jobs'] });
queryClient.invalidateQueries({ queryKey: ['pro_unread_messages'] });
queryClient.invalidateQueries({ queryKey: ['professional_services'] });
```

**Impact:** Role switching will now immediately refresh the job board.

---

## Phase 2: QA Test Script (Manual Steps)

Once the fix is applied, run this end-to-end test:

### Step 1: Create Test Job (Client)
1. Log in as client
2. Go to `/post` and complete the wizard
3. Note the `micro_slug` selected (e.g., "ac-installation")
4. Verify job appears on job board

### Step 2: Create Matching Pro Service
1. Log in as professional user
2. Go to `/professional/service-setup`
3. Select the **same micro-category** as the job's `micro_slug`
4. Complete setup

### Step 3: Verify Matched Jobs
1. As professional, go to `/jobs`
2. Click "Show Matched Only" toggle
3. The test job should appear

### Step 4: Verify Role Switching
1. With a user that has both roles
2. Switch from client to professional
3. Confirm dashboard changes immediately
4. Confirm job board refreshes (no stale data)

---

## Validation Queries

After test data is created, run these to verify:

```sql
-- 1. Check job exists with micro_slug
SELECT id, title, micro_slug, status, is_publicly_listed
FROM jobs
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check pro has selected matching service
SELECT smc.slug
FROM professional_services ps
JOIN service_micro_categories smc ON smc.id = ps.micro_id
WHERE ps.user_id = auth.uid();

-- 3. Verify matched view returns the job
SELECT id, title, micro_slug
FROM matched_jobs_for_professional
WHERE professional_user_id = auth.uid()
ORDER BY created_at DESC;
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/layout/RoleSwitcher.tsx` | Add `['jobs_board']` to invalidation list |

## Estimated Time
- Code change: 30 seconds
- QA test: 10-15 minutes

