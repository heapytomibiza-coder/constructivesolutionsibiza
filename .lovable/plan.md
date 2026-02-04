

# Questions Step Validation Gate + V2 Test Pack

## Overview

Add validation to the Questions step that blocks "Continue" when required fields are missing or number inputs are out of min/max range. Also create a V2 test pack that exercises all V2 features in one pass.

## Current Architecture Analysis

| Component | Role |
|-----------|------|
| `CanonicalJobWizard.tsx` | Parent wizard - owns state, handles navigation, contains "Continue" button |
| `QuestionsStep.tsx` | Step 4 - fetches packs, renders them, passes answers up via `onChange` |
| `QuestionPackRenderer.tsx` | Renders individual pack questions (already V2-ready) |
| `stepValidation.ts` | Validation helpers for other steps (Step 5 Logistics already uses this pattern) |

**Key insight**: The "Continue" button lives in `CanonicalJobWizard.tsx`, but the questions/packs live in `QuestionsStep.tsx`. We need to expose a validation function from QuestionsStep or add validation to the central `canAdvance()` check.

---

## Implementation Plan

### Part 1: Add Question Pack Validation Logic

**File: `src/components/wizard/canonical/lib/stepValidation.ts`**

Add new validation helpers for Step 4 (Questions):

```text
// Add to stepValidation.ts

interface QuestionDef {
  id: string;
  type: string;
  required?: boolean;
  min?: number;
  max?: number;
  show_if?: { questionId: string; value: string | string[] };
  dependsOn?: { questionId: string; value: string | string[] };
}

interface QuestionPack {
  micro_slug: string;
  questions: QuestionDef[];
}

type ValidationErrorMap = Record<string, string>;

const isEmpty = (v: unknown): boolean => {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
};

// Check if question should be visible (respect show_if/dependsOn)
const isQuestionVisible = (
  question: QuestionDef,
  getAnswer: (qid: string) => unknown
): boolean => {
  const dep = question.show_if || question.dependsOn;
  if (!dep?.questionId) return true;
  
  const depValue = getAnswer(dep.questionId);
  const depValueArr = Array.isArray(depValue)
    ? depValue.map(String)
    : depValue != null ? [String(depValue)] : [];
  
  const requiredArr = Array.isArray(dep.value)
    ? dep.value.map(String)
    : [String(dep.value)];
  
  return requiredArr.some(v => depValueArr.includes(v));
};

export function validateQuestionPack(
  pack: QuestionPack,
  microAnswers: Record<string, Record<string, unknown>>
): ValidationErrorMap {
  const errors: ValidationErrorMap = {};
  const answers = microAnswers[pack.micro_slug] || {};
  const getAnswer = (qid: string) => answers[qid];
  
  for (const q of pack.questions) {
    // Skip hidden questions
    if (!isQuestionVisible(q, getAnswer)) continue;
    
    const v = answers[q.id];
    
    // Required check
    if (q.required && isEmpty(v)) {
      errors[q.id] = 'Required';
      continue;
    }
    
    // Number min/max validation
    if (q.type === 'number' && v != null && v !== '') {
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isNaN(n)) {
        errors[q.id] = 'Enter a valid number';
        continue;
      }
      if (typeof q.min === 'number' && n < q.min) {
        errors[q.id] = `Must be ≥ ${q.min}`;
      }
      if (typeof q.max === 'number' && n > q.max) {
        errors[q.id] = `Must be ≤ ${q.max}`;
      }
    }
  }
  
  return errors;
}

export function validateAllPacks(
  packs: QuestionPack[],
  microAnswers: Record<string, Record<string, unknown>>
): { valid: boolean; errors: Record<string, ValidationErrorMap>; firstErrorId: string | null } {
  const allErrors: Record<string, ValidationErrorMap> = {};
  let firstErrorId: string | null = null;
  
  for (const pack of packs) {
    const packErrors = validateQuestionPack(pack, microAnswers);
    if (Object.keys(packErrors).length > 0) {
      allErrors[pack.micro_slug] = packErrors;
      if (!firstErrorId) {
        firstErrorId = `${pack.micro_slug}-${Object.keys(packErrors)[0]}`;
      }
    }
  }
  
  return {
    valid: Object.keys(allErrors).length === 0,
    errors: allErrors,
    firstErrorId
  };
}
```

---

### Part 2: Update QuestionsStep to Expose Validation

**File: `src/components/wizard/canonical/steps/QuestionsStep.tsx`**

1. Accept optional `errors` prop to display inline errors
2. Expose packs via callback so parent can validate
3. Pass errors to `QuestionPackRenderer`

Changes:
- Add `errors?: Record<string, Record<string, string>>` to Props
- Add `onPacksLoaded?: (packs: QuestionPack[]) => void` to Props
- Call `onPacksLoaded(parsedPacks)` after fetch
- Pass relevant errors to each `QuestionPackRenderer`

---

### Part 3: Update QuestionPackRenderer to Show Errors

**File: `src/components/wizard/canonical/steps/QuestionPackRenderer.tsx`**

Add optional `errors` prop and display inline error messages:

```text
interface Props {
  pack: QuestionPack;
  getAnswer: (microSlug: string, questionId: string) => unknown;
  onAnswerChange: (microSlug: string, questionId: string, value: unknown) => void;
  errors?: Record<string, string>; // NEW: question_id -> error message
}

// In renderQuestion JSX, after the input:
{errors?.[question.id] && (
  <p className="text-sm text-destructive">{errors[question.id]}</p>
)}
```

---

### Part 4: Wire Validation into CanonicalJobWizard

**File: `src/components/wizard/canonical/CanonicalJobWizard.tsx`**

1. Add state for loaded packs and validation errors
2. Update `canAdvance()` for Questions step to run validation
3. Show errors inline via props

Changes:
```text
// New state
const [questionPacks, setQuestionPacks] = useState<QuestionPack[]>([]);
const [questionErrors, setQuestionErrors] = useState<Record<string, Record<string, string>>>({});

// Handler for when packs are loaded
const handlePacksLoaded = useCallback((packs: QuestionPack[]) => {
  setQuestionPacks(packs);
}, []);

// Update canAdvance for Questions step
case WizardStep.Questions: {
  // Clear errors when moving away
  if (questionPacks.length === 0) return true; // No packs = can continue
  const microAnswers = (wizardState.answers.microAnswers as Record<string, Record<string, unknown>>) || {};
  const validation = validateAllPacks(questionPacks, microAnswers);
  return validation.valid;
}

// Update handleNext to show errors before blocking
const handleNext = useCallback(() => {
  if (currentStep === WizardStep.Questions && questionPacks.length > 0) {
    const microAnswers = (wizardState.answers.microAnswers as Record<string, Record<string, unknown>>) || {};
    const validation = validateAllPacks(questionPacks, microAnswers);
    
    if (!validation.valid) {
      setQuestionErrors(validation.errors);
      if (validation.firstErrorId) {
        document.getElementById(validation.firstErrorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setQuestionErrors({});
  }
  
  // Continue with normal navigation
  if (currentStep !== WizardStep.Review && canAdvance()) {
    const nextStep = getNextStep(currentStep);
    if (nextStep) setCurrentStep(nextStep);
  }
}, [currentStep, canAdvance, questionPacks, wizardState.answers]);

// Pass to QuestionsStep
<QuestionsStep
  microSlugs={wizardState.microSlugs}
  answers={wizardState.answers}
  onChange={handleAnswersChange}
  onPacksLoaded={handlePacksLoaded}
  errors={questionErrors}
/>
```

---

### Part 5: Clear Errors on Answer Change

When user corrects an error, clear it immediately for good UX:

```text
// In CanonicalJobWizard, update handleAnswersChange:
const handleAnswersChange = useCallback(
  (answers: Record<string, unknown>) => {
    setWizardState(prev => ({ ...prev, answers }));
    
    // Clear errors for changed answers
    if (Object.keys(questionErrors).length > 0) {
      setQuestionErrors({});
    }
  },
  [questionErrors]
);
```

---

### Part 6: Create V2 Test Pack

Seed a test pack via the database to exercise all V2 features:

```sql
INSERT INTO question_packs (micro_slug, title, questions, question_order, is_active)
VALUES (
  'v2-renderer-test',
  'V2 Renderer Test Pack',
  '[
    {
      "id": "service_type",
      "label": "Service type",
      "type": "single_select",
      "required": true,
      "options": [
        {"value": "option_a", "label": "Option A"},
        {"value": "option_b", "label": "Option B"}
      ]
    },
    {
      "id": "extras",
      "label": "Extras (multi-select)",
      "type": "multi_select",
      "options": [
        {"value": "extra_1", "label": "Extra 1"},
        {"value": "extra_2", "label": "Extra 2"}
      ]
    },
    {
      "id": "details",
      "label": "Describe what you need",
      "type": "long_text",
      "required": true,
      "placeholder": "Add details..."
    },
    {
      "id": "budget",
      "label": "Budget (test min/max)",
      "type": "number",
      "min": 0,
      "max": 100,
      "step": 1
    },
    {
      "id": "docs",
      "label": "Upload documents (test accept array)",
      "type": "file",
      "accept": ["image/*", "application/pdf"]
    },
    {
      "id": "conditional_note",
      "label": "Only shown if Option B selected",
      "type": "text",
      "show_if": {"questionId": "service_type", "value": "option_b"}
    }
  ]'::jsonb,
  '["service_type", "extras", "details", "budget", "docs", "conditional_note"]',
  true
)
ON CONFLICT (micro_slug) DO UPDATE SET
  questions = EXCLUDED.questions,
  question_order = EXCLUDED.question_order,
  is_active = true;
```

Also need to add a micro-service entry to test with:
```sql
-- Get a subcategory ID to attach to
INSERT INTO service_micro_categories (subcategory_id, name, slug, display_order)
SELECT id, 'V2 Test Service', 'v2-renderer-test', 999
FROM service_subcategories
WHERE slug = 'handyman-repairs' -- or any existing subcategory
LIMIT 1
ON CONFLICT DO NOTHING;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/wizard/canonical/lib/stepValidation.ts` | Add `validateQuestionPack`, `validateAllPacks` |
| `src/components/wizard/canonical/steps/QuestionsStep.tsx` | Add `errors` and `onPacksLoaded` props |
| `src/components/wizard/canonical/steps/QuestionPackRenderer.tsx` | Add `errors` prop, display inline errors |
| `src/components/wizard/canonical/CanonicalJobWizard.tsx` | Wire validation into Continue button |
| Database | Seed V2 test pack |

---

## Acceptance Criteria

### Validation Gate
- [ ] Required fields block Continue when empty
- [ ] Number fields block Continue when out of min/max range
- [ ] Conditional (hidden) questions are NOT validated
- [ ] First error scrolls into view
- [ ] Errors clear when user corrects them
- [ ] Empty pack (no questions) still allows Continue

### V2 Test Pack
- [ ] `single_select` renders as radio buttons
- [ ] `multi_select` renders as checkboxes
- [ ] `long_text` renders as textarea
- [ ] `number` with min/max shows validation error when out of range
- [ ] Entering `0` in number field persists correctly
- [ ] `file` with accept array works for images + PDFs
- [ ] Conditional question only shows when "Option B" selected
- [ ] `question_order` respected (questions render in specified order)

---

## Test Matrix (15 mins manual testing)

1. **Permit Application** (Legal & Regulatory)
   - Verify radio/checkbox render
   - Verify file input works

2. **V2 Test Pack**
   - Select Option A → conditional hidden
   - Select Option B → conditional appears
   - Leave required field empty → Continue blocked
   - Enter budget = 150 → Continue blocked (max 100)
   - Enter budget = 0 → Continue works
   - Upload PDF → accept array works

3. **Tree Removal** (Gardening)
   - Verify question_order (if present)
   - Test full flow end-to-end

---

## Summary

| Task | Risk | Time |
|------|------|------|
| Add validation helpers | Low | 20 min |
| Update QuestionsStep | Low | 15 min |
| Update QuestionPackRenderer | Low | 10 min |
| Wire into CanonicalJobWizard | Medium | 25 min |
| Seed V2 test pack | Low | 10 min |
| Manual testing | - | 15 min |

**Total: ~1.5 hours**

All changes follow existing patterns (`stepValidation.ts` style, prop drilling for errors). Backward compatible with existing packs.

