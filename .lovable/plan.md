
# Comprehensive Fix: Intent Logic, Messaging, and MVP Rating System

## Summary
This plan addresses 6 identified issues with the current implementation and adds a basic two-way rating/review system for job completion.

---

## Part 1: Fixes for Existing Issues

### Issue 1: Signup Intent Typing (Already Fixed)
**Status**: Already correctly implemented

Looking at the current code:
- `IntentSelector.tsx` exports `UserIntent = 'client' | 'professional' | 'both'`
- `Auth.tsx` imports the type and uses `useState<UserIntent | null>(null)` (line 29)
- Role logic correctly handles all three cases (lines 70-75):
  - `client` → `['client']`, active = `client`
  - `professional` → `['client', 'professional']`, active = `professional`
  - `both` → `['client', 'professional']`, active = `client`

The toast for "both" users (lines 93-97) explains they can switch modes.

No changes needed.

---

### Issue 2: Intent Data Persistence via DB Trigger
**Status**: Already implemented

The `handle_new_user()` database trigger (already deployed) reads from `raw_user_meta_data` and:
- Creates `user_roles` row with correct `roles` array and `active_role`
- Creates `professional_profiles` stub for professional/both intents

The `useSessionSnapshot` hook reads from these tables on login.

No changes needed.

---

### Issue 3: Role Naming Consistency
**Status**: Correct approach already in place

Internal values: `client` | `professional`
UI labels: "Asker" | "Tasker"

The mapping happens at the UI layer (e.g., Settings.tsx line 35, RoleSwitcher).

No changes needed, but worth documenting.

---

### Issue 4: Message Action Already Wired Correctly
**Status**: Already fixed

Looking at `messageJob.action.ts`:
- `startConversation()` returns `Promise<string>` (the conversation ID)
- It calls the `get_or_create_conversation` RPC which returns a UUID

Looking at `JobListingCard.tsx` (lines 101-118):
- Uses `useNavigate()` for SPA routing (not window.location.href)
- Correctly calls `startConversation(job.id)` and navigates to `/messages?conversation=${conversationId}`

No changes needed.

---

### Issue 5: "View & Apply" Has No Real Apply Flow
**Status**: Needs implementation

Currently, "View & Apply" just opens the modal. There's no:
- `job_applications` table
- Apply button/handler in the modal
- "Applied" state tracking

**Will address in Part 2** with a lightweight approach.

---

### Issue 6: Mobile Nav Responsiveness
**Status**: Already correct

Looking at `MobileNav.tsx`:
- Sheet trigger has `className="md:hidden"` (line 59) - hidden on desktop

Looking at `PublicNav.tsx`:
- Desktop nav links have `className="hidden md:flex"` (line 53) - hidden on mobile
- Desktop user dropdown has `className="hidden md:flex"` (line 100)

No changes needed.

---

## Part 2: MVP Job Completion & Rating System

### New Database Schema

**Table: `job_reviews`**
```sql
CREATE TABLE public.job_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL,
  reviewee_user_id UUID NOT NULL,
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('client', 'professional')),
  reviewee_role TEXT NOT NULL CHECK (reviewee_role IN ('client', 'professional')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_review_per_job_per_reviewer UNIQUE (job_id, reviewer_user_id)
);
```

**Add to jobs table:**
```sql
ALTER TABLE public.jobs 
  ADD COLUMN assigned_professional_id UUID,
  ADD COLUMN completed_at TIMESTAMPTZ;
```

**RLS Policies for job_reviews:**
- Users can INSERT if they're the reviewer and are part of the job
- Users can SELECT their own reviews (as reviewer or reviewee)
- Private visibility reviews only visible to platform (via service role)

---

### Job Completion Flow

```text
┌─────────────────────────────────────────┐
│ Client Dashboard - Job Card             │
│                                         │
│ [In Progress Job]                       │
│ Assigned to: John Smith                 │
│                                         │
│ [Mark as Completed]                     │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Completion Confirmation Modal           │
│                                         │
│ "Has the work been completed?"          │
│                                         │
│ [Cancel]  [Yes, Complete]               │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Rating Modal                            │
│                                         │
│ "Rate your experience with John"        │
│                                         │
│ ⭐⭐⭐⭐⭐                              │
│                                         │
│ "Add a comment (optional)"              │
│ [                          ]            │
│                                         │
│ [Skip for now]  [Submit Rating]         │
└─────────────────────────────────────────┘
```

---

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx.sql` | Create | Add job_reviews table, add assigned_professional_id and completed_at to jobs |
| `src/pages/jobs/components/RatingModal.tsx` | Create | Star rating + optional comment modal |
| `src/pages/jobs/components/CompletionModal.tsx` | Create | Confirmation before completing job |
| `src/pages/jobs/actions/completeJob.action.ts` | Create | Mark job as completed, trigger review |
| `src/pages/jobs/actions/submitReview.action.ts` | Create | Submit a review for a job |
| `src/pages/dashboard/ClientDashboard.tsx` | Modify | Add "Mark Complete" button for in_progress jobs |
| `src/pages/dashboard/ProDashboard.tsx` | Modify | Add pending review prompts |
| `src/integrations/supabase/types.ts` | Auto-update | Will reflect new table |

---

### Technical Details

**RatingModal Component:**
```typescript
interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  revieweeId: string;
  revieweeName?: string;
  reviewerRole: 'client' | 'professional';
  onComplete: () => void;
}
```

Features:
- 5-star rating (required)
- Optional comment (max 500 chars)
- Submit creates row in job_reviews
- Client reviewing pro: visibility = 'public' (can be shown later)
- Pro reviewing client: visibility = 'private' (internal signal only)

**Complete Job Flow:**
1. Client clicks "Mark Complete"
2. Confirmation modal appears
3. On confirm:
   - Update `jobs.status = 'completed'`, `jobs.completed_at = now()`
   - Show RatingModal for client to rate pro
4. Pro sees "Rate this client" prompt on their dashboard

**Pending Reviews Widget:**
- On dashboard, show jobs where:
  - status = 'completed'
  - completed_at within last 30 days
  - no review exists from current user
- "Finish up" prompt with "Rate [other party]" button

---

### Visibility Rules (Important for Client Privacy)

| Reviewer | Reviewee | Visibility | Who Can See |
|----------|----------|------------|-------------|
| Client | Professional | `public` | Anyone (on pro profile later) |
| Professional | Client | `private` | Only platform admins |

This ensures:
- Professionals build public reputation
- Clients don't have a public score
- Platform can use private ratings for internal quality signals

---

### MVP Constraints (Keep Simple)

1. **No formal application flow yet** - Message-based interest expression
2. **assigned_professional_id set manually** - Later can be set via accept flow
3. **Reviews only after completion** - Prevents premature/fake reviews
4. **One review per user per job** - Database constraint enforces
5. **No disputes** - Future enhancement
6. **No photo attachments on reviews** - Future enhancement

---

## Implementation Order

1. **Database migration** - Add tables and columns
2. **Rating components** - RatingModal, star input
3. **Complete job action** - Status update logic
4. **Client dashboard updates** - Complete button, review prompt
5. **Pro dashboard updates** - Pending review prompt
6. **Submit review action** - Write to job_reviews

Each step is independently testable.

---

## Testing Checklist

After implementation:
1. Create a test job and set status to 'in_progress'
2. Manually set `assigned_professional_id` to a test pro user
3. As client, click "Mark Complete"
4. Verify completion modal appears
5. Confirm completion, verify rating modal appears
6. Submit rating, verify job_reviews row created
7. As pro, verify "Rate this client" prompt appears
8. Submit pro review with visibility='private'
9. Verify constraint prevents duplicate reviews
