

# Step 4 Contract Lock - Implementation Plan

## Answers to Your Questions (A, B, C)

### Answer A: Fallback Strategy for Soft Launch

**Recommendation:** Pack + explicit fallback pack (Option 2)

**Rationale:**
- Currently 94 packs exist in DB, 192 micro-services have no pack
- 78/94 (83%) are generic packs (contain "Briefly describe" or similar)
- **6 strong packs exist in source code but ARE NOT IN THE DATABASE** ← Critical gap
- Fallback `general-project` pack prevents dead-ends during QA and early users

**UI Behavior:**
| State | Pack Source | UI Label |
|-------|-------------|----------|
| Strong pack found | `question_packs` table | "Professional Briefing" |
| Generic pack found | `question_packs` table | "General Briefing" (subtle notice) |
| No pack → fallback | `general-project` fallback | "General Briefing (we're upgrading this service)" |
| Missing + no fallback | — | Placeholder + `_pack_missing` flag |

---

### Answer B: The 6 Strong Packs (Source Locations)

**Critical Finding: These packs exist in source but are NOT in the database.**

**Plumbing Packs** - `supabase/functions/_shared/plumbingQuestionPacks.ts`:

```typescript
// 1. burst-pipe (6 trade-specific questions)
// Lines 32-118 - questions: pipe_location, water_flow, water_isolation, pipe_type, visible_damage, property_type

// 2. sewer-backup (6 trade-specific questions)  
// Lines 123-204 - questions: symptoms, affected_areas, property_type, previous_issues, access_points, building_occupancy

// 3. water-heater-emergency (6 trade-specific questions)
// Lines 210-298 - questions: system_type, main_issue, leak_severity, isolation, location, age
```

**Carpentry Packs** - `supabase/functions/_shared/carpentryQuestionPacks.ts`:

```typescript
// 1. bespoke-tables (8 questions with conditionals)
// Lines 131-225 - questions: table_type, seating_capacity (dependsOn: table_type=dining), 
//   table_shape, size_specs, wood_finish, special_features, budget_range

// 2. sliding-door-wardrobes (7 questions)
// Lines 228-319 - questions: wardrobe_width, wardrobe_height, door_panels, door_finish, 
//   internal_layout, room_type, installation_timeline

// 3. staircases-handrails (8 questions)
// Lines 322-414 - questions: project_type, staircase_type, step_count, material_preference,
//   handrail_style, building_regs, access_difficulty
```

**Source Format vs DB Format:**
| Source Field | DB Field (after seedpacks normalization) |
|--------------|------------------------------------------|
| `question` | `label` |
| `dependsOn` | `show_if` (not yet implemented in seeder) |
| `helpText` | `help` |
| `single` type | `radio` type |
| `multi` type | `checkbox` type |

---

### Answer C: Renderer Step 4 Uses

**Two files work together:**

1. **`src/components/wizard/canonical/steps/QuestionsStep.tsx`**
   - Fetches packs from DB by `micro_slug`
   - Handles fallback to `general-project` if no packs found
   - Tracks missing packs in state
   - Passes packs to renderer

2. **`src/components/wizard/canonical/steps/QuestionPackRenderer.tsx`**
   - Renders individual question pack
   - Supports: `text`, `number`, `textarea`, `radio`, `select`, `checkbox`
   - **Missing:** `file` type, `dependsOn`/`show_if` conditionals, `help` text

---

## Phase 1: Seed the 6 Strong Packs (Immediate)

### Problem
The strong packs exist in TypeScript files but have never been seeded to the database.

### Solution
Seed plumbing + carpentry packs via the `seedpacks` edge function.

### Implementation Steps

1. **Create a seeding script** that imports the packs and POSTs to seedpacks:

```bash
# Test with dry run first
curl -X POST "https://ngwbpuxltyfweikdupoj.supabase.co/functions/v1/seedpacks?dry_run=1" \
  -H "Content-Type: application/json" \
  -d '{"packs": [/* plumbingQuestionPacks + first 3 carpentryQuestionPacks */]}'

# Then live
curl -X POST "https://ngwbpuxltyfweikdupoj.supabase.co/functions/v1/seedpacks" \
  -H "Content-Type: application/json" \
  -d '{"packs": [...]}'
```

2. **Verify seeding worked:**
```sql
SELECT micro_slug, title, jsonb_array_length(questions) as q_count
FROM question_packs 
WHERE micro_slug IN ('burst-pipe', 'sewer-backup', 'water-heater-emergency',
                     'bespoke-tables', 'sliding-door-wardrobes', 'staircases-handrails')
  AND is_active = true;
```

**Expected result:** 6 rows with 6-8 questions each

---

## Phase 2: Fix Renderer Gaps

### Current Gaps in QuestionPackRenderer.tsx

| Feature | Source Packs Use It | Renderer Support |
|---------|---------------------|------------------|
| `type: 'file'` | ✅ Yes (carpentry) | ❌ Missing |
| `dependsOn` conditionals | ✅ Yes (bespoke-tables) | ❌ Missing |
| `helpText` / `help` | ✅ Yes (some packs) | ❌ Not displayed |

### Changes Required

**File:** `src/components/wizard/canonical/steps/QuestionPackRenderer.tsx`

1. **Add `file` type support:**
```typescript
case 'file':
  return (
    <Input
      id={key}
      type="file"
      accept={question.accept || 'image/*'}
      onChange={(e) => {
        const files = e.target.files;
        onAnswerChange(pack.micro_slug, question.id, files ? Array.from(files).map(f => f.name) : []);
      }}
    />
  );
```

2. **Add conditional visibility:**
```typescript
// Add to QuestionDef interface
interface QuestionDef {
  // ... existing fields
  dependsOn?: {
    questionId: string;
    value: string | string[];
  };
  show_if?: {
    questionId: string;
    value: string | string[];
  };
  help?: string;
}

// Add visibility check function
const shouldShowQuestion = (question: QuestionDef): boolean => {
  const dep = question.dependsOn || question.show_if;
  if (!dep) return true;
  
  const depValue = getAnswer(pack.micro_slug, dep.questionId);
  if (Array.isArray(dep.value)) {
    return dep.value.includes(depValue as string);
  }
  return depValue === dep.value;
};

// Filter questions in render
{uniqueQuestions.filter(shouldShowQuestion).map((question) => (...))}
```

3. **Add help text display:**
```typescript
// In the question render block
<div key={question.id} className="space-y-2">
  <Label htmlFor={`${pack.micro_slug}-${question.id}`}>
    {question.label}
    {question.required && <span className="text-destructive ml-1">*</span>}
  </Label>
  {question.help && (
    <p className="text-sm text-muted-foreground">{question.help}</p>
  )}
  {renderQuestion(question)}
</div>
```

---

## Phase 3: Add Quality Tier Labeling

### UI Communication

**File:** `src/components/wizard/canonical/steps/QuestionsStep.tsx`

Add visual distinction for pack quality:

```typescript
// After fetching packs, determine quality tier
const getPackQualityTier = (pack: QuestionPack): 'strong' | 'generic' | 'fallback' => {
  if (pack.micro_slug === 'general-project') return 'fallback';
  
  // Check for generic openers in first question
  const firstQ = pack.questions[0];
  const label = (firstQ?.label || '').toLowerCase();
  const genericPhrases = ['briefly describe', 'describe your project', 'please describe'];
  
  if (genericPhrases.some(phrase => label.includes(phrase))) {
    return 'generic';
  }
  
  return pack.questions.length >= 5 ? 'strong' : 'generic';
};

// In render, add tier-specific headers
{packs.map((pack) => {
  const tier = getPackQualityTier(pack);
  return (
    <div key={pack.id}>
      {tier === 'fallback' && (
        <p className="text-sm text-muted-foreground mb-2">
          General briefing — we're upgrading this service
        </p>
      )}
      <QuestionPackRenderer pack={pack} ... />
    </div>
  );
})}
```

---

## Phase 4: Update Seedpacks to Handle dependsOn

### Current Gap
The seedpacks function normalizes `question` → `label` but does NOT normalize `dependsOn` → `show_if`.

**File:** `supabase/functions/seedpacks/index.ts`

Add to the `dedupeQuestions` function:

```typescript
cleaned.push({
  id: id || genId(labelOriginal),
  label: labelOriginal,
  type: q.type === "single" ? "radio" : q.type === "multi" ? "checkbox" : q.type,
  options: q.options,
  required: q.required,
  placeholder: q.placeholder,
  help: q.help ?? q.helpText,
  accept: q.accept,
  show_if: q.show_if ?? q.dependsOn, // ADD THIS LINE
});
```

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `supabase/functions/seedpacks/index.ts` | Add `dependsOn` → `show_if` normalization | High |
| `QuestionPackRenderer.tsx` | Add file type, conditional visibility, help text | High |
| `QuestionsStep.tsx` | Add quality tier labeling | Medium |
| New: `scripts/seed-strong-packs.ts` | Script to seed the 6 packs | High |

---

## Verification Steps

### After Seeding
```sql
-- Confirm 6 strong packs exist
SELECT micro_slug, title, jsonb_array_length(questions) as q_count
FROM question_packs 
WHERE micro_slug IN ('burst-pipe', 'sewer-backup', 'water-heater-emergency',
                     'bespoke-tables', 'sliding-door-wardrobes', 'staircases-handrails')
  AND is_active = true;
```

### After Renderer Fix
1. Navigate to `/post` wizard
2. Select category: Plumbing → Emergency → Burst Pipe
3. Verify 6 trade-specific questions appear (not generic)
4. Select category: Carpentry → Custom Furniture → Bespoke Tables
5. Verify conditional question appears when `table_type = dining`

---

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Strong packs in DB | 0 | 6+ |
| Renderer supports file type | ❌ | ✅ |
| Renderer supports conditionals | ❌ | ✅ |
| Fallback clearly labeled | ⚠️ | ✅ |
| No dead-ends in wizard | ✅ | ✅ |

