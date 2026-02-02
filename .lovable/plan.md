

# Add `is_owner` Boolean to Job Details View

## Summary
Add a computed `is_owner` boolean column to the `job_details` view that returns `true` only when the currently authenticated user owns the job. This enables proper UX gating for the Message button without exposing the `user_id`.

## Why This Approach
- **Privacy-safe**: No user IDs exposed, only a boolean about the current session
- **No extra API calls**: Determined at query time
- **Clean UX**: Button hidden proactively instead of showing error after click

---

## Database Migration

### Updated `job_details` View
```sql
DROP VIEW IF EXISTS public.job_details CASCADE;

CREATE VIEW public.job_details
WITH (security_invoker = true)
AS
SELECT
  j.id,
  j.created_at,
  j.updated_at,
  j.status,
  j.title,
  j.description,
  j.teaser,
  j.highlights,
  j.category,
  j.subcategory,
  j.micro_slug,
  j.area,
  j.location,
  j.budget_type,
  j.budget_value,
  j.budget_min,
  j.budget_max,
  j.start_timing,
  j.start_date,
  j.has_photos,
  j.answers,
  j.is_publicly_listed,
  (auth.uid() = j.user_id) AS is_owner
FROM public.jobs j
WHERE j.is_publicly_listed = true;

GRANT SELECT ON public.job_details TO authenticated;
```

### Key Points
- `security_invoker = true` ensures `auth.uid()` returns the calling user's ID
- Anonymous users get `NULL` (which is falsy)
- Authenticated job owners get `true`
- Authenticated non-owners get `false`

---

## TypeScript Changes

### 1. Update `JobDetailsRow` Type

**File:** `src/pages/jobs/types.ts`

```typescript
export type JobDetailsRow = JobsBoardRow & {
  description: string | null;
  answers: JobAnswers | null;
  is_owner: boolean | null;  // ← Add this
};
```

### 2. Update Message Button Logic

**File:** `src/pages/jobs/JobDetailsModal.tsx`

Current code (lines 349-369):
```typescript
{/* Actions */}
<div className="flex flex-wrap gap-2">
  {!user ? (
    <Button onClick={handleMessage} className="gap-2">
      ...
    </Button>
  ) : (
    <Button ... >
      ...
    </Button>
  )}
</div>
```

Updated logic:
```typescript
{/* Actions */}
<div className="flex flex-wrap gap-2">
  {!user ? (
    <Button onClick={handleMessage} className="gap-2">
      <LogIn className="h-4 w-4" />
      Sign in to message
    </Button>
  ) : job.is_owner ? null : (
    <Button 
      onClick={handleMessage} 
      disabled={isMessaging || sessionLoading}
      className="gap-2"
    >
      {isMessaging ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4" />
      )}
      {isMessaging ? "Starting chat..." : "Message"}
    </Button>
  )}
  <Button variant="outline" disabled className="gap-2">
    <Share2 className="h-4 w-4" />
    Share
  </Button>
</div>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/[new].sql` | Recreate `job_details` view with `is_owner` column |
| `src/pages/jobs/types.ts` | Add `is_owner: boolean \| null` to `JobDetailsRow` |
| `src/pages/jobs/JobDetailsModal.tsx` | Update button render to check `job.is_owner` |

---

## Test Checklist

1. **As job owner**: Open your own job → Message button hidden
2. **As non-owner**: Open someone else's job → Message button visible
3. **As anonymous**: Open any job → "Sign in to message" shown
4. **RPC still works**: Click Message → navigates to thread (defense in depth)

