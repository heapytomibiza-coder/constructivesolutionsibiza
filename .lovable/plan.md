

# Intent-Aware Search Upgrade

## Problem
Searching "plumber" returns "Fix a leaking tap" (a task) as the top result instead of "Plumbing" (the category). The current system scores by type tier (micro=300, sub=200, cat=100) but applies these *after* flat text matching — so structure is ignored and results feel random.

## Root cause
The `search_text` column is `lower(micro_name || ' ' || subcategory_name || ' ' || category_name)`. Every row contains the category name, so "plumber" matches everything under Plumbing. Micros score highest (300) regardless of *where* the match occurred — a category-name match on a micro row outranks the actual category.

## Solution (3 steps, no backend changes needed)

### Step 1: Add intent classification
New file: `src/features/search/lib/searchIntent.ts`

A lightweight rule-based classifier that categorizes queries into:
- **TRADE** — matches a category name or trade synonym ("plumber", "electrician")
- **TASK** — matches action verbs + objects ("fix leaking tap", "install sockets")
- **PROJECT** — matches subcategory-level terms ("kitchen renovation", "pool installation")  
- **EXPLORATORY** — everything else ("garden", "cleaning")

Uses existing synonym dictionary + a small trade-terms list derived from the 16 locked categories. No AI needed.

### Step 2: Apply intent-based score boosting in `transformServiceResults`
In `UniversalSearchBar.tsx`, after DB results return and before rendering:

- Pass the classified intent into `transformServiceResults`
- Apply multipliers to the base scores:

| Intent | Category boost | Subcategory boost | Micro boost |
|--------|---------------|-------------------|-------------|
| TRADE | ×3 | ×2 | ×0.8 |
| TASK | ×0.7 | ×1.5 | ×3 |
| PROJECT | ×2 | ×3 | ×1 |
| EXPLORATORY | ×2 | ×2 | ×1 |

- Sort all results by boosted score (not grouped by type)
- Still cap: max 3 categories, 3 subcategories, 5 micros — but order by score

Result: "plumber" → Plumbing (cat) shows first, then plumbing services, then specific tasks.

### Step 3: Add weighted synonyms
Update `searchSynonyms.ts` to support optional weights:

```text
plumber: [
  { term: "plumbing", weight: 1.0 },
  { term: "leak repair", weight: 0.8 },
  { term: "pipes", weight: 0.3 },
  { term: "water", weight: 0.2 }
]
```

Backward-compatible: existing string arrays still work (default weight 1.0). Low-weight synonyms are included in the OR clause but their matches get a reduced score multiplier, reducing noise from weak associations.

## Files changed

| File | Change |
|------|--------|
| `src/features/search/lib/searchIntent.ts` | New — intent classifier |
| `src/features/search/lib/searchSynonyms.ts` | Add weight support to synonym entries |
| `src/features/search/index.ts` | Export new intent utilities |
| `src/components/search/UniversalSearchBar.tsx` | Integrate intent classification + boosted scoring in `transformServiceResults` |

## What does NOT change
- No database/migration changes
- No backend changes
- Voice input, ⌘K shortcut, forum search, Smart Ladder navigation — all unchanged
- Synonym expansion logic still works the same (just adds optional weights)

