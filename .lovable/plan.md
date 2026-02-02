
# Fix: Duplicate Timing Questions Between Steps 4 and 5

## Problem Identified

Users are experiencing **duplicate timing questions** in the job posting wizard:

| Step | Question | Source |
|------|----------|--------|
| **Step 4 (Questions)** | "When do you need the kitchen work done by?" | Question pack `timeline` field |
| **Step 5 (Logistics)** | "When do you need this done?" | LogisticsStep `startDatePreset` field |

**Root Cause:** 56 of 111 question packs (50%) include a `timeline` or `timing` question that duplicates the Logistics step's timing selector.

### Affected Packs (Sample)
- `kitchen-fitting` - "When do you need the kitchen work done by?"
- `bathroom-design` - "When would you like the design/installation to happen?"
- `wetroom-installation` - "When would you like the wetroom work done?"
- `full-house-rewiring` - "When would you like the rewiring to be done?"
- 52 more packs...

## Solution Options

### Option A: Strip timeline from packs at render time (Recommended)
Filter out `timeline`/`timing` questions in `QuestionPackRenderer` since the Logistics step already handles timing.

**Pros:**
- No database migration needed
- Immediate fix
- Preserves pack data for future use

**Cons:**
- Filtering happens on every render (negligible performance impact)

### Option B: Remove timeline from packs in database
Update all 56 packs to remove the timeline question via SQL migration.

**Pros:**
- Clean data at source

**Cons:**
- Requires migration
- May need to re-run if packs are re-seeded

### Option C: Add pack field `uses_logistics_timing: true`
Mark packs that should skip their own timing question.

**Pros:**
- Explicit opt-in

**Cons:**
- Requires schema change and pack updates

---

## Recommended Implementation (Option A)

### 1. Add Timeline Filter to QuestionPackRenderer

Filter out questions with IDs matching `timeline`, `timing`, or `preferred-date` since these are handled by Step 5 (Logistics).

```typescript
// File: src/components/wizard/canonical/steps/QuestionPackRenderer.tsx

// Add after line 73 (after uniqueQuestions useMemo)
const EXCLUDED_QUESTION_IDS = ['timeline', 'timing', 'preferred-date'];

// Modify the visibleQuestions filter
const visibleQuestions = uniqueQuestions
  .filter(q => !EXCLUDED_QUESTION_IDS.includes(q.id))  // Remove timing duplicates
  .filter(shouldShowQuestion);
```

### 2. Why This Works

- Step 4 (Questions) focuses on **trade-specific project details**
- Step 5 (Logistics) handles **location, timing, and budget** uniformly
- The pack's timeline question is now redundant and confusing

### 3. Data Preservation

The timeline answers from packs are still collected if users filled them before this fix, but new submissions will have timing cleanly in the Logistics step only.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/wizard/canonical/steps/QuestionPackRenderer.tsx` | Add `EXCLUDED_QUESTION_IDS` filter to remove timing/timeline questions |

---

## Technical Details

### Current Flow (Broken)
```text
Step 4 (Questions)           Step 5 (Logistics)
------------------------     ------------------------
"What type of job?"          "Where is the work needed?"
"Do you have plans?"         "When do you need this done?" <-- DUPLICATED
"When do you need it?"  -->  "Budget range?"
```

### Fixed Flow
```text
Step 4 (Questions)           Step 5 (Logistics)
------------------------     ------------------------
"What type of job?"          "Where is the work needed?"
"Do you have plans?"         "When do you need this done?"
"Who supplies materials?"    "Budget range?"
                             (single source of truth for timing)
```

---

## Implementation

```typescript
// QuestionPackRenderer.tsx - Add filter for timing questions

// These question IDs are handled by the Logistics step (Step 5)
// and should not appear in the Questions step (Step 4)
const LOGISTICS_HANDLED_QUESTION_IDS = new Set([
  'timeline',
  'timing', 
  'preferred-date',
  'start_timeline',
]);

// In the component, modify visibleQuestions:
const visibleQuestions = uniqueQuestions
  .filter(q => !LOGISTICS_HANDLED_QUESTION_IDS.has(q.id))
  .filter(shouldShowQuestion);
```

---

## QA Checklist

| Test | Expected |
|------|----------|
| Kitchen fitting pack (Step 4) | Shows 6 questions (not 7) - timeline removed |
| Logistics step (Step 5) | Shows timing dropdown - single source |
| Submit job | No duplicate timing data in answers |
| Other packs without timeline | No change in behavior |
