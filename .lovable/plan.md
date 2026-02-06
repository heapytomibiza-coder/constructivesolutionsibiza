

# Security Hardening + Auth Flow + Assignment Guard Fix

## Executive Summary

Based on the detailed review of your feedback and verification of the actual codebase, I've identified 4 critical issues to fix:

1. **Auth Callback loses wizard state** - redirects to dashboard, not back to wizard
2. **Assignment action doesn't verify pro is a conversation participant** - security gap
3. **RLS policies use FOR ALL** - should be split per command (best practice)
4. **View column audit** - need to verify no sensitive columns exposed

---

## Current State (Verified)

| Component | Status | Issue |
|-----------|--------|-------|
| `increment_professional_micro_stats` RPC | SECURITY DEFINER | Safe - bypasses RLS correctly |
| `professional_services` RLS | FOR ALL policy | Works but should be split |
| `professional_micro_preferences` RLS | FOR ALL policy | Works but should be split |
| `professional_micro_stats` RLS | SELECT only | Correct - RPC handles writes |
| `jobs_board` view | Public columns only | Safe - no user_id exposed |
| `job_details` view | Exposes `is_owner` boolean | Safe - boolean, not full user data |
| `matched_jobs_for_professional` view | Uses `auth.uid()` filter | Safe |
| `assignProfessional` action | Missing conversation check | Security gap |
| `AuthCallback` | Redirects to dashboard | Loses wizard state |

---

## Implementation Plan

### Part 1: Fix Auth Callback to Resume Wizard

**Problem**: User fills wizard → auth checkpoint → sign in → redirected to `/dashboard/client` → wizard state lost

**Solution**: Store intended redirect in sessionStorage, resume after auth

**File: `src/pages/auth/AuthCallback.tsx`**

```typescript
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        navigate('/auth?error=callback_failed');
        return;
      }

      if (session) {
        // Check for pending redirect (e.g., from wizard auth checkpoint)
        const pendingRedirect = sessionStorage.getItem('authRedirect');
        sessionStorage.removeItem('authRedirect');
        
        if (pendingRedirect) {
          navigate(pendingRedirect);
        } else {
          // Default based on role
          navigate('/dashboard/client');
        }
      } else {
        navigate('/auth');
      }
    };

    handleCallback();
  }, [navigate]);

  // ... rest unchanged
};
```

**Also update wizard submission** (wherever auth redirect happens):
```typescript
// Before redirecting to /auth for login
sessionStorage.setItem('authRedirect', '/post?resume=true');
```

---

### Part 2: Add Conversation Participant Check to Assignment

**Problem**: Current `assignProfessional` action verifies job ownership but not that the pro actually messaged about this job.

**File: `src/pages/jobs/actions/assignProfessional.action.ts`**

Add after job ownership check:

```typescript
// Verify the professional is a participant in a job conversation
const { data: conversation, error: convError } = await supabase
  .from('conversations')
  .select('id')
  .eq('job_id', jobId)
  .eq('pro_id', professionalId)
  .single();

if (convError || !conversation) {
  return { success: false, error: 'Professional has not messaged about this job' };
}
```

This prevents assigning random professionals who never expressed interest.

---

### Part 3: Split RLS Policies (Best Practice)

**Database Migration** - Replace FOR ALL with per-command policies

```sql
-- ============================================
-- PROFESSIONAL_SERVICES: Split policies
-- ============================================

-- Drop existing FOR ALL policy
DROP POLICY IF EXISTS "Users manage own services" ON professional_services;

-- Create per-command policies
CREATE POLICY "professional_services_select_own"
ON professional_services FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "professional_services_insert_own"
ON professional_services FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "professional_services_update_own"
ON professional_services FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "professional_services_delete_own"
ON professional_services FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- PROFESSIONAL_MICRO_PREFERENCES: Split policies
-- ============================================

-- Drop existing FOR ALL policy
DROP POLICY IF EXISTS "Users manage own preferences" ON professional_micro_preferences;

-- Create per-command policies
CREATE POLICY "pro_micro_prefs_select_own"
ON professional_micro_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "pro_micro_prefs_insert_own"
ON professional_micro_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pro_micro_prefs_update_own"
ON professional_micro_preferences FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pro_micro_prefs_delete_own"
ON professional_micro_preferences FOR DELETE
USING (auth.uid() = user_id);
```

**Note**: `professional_micro_stats` is correct as-is — SELECT only for users, writes handled by SECURITY DEFINER RPC.

---

### Part 4: View Column Audit (Verified Safe)

| View | Columns | Sensitive Data? | Status |
|------|---------|-----------------|--------|
| `jobs_board` | title, teaser, category, budget, etc. | No user_id, no address | Safe |
| `job_details` | Same + answers + `is_owner` boolean | Boolean only, not user_id | Safe |
| `matched_jobs_for_professional` | Same + `professional_user_id` (caller's own ID) | Own ID only via `auth.uid()` | Safe |
| `professional_matching_scores` | user_id, scores | Public ranking data | Safe |

All views filter appropriately or only expose non-sensitive columns.

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/pages/auth/AuthCallback.tsx` | Add pendingRedirect resume logic | High |
| `src/pages/jobs/actions/assignProfessional.action.ts` | Add conversation participant check | High |
| Database migration | Split RLS policies | Medium |
| Wizard auth checkpoint (wherever it redirects) | Set `authRedirect` in sessionStorage | High |

---

## Wizard State Persistence (Already Working)

The current implementation uses `sessionStorage` with key `wizardState`:
- Saves draft every 600ms when dirty
- Checks for existing draft on mount
- Can restore via `getPendingDraft()`

The fix is simple: ensure auth redirect stores `/post?resume=true` and the wizard checks for this param to auto-restore.

---

## Optional: Add `?resume=true` handling to wizard

**File: `src/components/wizard/canonical/CanonicalJobWizard.tsx`**

```typescript
// In the component, check for resume param
const [searchParams] = useSearchParams();
const shouldResume = searchParams.get('resume') === 'true';

useEffect(() => {
  if (shouldResume) {
    const draft = getPendingDraft();
    if (draft) {
      // Restore state from draft
      dispatch({ type: 'RESTORE_DRAFT', payload: draft });
    }
  }
}, [shouldResume]);
```

---

## Summary

| Issue | Fix | Effort |
|-------|-----|--------|
| Auth loses wizard state | Resume redirect from sessionStorage | 30 min |
| Assignment security gap | Verify pro in conversation | 15 min |
| RLS best practice | Split FOR ALL into 4 policies each | 20 min (SQL) |
| View audit | Already verified safe | Done |

Total estimated effort: **~1 hour**

