

# V2 QuestionPackRenderer Improvements

## Overview
Upgrade the `QuestionPackRenderer` component to be fully V2-compatible with improved validation, type support, and future-ready file handling.

## Current State Analysis

Based on code review and database audit:

| Current Types | Database Count | Status |
|--------------|----------------|--------|
| `radio` | 982 | ✅ Supported |
| `select` | 327 | ✅ Supported (renders as radio) |
| `file` | 152 | ⚠️ Partial (stores filename only) |
| `textarea` | 119 | ✅ Supported |
| `checkbox` | 65 | ✅ Supported |
| `text` | 2 | ✅ Supported |
| `number` | 0 | ✅ Supported but has bug |

**Issues Found:**
1. **Number input bug** - Line 122: `(value as number) || ''` treats `0` as falsy
2. **No V2 type aliases** - `single_select`/`multi_select` not mapped
3. **File handling** - Only stores filename, no actual upload
4. **No min/max validation** - Number inputs ignore constraints
5. **No `question_order` support** - Uses array order only

---

## Implementation Plan

### PR1: V2 Type Aliases + Question Order Support
*Estimated: 30-45 minutes*

**Changes to `QuestionPackRenderer.tsx`:**

1. Add type normalization function:
```text
const normalizeQuestionType = (type: string): QuestionDef['type'] => {
  switch (type) {
    case 'single_select': return 'radio';
    case 'multi_select': return 'checkbox';
    case 'long_text': return 'textarea';
    default: return type as QuestionDef['type'];
  }
};
```

2. Add question ordering:
```text
const getOrderedQuestions = (pack: QuestionPack): QuestionDef[] => {
  const questions = pack.questions || [];
  const order = (pack as any).question_order as string[] | undefined;
  
  if (!order?.length) return questions;
  
  const byId = new Map(questions.map(q => [q.id, q]));
  const ordered = order.map(id => byId.get(id)).filter(Boolean) as QuestionDef[];
  const unordered = questions.filter(q => !order.includes(q.id));
  
  return [...ordered, ...unordered];
};
```

3. Update `uniqueQuestions` memo to use ordered questions

**Acceptance Criteria:**
- V2 packs with `single_select` render as radio buttons
- V2 packs with `multi_select` render as checkboxes
- Packs with `question_order` array render in that order
- No changes needed to existing packs

---

### PR2: Number Input Bug Fix + Min/Max Validation
*Estimated: 30-45 minutes*

**Changes to `QuestionPackRenderer.tsx`:**

1. Fix the zero-value bug (line 122):
```text
// BEFORE
value={(value as number) || ''}

// AFTER
value={value ?? ''}
```

2. Add min/max/step props to interface:
```text
interface QuestionDef {
  // ... existing fields
  min?: number;
  max?: number;
  step?: number;
}
```

3. Update number input rendering:
```text
case 'number':
  return (
    <Input
      id={key}
      type="number"
      placeholder={question.placeholder}
      value={value ?? ''}
      min={question.min}
      max={question.max}
      step={question.step}
      onChange={(e) => {
        const num = e.target.valueAsNumber;
        onAnswerChange(pack.micro_slug, question.id, Number.isNaN(num) ? null : num);
      }}
    />
  );
```

**Acceptance Criteria:**
- Entering `0` displays correctly and submits as `0`
- Min/max attributes render on the input
- Browser-native validation shows for out-of-range values

---

### PR3: File Input Accept Array Normalization
*Estimated: 15-20 minutes*

**Changes to `QuestionPackRenderer.tsx`:**

1. Update interface:
```text
interface QuestionDef {
  // ... existing fields
  accept?: string | string[];
}
```

2. Add helper:
```text
const normalizeAccept = (accept?: string | string[]): string => {
  if (!accept) return 'image/*';
  return Array.isArray(accept) ? accept.join(',') : accept;
};
```

3. Update file input:
```text
case 'file':
  return (
    <Input
      id={key}
      type="file"
      accept={normalizeAccept(question.accept)}
      onChange={...}
    />
  );
```

**Acceptance Criteria:**
- File input accepts `accept: ["image/*", "application/pdf"]` format
- String format still works: `accept: "image/*"`
- No regressions for existing packs

---

### PR4: File Upload - Honest MVP Stub
*Estimated: 20-30 minutes*

Since no actual file storage is implemented yet, we should make the UX honest:

**Changes to `QuestionPackRenderer.tsx`:**

1. Update file rendering to show clear placeholder status:
```text
case 'file':
  const fileNames = (value as string[]) || [];
  return (
    <div className="space-y-2">
      <Input
        id={key}
        type="file"
        accept={normalizeAccept(question.accept)}
        onChange={(e) => {
          const files = e.target.files;
          onAnswerChange(
            pack.micro_slug, 
            question.id, 
            files ? Array.from(files).map(f => f.name) : []
          );
        }}
      />
      {fileNames.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Selected: {fileNames.join(', ')} 
          <span className="italic"> (uploads after job is posted)</span>
        </p>
      )}
    </div>
  );
```

**Acceptance Criteria:**
- User sees clear feedback that files are selected but upload is deferred
- No misleading "uploaded" status
- Prepares for real Storage integration later

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/wizard/canonical/steps/QuestionPackRenderer.tsx` | Type aliases, question order, number fix, accept array, file stub |
| `src/components/wizard/canonical/steps/QuestionsStep.tsx` | No changes needed (types flow through) |

---

## Summary

| PR | Scope | Risk | Time |
|----|-------|------|------|
| PR1 | V2 type aliases + question_order | Low | 30-45 min |
| PR2 | Number `0` fix + min/max | Low | 30-45 min |
| PR3 | Accept array normalization | Minimal | 15-20 min |
| PR4 | Honest file upload stub | Low | 20-30 min |

**Total estimated time: 1.5-2.5 hours**

All changes are backward-compatible. Existing packs continue to work unchanged.

