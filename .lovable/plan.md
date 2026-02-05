

# Wire Auto-Verification & Use Matching Scores for Ranking

## Overview

Complete the two missing wires in the professional matching system:

1. **Wire auto-verification**: Call `increment_professional_micro_stats` when a client reviews a professional
2. **Use matching scores**: Rank professionals using the `professional_matching_scores` view

---

## Current State (Verified)

| Component | Status |
|-----------|--------|
| `increment_professional_micro_stats` RPC | Exists, params: `p_user_id`, `p_micro_id`, `p_rating?` |
| `professional_matching_scores` view | Exists with `user_id`, `micro_id`, `match_score`, `preference`, etc. |
| `submitReview` action | Exists but doesn't trigger stats update |
| Professionals page | Exists but doesn't use matching scores for ranking |

---

## Implementation

### Part 1: Wire Auto-Verification Trigger

**Problem**: The RPC exists but is never called when jobs complete/reviews submit.

**Solution**: Call the RPC after a client submits a review for a professional.

#### Step 1: Create Helper Function

**File: `src/pages/jobs/actions/awardProStats.action.ts`** (NEW)

```typescript
import { supabase } from '@/integrations/supabase/client';

interface AwardProStatsParams {
  professionalUserId: string;
  microIds: string[];
  rating?: number | null;
}

/**
 * Award stats to a professional for completed job micros.
 * Should be called when a CLIENT reviews a PROFESSIONAL (not the other way around).
 * This drives the verification ladder: unverified → progressing → verified → expert
 */
export async function awardProStats({
  professionalUserId,
  microIds,
  rating,
}: AwardProStatsParams): Promise<{ success: boolean; error?: string }> {
  if (!professionalUserId || microIds.length === 0) {
    return { success: true }; // No-op, not an error
  }

  try {
    // Call RPC for each micro (they're independent skill tracks)
    for (const microId of microIds) {
      const { error } = await supabase.rpc('increment_professional_micro_stats', {
        p_user_id: professionalUserId,
        p_micro_id: microId,
        p_rating: rating ?? undefined, // undefined = null in RPC
      });

      if (error) {
        console.error(`Failed to award stats for micro ${microId}:`, error);
        // Continue with other micros even if one fails
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Error awarding pro stats:', err);
    return { success: false, error: 'Failed to update professional stats' };
  }
}
```

#### Step 2: Update submitReview to Trigger Stats

**File: `src/pages/jobs/actions/submitReview.action.ts`**

After the review insert succeeds, if the reviewer is a client (rating a pro), fetch the job's micro IDs and call the stats RPC.

```typescript
// After successful insert, add:

// Only award stats when CLIENT rates PROFESSIONAL
if (reviewerRole === 'client') {
  // Get micro IDs from job answers
  const { data: job } = await supabase
    .from('jobs')
    .select('answers')
    .eq('id', jobId)
    .single();

  if (job?.answers) {
    const answers = job.answers as { selected?: { microIds?: string[] } };
    const microIds = answers.selected?.microIds ?? [];
    
    if (microIds.length > 0) {
      await awardProStats({
        professionalUserId: revieweeId,
        microIds,
        rating,
      });
    }
  }
}
```

#### Why Only Client → Pro Reviews?

The verification system measures **professional competence** proven by client satisfaction:
- Client rates pro → counts toward verification (public reputation)
- Pro rates client → private signal, doesn't affect pro verification

---

### Part 2: Use Matching Scores for Ranking

**Problem**: The Professionals page doesn't use `professional_matching_scores` to rank results.

**Solution**: When filtering by category/subcategory, aggregate match scores per professional and sort.

#### Step 1: Create Ranked Query Helper

**File: `src/pages/public/queries/rankedProfessionals.query.ts`** (NEW)

```typescript
import { supabase } from '@/integrations/supabase/client';

interface RankedProfessional {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  services_count: number | null;
  verification_status: string | null;
  match_score: number;
  coverage: number;
}

/**
 * Fetch professionals ranked by match score for given micro IDs.
 * Used when category/subcategory filters are applied.
 */
export async function getRankedProfessionals(
  microIds: string[]
): Promise<RankedProfessional[]> {
  if (!microIds.length) return [];

  // Step 1: Get match scores from the view
  const { data: scores, error: scoresError } = await supabase
    .from('professional_matching_scores')
    .select('user_id, micro_id, match_score, status, preference, verification_level')
    .in('micro_id', microIds)
    .neq('status', 'paused'); // Exclude paused services

  if (scoresError) throw scoresError;
  if (!scores?.length) return [];

  // Step 2: Aggregate scores per user
  const userScores = new Map<string, { totalScore: number; coveredMicros: Set<string> }>();
  
  for (const row of scores) {
    const userId = row.user_id as string;
    const score = Number(row.match_score ?? 0);
    const microId = row.micro_id as string;

    if (!userScores.has(userId)) {
      userScores.set(userId, { totalScore: 0, coveredMicros: new Set() });
    }
    
    const entry = userScores.get(userId)!;
    entry.totalScore += score;
    entry.coveredMicros.add(microId);
  }

  // Step 3: Rank by coverage first, then score
  const rankedUserIds = [...userScores.entries()]
    .map(([userId, data]) => ({
      userId,
      score: data.totalScore,
      coverage: data.coveredMicros.size / microIds.length,
    }))
    .sort((a, b) => {
      // Primary: coverage (pros who cover more of the job rank higher)
      if (b.coverage !== a.coverage) return b.coverage - a.coverage;
      // Secondary: match score
      return b.score - a.score;
    });

  // Step 4: Fetch profile details for ranked users
  const userIds = rankedUserIds.map(u => u.userId);
  
  const { data: profiles, error: profilesError } = await supabase
    .from('professional_profiles')
    .select('id, user_id, display_name, avatar_url, services_count, verification_status')
    .in('user_id', userIds)
    .eq('is_publicly_listed', true);

  if (profilesError) throw profilesError;

  // Step 5: Merge and return in ranked order
  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
  
  return rankedUserIds
    .filter(r => profileMap.has(r.userId))
    .map(r => ({
      ...profileMap.get(r.userId)!,
      match_score: r.score,
      coverage: r.coverage,
    }));
}
```

#### Step 2: Update Professionals Page to Use Ranked Query

**File: `src/pages/public/Professionals.tsx`**

Replace the current filtering logic with the ranked query when filters are applied:

```typescript
// Import the new query
import { getRankedProfessionals } from './queries/rankedProfessionals.query';

// In the main query:
queryFn: async (): Promise<Professional[]> => {
  if (categoryId || subcategoryId) {
    // Get micro IDs for the filter
    let microQuery = supabase
      .from('service_micro_categories')
      .select('id, subcategory_id');

    if (subcategoryId) {
      microQuery = microQuery.eq('subcategory_id', subcategoryId);
    }

    const { data: micros } = await microQuery;
    let microIds: string[] = [];
    
    if (subcategoryId) {
      microIds = (micros || []).map(m => m.id);
    } else if (categoryId) {
      const { data: subs } = await supabase
        .from('service_subcategories')
        .select('id')
        .eq('category_id', categoryId);
      const subIds = (subs || []).map(s => s.id);
      microIds = (micros || [])
        .filter(m => subIds.includes(m.subcategory_id))
        .map(m => m.id);
    }

    if (microIds.length === 0) return [];

    // ✅ USE RANKED QUERY instead of basic filter
    return getRankedProfessionals(microIds);
  }

  // No filters - return all publicly listed (no ranking needed)
  const { data, error } = await supabase
    .from('professional_profiles')
    .select('id, user_id, display_name, avatar_url, services_count, verification_status')
    .eq('is_publicly_listed', true);

  if (error) throw error;
  return (data || []).map(p => ({ ...p, match_score: 0, coverage: 0 }));
}
```

---

## Files Summary

| File | Action |
|------|--------|
| `src/pages/jobs/actions/awardProStats.action.ts` | CREATE - Helper to call stats RPC |
| `src/pages/jobs/actions/submitReview.action.ts` | MODIFY - Call awardProStats after client reviews pro |
| `src/pages/jobs/actions/index.ts` | MODIFY - Export new action |
| `src/pages/public/queries/rankedProfessionals.query.ts` | CREATE - Ranked professionals query |
| `src/pages/public/Professionals.tsx` | MODIFY - Use ranked query when filtering |

---

## How It Works End-to-End

### Verification Flow

```text
Client completes job
       ↓
Client submits rating (4★)
       ↓
submitReview() inserts review
       ↓
awardProStats() called with:
  - professionalUserId
  - microIds from job.answers.selected.microIds
  - rating: 4
       ↓
RPC increment_professional_micro_stats()
       ↓
Stats updated:
  - completed_jobs_count++
  - rating_count++
  - total_rating_sum += 4
       ↓
Auto-verification check:
  - 1 job → progressing
  - 3 jobs + 4.0★ avg → verified
  - 10 jobs + 4.5★ avg → expert
```

### Ranking Flow

```text
User visits /professionals?category=plumbing
       ↓
Get all micro_ids under "Plumbing" category
       ↓
Query professional_matching_scores WHERE micro_id IN (...)
       ↓
Aggregate per user:
  - totalScore = sum of match_scores
  - coverage = (micros covered / micros requested)
       ↓
Sort by: coverage DESC, totalScore DESC
       ↓
Fetch profile details in ranked order
       ↓
Display ranked list
```

---

## Scoring Formula (Already in View)

The `professional_matching_scores` view calculates:

```sql
match_score = 
  CASE preference 
    WHEN 'love' THEN 30
    WHEN 'like' THEN 20
    WHEN 'neutral' THEN 10
    WHEN 'avoid' THEN -50
  END
  + (completed_jobs_count * 2)
  + (COALESCE(avg_rating, 0) * 5)
  + CASE verification_level 
      WHEN 'expert' THEN 50
      WHEN 'verified' THEN 30
      WHEN 'progressing' THEN 10
      ELSE 0
    END
```

This means:
- Pros who **love** tasks rank higher
- Pros with **more completions** rank higher
- Pros with **better ratings** rank higher
- **Verified/Expert** pros rank highest

---

## Idempotency (Preventing Double-Count)

The current RPC will increment on every call. To prevent double-counting the same job:

**Option A (Quick)**: Check if review already exists before calling RPC
- Already handled by submitReview's unique constraint (error code 23505)

**Option B (Robust)**: Add a job_id parameter to the RPC and track awarded jobs
- Would require DB migration to add `professional_micro_awards` table
- Can be added later if gaming becomes an issue

For now, Option A is sufficient because:
1. Reviews have a unique constraint (job_id + reviewer_user_id)
2. Stats only update on successful review insert
3. Duplicate review attempts fail before stats update

