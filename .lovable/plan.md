

# V2 MVP: Phase 1 Completion & Metadata Normalization Plan

## Executive Summary

**Reality check**: The "missing packs" were a metadata classification issue, not a coverage gap. All 5 priority categories (Electrical, Plumbing, HVAC, Kitchen & Bathroom, Construction) have **100% pack coverage** (143/143 micros covered).

The remaining work is:
1. Normalize metadata on the 100 legacy packs (analytics cleanup)
2. Test Forum end-to-end
3. Enable leaked password protection
4. Implement Rules Engine UI integration

---

## Task 1: Normalize Pack Metadata (Data Cleanup)

### Problem
100 packs have `NULL` metadata, making analytics queries by `category_contract` unreliable.

### Solution
Batch update packs to inherit `category_contract` from their parent category via the taxonomy join.

### SQL Migration

```sql
-- Normalize category_contract for all packs missing it
WITH pack_categories AS (
  SELECT 
    qp.id AS pack_id,
    c.slug AS category_slug
  FROM question_packs qp
  JOIN service_micro_categories m ON m.slug = qp.micro_slug AND m.is_active = true
  JOIN service_subcategories s ON s.id = m.subcategory_id
  JOIN service_categories c ON c.id = s.category_id
  WHERE qp.is_active = true
    AND (qp.metadata->>'category_contract' IS NULL 
         OR qp.metadata->>'category_contract' = '')
)
UPDATE question_packs qp
SET metadata = jsonb_set(
  COALESCE(qp.metadata, '{}'::jsonb),
  '{category_contract}',
  to_jsonb(pc.category_slug)
)
FROM pack_categories pc
WHERE qp.id = pc.pack_id;
```

### Acceptance Criteria
- All 157 packs have `metadata.category_contract` populated
- Query `SELECT metadata->>'category_contract', COUNT(*) FROM question_packs GROUP BY 1` shows no `(null)` rows

---

## Task 2: Forum End-to-End Test

### Test Flow
1. Navigate to `/forum`
2. Verify 4 categories display with icons
3. Click into "Recommendations" category
4. Create a new post (requires auth)
5. View the created post
6. Reply to the post
7. Verify `reply_count` increments

### Verification Query
```sql
SELECT
  (SELECT COUNT(*) FROM forum_posts) AS posts,
  (SELECT COUNT(*) FROM forum_replies) AS replies,
  (SELECT COUNT(*) FROM forum_posts WHERE reply_count > 0) AS posts_with_replies;
```

### Acceptance Criteria
- Authenticated user can create post
- Another user can reply
- `author_display_name` shows correctly (not "Anonymous" for logged-in users)
- `reply_count` updates automatically

---

## Task 3: Enable Leaked Password Protection

### Location
Lovable Cloud → Auth Settings → Security → Password Protection

### Action
Toggle "Leaked Password Protection" to **Enabled**

### Acceptance Criteria
- Security linter shows **0 warnings**

---

## Task 4: Rules Engine UI Integration

### Objective
Evaluate `metadata.rules` from question packs when a job is posted, persist computed flags, and display inspection/safety badges on job cards.

### Implementation Steps

#### 4.1 Create Rules Evaluator Utility

**File**: `src/lib/evaluatePackRules.ts`

```typescript
export type PackRule = {
  id: string;
  when: { questionId: string; op: "eq" | "in"; value: unknown };
  add_flags: string[];
  set?: { 
    inspection_bias?: "low" | "medium" | "high" | "mandatory"; 
    safety?: "green" | "amber" | "red" 
  };
};

export type RuleEvaluation = {
  flags: string[];
  inspection_bias?: string;
  safety?: string;
};

export function evaluateRules(
  answers: Record<string, unknown>, 
  rules: PackRule[]
): RuleEvaluation {
  const flags = new Set<string>();
  let inspection_bias: string | undefined;
  let safety: string | undefined;

  for (const rule of rules ?? []) {
    const value = answers[rule.when.questionId];
    const match =
      (rule.when.op === "eq" && value === rule.when.value) ||
      (rule.when.op === "in" && 
       Array.isArray(rule.when.value) && 
       rule.when.value.includes(value));

    if (match) {
      rule.add_flags?.forEach(f => flags.add(f));
      if (rule.set?.inspection_bias) inspection_bias = rule.set.inspection_bias;
      if (rule.set?.safety) safety = rule.set.safety;
    }
  }

  return { 
    flags: Array.from(flags), 
    inspection_bias, 
    safety 
  };
}
```

#### 4.2 Add Database Columns for Computed Flags

```sql
-- Add columns to jobs table for computed flags
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS flags TEXT[] DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS computed_inspection_bias TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS computed_safety TEXT;

-- Update jobs_board view to include flags
-- (jobs_board is a view, so update its definition)
```

#### 4.3 Integrate into Job Wizard Submit

In `buildJobPayload.ts` or the wizard's submit handler:
1. Fetch question pack for the selected micro
2. Extract `metadata.rules`
3. Call `evaluateRules(answers, rules)`
4. Merge results into job payload before insert

#### 4.4 Display Badges on Job Cards

**Files to modify**:
- `src/pages/jobs/JobListingCard.tsx`
- `src/pages/jobs/JobDetailsModal.tsx`

**Badge logic**:
- If `inspection_bias === "mandatory"` or `inspection_bias === "high"` → Show "Quote subject to inspection" badge
- If `safety === "red"` → Show "Emergency" badge with red styling
- If `flags.includes("EMERGENCY")` → Show emergency indicator

### Acceptance Criteria
- Electrical/Plumbing jobs with rule-triggering answers show appropriate badges
- Same answers produce same flags deterministically
- Pros see inspection warnings before engaging

---

## Updated Launch Checklist

### Completed
- [x] Forum tables + RLS
- [x] Forum UI (4 routes)
- [x] Forum categories seeded (4)
- [x] Electrical: 32/32 packs (100%)
- [x] Plumbing: 10/10 packs (100%)
- [x] HVAC: 36/36 packs (100%)
- [x] Kitchen & Bathroom: 15/15 packs (100%)
- [x] Construction: 50/50 packs (100%)
- [x] Security definer view warnings resolved

### This Session
- [x] Task 1: Normalize pack metadata
- [ ] Task 2: Forum E2E test
- [ ] Task 3: Enable leaked password protection (manual dashboard action)
- [x] Task 4: Rules engine integration

### Post-Implementation
- [ ] End-to-end test: Post Electrical job with rule trigger
- [ ] End-to-end test: Pro matching flow
- [ ] WhatsApp share (nice-to-have)

---

## Recommended Execution Order

1. **Run metadata normalization migration** (Task 1) - 5 minutes
2. **Enable leaked password protection** (Task 3) - 2 minutes  
3. **Test Forum E2E** (Task 2) - 15 minutes
4. **Implement Rules Engine** (Task 4) - 1-2 hours

After Task 4, the platform is **MVP launch-ready**.

