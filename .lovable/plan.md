
# Fix Job Details Display - Proper Answer Rendering

## Problems Identified

### 1. Double-Nested Data Structure
The actual answers are stored at `microAnswers.microAnswers[slug]` but the component reads `answers.microAnswers` directly, causing it to display:
- `_pack_slug: full-house-rewiring`
- `_pack_source: strong`
- `microAnswers: [object Object]` (the actual answers!)

### 2. Raw Values Instead of Human-Readable Labels
Answers show internal values like:
- `property_size: 4plus` instead of "4+ bedrooms / large property"
- `occupied: yes` instead of "Yes – people will be living there"
- `finishes: separate_trades` instead of "No – I will use separate trades"

### 3. Question IDs Instead of Labels
Displays `property_size`, `floors`, `occupied` instead of the actual question text like:
- "Roughly what size is the property?"
- "How many floors does the property have?"
- "Will the property be occupied during the rewiring?"

### 4. Location Shows Internal Codes
Displays `san_jose` instead of "San José"

### 5. Metadata Leaking Into Display
Pack tracking fields (`_pack_source`, `_pack_slug`, `_pack_missing`) are being shown to users

---

## Solution Architecture

### Approach: Fetch Question Packs and Resolve Labels

Since job details needs to display human-readable answers, we need to:
1. Extract the correct data from the nested structure
2. Fetch the relevant question packs based on the micro slugs
3. Build lookup maps for question labels and option labels
4. Render formatted answers with proper labels

---

## Implementation Plan

### Step 1: Create Answer Resolver Utility

Create a new utility file to handle answer resolution:

**File:** `src/pages/jobs/lib/answerResolver.ts`

```typescript
// Types for question pack structure
interface QuestionOption {
  value: string;
  label: string;
}

interface QuestionDef {
  id: string;
  label: string;
  type: string;
  options?: QuestionOption[];
}

interface QuestionPack {
  micro_slug: string;
  title: string;
  questions: QuestionDef[];
}

// Build lookup maps from question packs
export function buildAnswerLookups(packs: QuestionPack[]) {
  const questionLabels: Map<string, Map<string, string>> = new Map();
  const optionLabels: Map<string, Map<string, Map<string, string>>> = new Map();
  
  for (const pack of packs) {
    const qMap = new Map<string, string>();
    const oMap = new Map<string, Map<string, string>>();
    
    for (const q of pack.questions) {
      qMap.set(q.id, q.label);
      
      if (q.options) {
        const optMap = new Map<string, string>();
        for (const opt of q.options) {
          optMap.set(opt.value, opt.label);
        }
        oMap.set(q.id, optMap);
      }
    }
    
    questionLabels.set(pack.micro_slug, qMap);
    optionLabels.set(pack.micro_slug, oMap);
  }
  
  return { questionLabels, optionLabels };
}

// Resolve a single answer value to its label
export function resolveAnswerValue(
  value: unknown,
  questionId: string,
  optionLabels: Map<string, string> | undefined
): string {
  if (value === null || value === undefined) return "—";
  
  // Handle arrays (checkbox answers)
  if (Array.isArray(value)) {
    return value.map(v => optionLabels?.get(String(v)) ?? String(v)).join(", ");
  }
  
  // Handle single values
  const strValue = String(value);
  return optionLabels?.get(strValue) ?? strValue;
}
```

### Step 2: Create Formatted Answers Component

**File:** `src/pages/jobs/components/FormattedAnswers.tsx`

```typescript
// Component that fetches packs and renders formatted answers
export function FormattedAnswers({ 
  microAnswers,
  microSlugs 
}: {
  microAnswers: Record<string, Record<string, unknown>>;
  microSlugs: string[];
}) {
  // Fetch question packs for the relevant micro slugs
  const { data: packs } = useQuery({
    queryKey: ["question_packs_for_display", microSlugs],
    queryFn: async () => {
      const { data } = await supabase
        .from("question_packs")
        .select("micro_slug, title, questions")
        .in("micro_slug", microSlugs)
        .eq("is_active", true);
      return data ?? [];
    },
    enabled: microSlugs.length > 0,
  });

  // Build lookups and render formatted answers
  // ...
}
```

### Step 3: Update JobDetailsModal to Use Correct Data Structure

**File:** `src/pages/jobs/JobDetailsModal.tsx`

Changes needed:
1. Extract actual answers from `microAnswers.microAnswers` (not `microAnswers` directly)
2. Filter out metadata fields (`_pack_*`)
3. Use the new `FormattedAnswers` component
4. Improve location display using human-readable labels

```typescript
// Extract the actual nested answers, filtering out metadata
function extractMicroAnswers(raw: Record<string, unknown>): Record<string, Record<string, unknown>> {
  // Handle double-nested structure
  if (raw.microAnswers && typeof raw.microAnswers === 'object') {
    const nested = raw.microAnswers as Record<string, unknown>;
    // Filter out _pack_* metadata
    return Object.fromEntries(
      Object.entries(nested).filter(([key]) => !key.startsWith('_'))
    ) as Record<string, Record<string, unknown>>;
  }
  
  // Handle flat structure (legacy or fixed)
  return Object.fromEntries(
    Object.entries(raw).filter(([key]) => !key.startsWith('_') && key !== 'microAnswers')
  ) as Record<string, Record<string, unknown>>;
}
```

### Step 4: Improve Location Display

Add location preset mapping for human-readable display:

```typescript
const LOCATION_LABELS: Record<string, string> = {
  ibiza_town: "Ibiza Town",
  san_antonio: "San Antonio",
  santa_eulalia: "Santa Eulalia",
  san_jose: "San José",
  other: "Other",
};

function formatLocation(logistics: JobAnswers['logistics']): string {
  const preset = logistics.location;
  if (!preset) return "Not specified";
  if (preset === "other") return logistics.customLocation || "Custom location";
  return LOCATION_LABELS[preset] || preset;
}
```

---

## Visual Mockup: Before vs After

### Before (Current - Broken)
```
Scope & Specifications

_pack_slug
full-house-rewiring

_pack_source
strong

microAnswers
full-house-rewiring:[object Object]
new-circuits-extensions-refits:[object Object]
```

### After (Fixed)
```
Scope & Specifications

Full house rewiring

  Roughly what size is the property?
  4+ bedrooms / large property

  How many floors does the property have?
  2 floors

  Will the property be occupied during the rewiring?
  Yes – people will be living there

  Do you want to add more sockets, switches or lighting points?
  Keep similar to existing

  Do you expect the electrician to make good plaster/decoration afterwards?
  No – I will use separate trades

New circuits for extensions & refits

  What type of property is it?
  Villa

  Is the property currently occupied?
  Yes – fully occupied
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/jobs/lib/answerResolver.ts` | Create | Utility for building lookups and resolving answer values |
| `src/pages/jobs/components/FormattedAnswers.tsx` | Create | Component that fetches packs and renders formatted answers |
| `src/pages/jobs/components/index.ts` | Modify | Export new component |
| `src/pages/jobs/JobDetailsModal.tsx` | Modify | Use new components, fix data extraction, improve layout |

---

## Technical Summary

| Aspect | Details |
|--------|---------|
| **Data extraction** | Navigate `microAnswers.microAnswers[slug]` correctly |
| **Metadata filtering** | Exclude `_pack_*` fields from display |
| **Label resolution** | Fetch question packs to get human-readable labels |
| **Option resolution** | Map internal values to display labels |
| **Location formatting** | Map preset codes to readable names |
| **Layout improvement** | Group by service with clear visual hierarchy |

---

## QA Checklist

| Test | Expected Result |
|------|-----------------|
| View job with multiple micro-services | Each service shows as separate section with title |
| Answer values | Show human-readable labels, not internal codes |
| Question labels | Show actual questions, not field IDs |
| Location | Shows "San José" not "san_jose" |
| No metadata visible | `_pack_source`, `_pack_slug` not shown to users |
| Empty answers | Shows "No specific answers provided" gracefully |
| Checkbox answers | Shows comma-separated labels |
