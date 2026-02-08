
# Fix Wizard Step 4 Progression Issue

## Problem Identified

The wizard gets stuck at Step 4 (Questions) because validation is applied to questions that aren't displayed:

| Question Type | Displayed in UI | Validated | Result |
|---------------|-----------------|-----------|--------|
| Radio/Select | ✅ Yes | ✅ Yes | OK |
| Checkbox | ✅ Yes | ✅ Yes | OK |
| Text/Textarea | ❌ No | ✅ Yes | BLOCKED |
| Logistics IDs (timeline, urgency) | ❌ No | ✅ Yes | BLOCKED |

The validation logic needs to match the display logic.

---

## Solution

Update `validateAllPacks()` in `stepValidation.ts` to skip questions that aren't displayed in the QuestionsStep UI.

---

## File Changes

### `src/components/wizard/canonical/lib/stepValidation.ts`

Add the same filtering logic used by QuestionsStep to the validation:

```typescript
// Add these constants (same as QuestionsStep uses)
const LOGISTICS_EXACT_IDS = new Set(['timeline', 'timing', 'urgency', 'preferred_timing', 'start_timeline']);
const LOGISTICS_SUFFIXES = ['_urgency', '_timing', '_timeline'];
const TILE_TYPES = new Set(['radio', 'select', 'checkbox', 'single_select', 'multi_select']);

const isLogisticsHandled = (questionId: string): boolean => {
  if (LOGISTICS_EXACT_IDS.has(questionId)) return true;
  return LOGISTICS_SUFFIXES.some(suffix => questionId.endsWith(suffix));
};

const isDisplayedInQuestionsStep = (question: QuestionDefForValidation): boolean => {
  // Skip logistics-handled questions
  if (isLogisticsHandled(question.id)) return false;
  
  // Only tile types are displayed
  const type = question.type;
  return TILE_TYPES.has(type);
};

// Update validateQuestionPack to skip non-displayed questions
export function validateQuestionPack(
  pack: QuestionPackForValidation,
  microAnswers: Record<string, Record<string, unknown>>
): ValidationErrorMap {
  const errors: ValidationErrorMap = {};
  const answers = microAnswers[pack.micro_slug] || {};
  const getAnswer = (qid: string) => answers[qid];
  
  for (const q of pack.questions) {
    // Skip questions not displayed in QuestionsStep
    if (!isDisplayedInQuestionsStep(q)) continue;  // <-- ADD THIS
    
    // Skip hidden questions (conditional)
    if (!isQuestionVisible(q, getAnswer)) continue;
    
    // Skip file inputs
    if (q.type === 'file') continue;
    
    // ... rest of validation
  }
  
  return errors;
}
```

---

## Technical Details

**Constants to add (lines ~95-110):**

```typescript
// Question IDs handled by Logistics step - exact matches or suffix patterns
const LOGISTICS_EXACT_IDS = new Set(['timeline', 'timing', 'urgency', 'preferred_timing', 'start_timeline']);
const LOGISTICS_SUFFIXES = ['_urgency', '_timing', '_timeline'];

// Types that show as tappable tiles in QuestionsStep
const TILE_TYPES = new Set(['radio', 'select', 'checkbox', 'single_select', 'multi_select']);

const isLogisticsHandled = (questionId: string): boolean => {
  if (LOGISTICS_EXACT_IDS.has(questionId)) return true;
  return LOGISTICS_SUFFIXES.some(suffix => questionId.endsWith(suffix));
};

const isDisplayedInQuestionsStep = (question: QuestionDefForValidation): boolean => {
  // Skip logistics-handled questions
  if (isLogisticsHandled(question.id)) return false;
  
  // Only tile types are displayed
  return TILE_TYPES.has(question.type);
};
```

**Update to validateQuestionPack (line ~147):**

```typescript
for (const q of pack.questions) {
  // Skip questions not displayed in QuestionsStep UI
  if (!isDisplayedInQuestionsStep(q)) continue;
  
  // ... existing validation
}
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/wizard/canonical/lib/stepValidation.ts` | Add display-matching logic to validation |

---

## Testing After Fix

1. Start the wizard from `/post`
2. Select Pool & Spa → Pool Maintenance → Pool Cleaning
3. Answer all displayed tile questions
4. Click "✓ Continue to next step" after the last question
5. Verify wizard advances to Step 5 (Logistics)

---

## Why This Works

By synchronizing the validation logic with the display logic, we ensure:
- Only questions the user can see and answer are validated
- Logistics questions (timeline, urgency) are validated in their own step (Step 5)
- Non-tile questions (text/textarea) don't block progression since they aren't shown

---

## Auth Testing Note

The auth flow is working correctly. The 400 error for `alex@blackbookibiza.com` was simply "Invalid login credentials" - the test password was incorrect. If you need to test with Alex's account, use the correct password or request a password reset via `/auth/forgot-password`.
