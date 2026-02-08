

# Final Polish: Search → Wizard Lock-In (3 Targeted Edits)

## Context

The previous implementation is solid. This plan applies 3 minor but important edits to make it bulletproof, plus fixes a ref-forwarding issue that could cause the ⌘K focus to silently fail.

---

## Edit 1: Explicit Non-Negotiable Rule

Add to all relevant documentation and code comments:

> **Micro-only deep links are intentionally unsupported until hydration is implemented.**

This prevents a future developer from "fixing" it by reintroducing unsafe behavior.

---

## Edit 2: Smarter Fallback in Resolver (Preserve Partial Context)

**File**: `src/components/wizard/canonical/lib/resolveWizardMode.ts`

**Current behavior** (lines 122-133):
```typescript
// No explicit step - derive from param completeness
if (params.micro) {
  return WizardStep.Questions;  // <-- PROBLEM: assumes full hierarchy
}
```

**Problem**: If `params.micro` exists alone (no parents), this returns `Questions` step, which is unsafe.

**New behavior** - require full hierarchy for Questions:

```typescript
// No explicit step - derive from param completeness
// ENFORCEMENT: Questions step requires FULL hierarchy
// Micro-only deep links are NOT supported until hydration is implemented.
if (params.category && params.subcategory && params.micro) {
  return WizardStep.Questions;
}

// Micro-only (missing parents) - preserve any partial context
if (params.micro) {
  // If we have category, at least go to Subcategory step
  return params.category ? WizardStep.Subcategory : WizardStep.Category;
}

if (params.subcategory) {
  return WizardStep.Micro;
}
if (params.category) {
  return WizardStep.Subcategory;
}

return WizardStep.Category;
```

This is better than always defaulting to Category because it preserves valid partial context.

---

## Edit 3: Escape `%` in Synonyms

**File**: `src/lib/searchSynonyms.ts`

**Current** (line 91):
```typescript
return terms.map(t => `search_text.ilike.%${t}%`).join(",");
```

**Problem**: `%` in search terms affects `ilike` patterns unexpectedly.

**Fix** - sanitize `%` and `,`:

```typescript
const MAX_EXPANSIONS = 8;
const MIN_TERM_LENGTH = 2;

export function expandQuery(query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized || normalized.length < MIN_TERM_LENGTH) return [];
  
  const expansions = new Set<string>([normalized]);

  for (const [key, values] of Object.entries(SEARCH_SYNONYMS)) {
    if (normalized.includes(key)) {
      expansions.add(key);
      values.forEach(v => {
        if (v.length >= MIN_TERM_LENGTH) expansions.add(v);
      });
    }
    
    for (const synonym of values) {
      if (normalized.includes(synonym)) {
        expansions.add(key);
        values.forEach(v => {
          if (v.length >= MIN_TERM_LENGTH) expansions.add(v);
        });
        break;
      }
    }
  }

  // Cap expansions to prevent slow queries
  return Array.from(expansions).slice(0, MAX_EXPANSIONS);
}

export function buildSearchOrClause(query: string): string {
  const terms = expandQuery(query);
  return terms
    .map(t => t.replace(/[,%]/g, " ").trim())  // Escape commas AND wildcards
    .filter(t => t.length >= MIN_TERM_LENGTH)
    .map(t => `search_text.ilike.%${t}%`)
    .join(",");
}
```

Also update `UniversalSearchBar.tsx` to use `buildSearchOrClause` instead of building it inline:

```typescript
import { buildSearchOrClause } from "@/lib/searchSynonyms";

// In queryFn:
const orClause = buildSearchOrClause(debouncedQuery);
if (!orClause) return [];

const { data, error } = await supabase
  .from("service_search_index")
  .select("*")
  .or(orClause)
  .limit(20);
```

---

## Bonus Fix: ⌘K Focus Reliability

**Issue**: `CommandInput` from shadcn may not forward refs, causing `inputRef.current?.focus()` to silently fail.

**File**: `src/components/search/UniversalSearchBar.tsx`

**Fix** - use a wrapper div and query for the input:

```typescript
const rootRef = useRef<HTMLDivElement>(null);

useGlobalSearchShortcut(() => {
  setIsOpen(true);
  // Use requestAnimationFrame to ensure DOM is ready
  requestAnimationFrame(() => {
    const input = rootRef.current?.querySelector("input");
    input?.focus();
  });
});

// Wrap the Command in a div with the ref:
<div ref={rootRef} className={cn("relative w-full max-w-2xl mx-auto", className)}>
  <Command ...>
    <CommandInput ... /> {/* No ref needed here */}
  </Command>
</div>
```

Also accept both ⌘K AND Ctrl+K for cross-platform support (current code already does platform detection, but we can simplify):

**File**: `src/hooks/useGlobalSearchShortcut.ts`

```typescript
const handleKeyDown = useCallback((e: KeyboardEvent) => {
  const isK = e.key.toLowerCase() === "k";
  // Accept BOTH meta and ctrl - works on all platforms
  const isCombo = (e.metaKey || e.ctrlKey) && isK;

  if (!isCombo) return;
  // ... rest unchanged
}, [onOpen]);
```

---

## Bonus Fix: Escape Key Closes Search

**File**: `src/components/search/UniversalSearchBar.tsx`

Add keyboard handler:

```typescript
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (e.key === "Escape") {
    setIsOpen(false);
  }
}, []);

// Add to Command:
<Command onKeyDown={handleKeyDown} ...>
```

---

## Files Modified Summary

| File | Change |
|------|--------|
| `src/components/wizard/canonical/lib/resolveWizardMode.ts` | Require full hierarchy for Questions; preserve partial context on fallback |
| `src/lib/searchSynonyms.ts` | Add sanitization for `%` and `,`; cap expansions at 8 |
| `src/hooks/useGlobalSearchShortcut.ts` | Accept both ⌘K and Ctrl+K (simplify) |
| `src/components/search/UniversalSearchBar.tsx` | Use `buildSearchOrClause`; fix focus with wrapper div; add Escape handler |

---

## Non-Negotiable Rules (Updated)

1. `micro=` param is always slug (never UUID)
2. Incomplete hierarchy uses smart ladder (preserve max context)
3. **Micro-only deep links are intentionally unsupported until hydration is implemented**
4. Resolver is conservative - full hierarchy required for Questions step
5. Keyboard shortcuts work cross-platform (⌘K AND Ctrl+K both accepted)
6. Synonym expansion is sanitized (`%`, `,`) and capped at 8 terms
7. Escape closes search modal
8. All wizard navigation must go through `buildWizardLink()` - no inline `/post?...` strings

---

## Testing Checklist

| Test | Expected |
|------|----------|
| `/post?micro=sink-leak` (no parents) | Lands on Category step (not Questions) |
| `/post?category=X&micro=slug` (has category but no subcategory) | Lands on Subcategory step |
| `/post?category=X&subcategory=Y&micro=slug` | Lands on Questions step |
| Press ⌘K (Mac) | Search opens, input focused |
| Press Ctrl+K (Windows) | Search opens, input focused |
| Press Escape while search open | Search closes |
| Search "sparky" | Expands to electrician synonyms |
| Search term with `%` or `,` | Sanitized, no query errors |

