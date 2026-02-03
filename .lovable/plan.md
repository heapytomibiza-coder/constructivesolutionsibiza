
# Fix: Duplicate Timing Questions Between Steps 4 and 5

## Problem Identified

Users are seeing **duplicate timing questions** in the job posting wizard:

| Step | Question | Source |
|------|----------|--------|
| **Step 4 (Questions)** | "When would you like the rewiring to be done?" / "How urgent is this job?" | Question pack `timeline`/`urgency` fields |
| **Step 5 (Logistics)** | "When do you need this done?" | LogisticsStep `startDatePreset` field |

**Database Analysis:**
- **95 of 111 packs** (86%) contain timing/urgency questions that duplicate Step 5
- Affected question IDs: `timeline`, `timing`, `urgency`, `preferred_timing`, `start_timeline`

## Solution: Filter Timing Questions at Render Time

Add a filter in `QuestionPackRenderer.tsx` to exclude questions that are already handled by Step 5 (Logistics). This is the cleanest approach because:
1. No database migration needed
2. Immediate fix
3. Preserves pack data for future use
4. Centralizes the fix in one place

## Implementation Details

### File: `src/components/wizard/canonical/steps/QuestionPackRenderer.tsx`

**Change 1: Add excluded question IDs constant**

After line 60 (after Props interface), add:

```typescript
// Question IDs that are handled by Step 5 (Logistics) and should not appear in Step 4
// This prevents duplicate timing/urgency questions across wizard steps
const LOGISTICS_HANDLED_QUESTION_IDS = new Set([
  'timeline',           // "When would you like X done?"
  'timing',             // "When do you need X?"
  'urgency',            // "How urgent is this job?"
  'preferred_timing',   // "Preferred timing for servicing?"
  'start_timeline',     // Variant timing question
]);
```

**Change 2: Update visibleQuestions filter**

Modify line 193 from:
```typescript
const visibleQuestions = uniqueQuestions.filter(shouldShowQuestion);
```

To:
```typescript
// Filter out logistics-handled questions AND apply conditional visibility
const visibleQuestions = uniqueQuestions
  .filter(q => !LOGISTICS_HANDLED_QUESTION_IDS.has(q.id))
  .filter(shouldShowQuestion);
```

## Flow After Fix

```text
Step 4 (Questions)           Step 5 (Logistics)
--------------------------   --------------------------
"What type of job?"          "Where is the work needed?"
"Do you have plans?"         "When do you need this done?" ← single source
"Who supplies materials?"    "Budget range (optional)"
"Any constraints?"           "Access details (optional)"
```

## Technical Summary

| Aspect | Details |
|--------|---------|
| **Affected file** | `src/components/wizard/canonical/steps/QuestionPackRenderer.tsx` |
| **Lines changed** | ~5 lines added |
| **Packs affected** | 95 (all will stop showing duplicate timing questions) |
| **Fallback behavior** | Preserved - questions still exist in DB for analytics |
| **Risk** | Low - filter is explicit and reversible |

## QA Checklist

| Test | Expected Result |
|------|-----------------|
| Kitchen fitting (Step 4) | Shows 6 questions (timeline filtered out) |
| Full house rewiring (Step 4) | Shows 6 questions (timeline filtered out) |
| AC emergency repair (Step 4) | Shows 5 questions (urgency filtered out) |
| Logistics step (Step 5) | Shows timing dropdown - single source of truth |
| Complete wizard and submit | Job created successfully, no duplicate data |
| Check job answers JSON | `logistics.startDatePreset` contains timing, no pack-level timing |

## Future Enhancement (Optional)

For V1 packs that haven't been seeded yet (Electrical and HVAC), we should remove the timing/urgency questions from the source files before seeding. This keeps the pack content cleaner:

1. **Electrical generic builder**: Remove `urgency` question, optionally replace with `safety_status` (trade-specific)
2. **HVAC generic builder**: Remove `urgency` question, optionally replace with `system_status` (trade-specific)
3. **All hand-crafted packs**: Remove `timeline` question

This is a content improvement that can happen separately from the render-time fix.
