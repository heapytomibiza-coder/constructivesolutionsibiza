

# Final Polish: Smart Fallbacks + Micro Hydration

## Overview

This plan implements the final 6 upgrades with the two key adjustments requested:

**Adjustment A**: "Micro without parents" should attempt hydration before falling back  
**Adjustment B**: Search fallbacks should use a smart ladder (preserve context), not always go to "fresh"

---

## Current State Analysis

| Component | Current Behavior | Issue |
|-----------|-----------------|-------|
| `resolveWizardMode.ts` | If `micro` exists but no parents → goes to `Questions` anyway | Risky - may land in broken state |
| `CanonicalJobWizard.tsx` deep-link | Only handles `categoryId` + `subcategoryId` lookups | Missing micro hydration |
| `buildWizardUrlFromHit` | Falls back to `microFallback` mode (sends `?micro=slug&step=micro`) | Works but throws away context |
| `useGlobalSearchShortcut` | Uses `navigator.platform` for detection | Deprecated, unreliable |
| `searchSynonyms.ts` | No sanitization, no cap | Can break Supabase `.or()` |
| `UniversalSearchBar` | No Escape key handler | Can't close with keyboard |

---

## Implementation Plan

### 1. Add Micro Hydration to Deep-Link Processor

**File**: `src/components/wizard/canonical/CanonicalJobWizard.tsx`

Add micro lookup in the `processDeepLink` function to hydrate category + subcategory from micro slug:

```typescript
// NEW: Fetch micro and hydrate parents if only micro is provided
const { microSlug } = modeResolution.pendingLookups;
if (microSlug && !categoryId && !subcategoryId) {
  const { data: micro } = await supabase
    .from('service_micro_categories')
    .select(`
      id, name, slug,
      service_subcategories!inner(
        id, name,
        service_categories!inner(id, name)
      )
    `)
    .eq('slug', microSlug)
    .eq('is_active', true)
    .single();

  if (micro) {
    const sub = micro.service_subcategories;
    const cat = sub.service_categories;
    newState = {
      ...newState,
      mainCategory: cat.name,
      mainCategoryId: cat.id,
      subcategory: sub.name,
      subcategoryId: sub.id,
      microNames: [micro.name],
      microIds: [micro.id],
      microSlugs: [micro.slug],
    };
    targetStep = WizardStep.Questions;
  }
  // If lookup fails, targetStep stays at Category (safe fallback)
}
```

This gives us:
- ✅ `/post?micro=sink-leak` works if DB knows it → lands on Questions
- ✅ If micro not found → falls back to Category step

---

### 2. Smart Fallback Ladder in `buildWizardUrlFromHit`

**File**: `src/components/search/types.ts`

Replace the current `microFallback` approach with a smart ladder:

```typescript
case "micro": {
  // Best case: full hierarchy available
  if (hit.categoryId && hit.subcategoryId && hit.microSlug) {
    return buildWizardLink({
      mode: "micro",
      categoryId: hit.categoryId,
      subcategoryId: hit.subcategoryId,
      microSlug: hit.microSlug,
    });
  }

  // Fallback 1: have cat+sub but missing slug → micro step
  if (hit.categoryId && hit.subcategoryId) {
    console.warn("Micro hit missing microSlug, falling back to subcategory mode");
    return buildWizardLink({
      mode: "subcategory",
      categoryId: hit.categoryId,
      subcategoryId: hit.subcategoryId,
    });
  }

  // Fallback 2: have category only → subcategory step
  if (hit.categoryId) {
    console.warn("Micro hit missing hierarchy, falling back to category mode");
    return buildWizardLink({ mode: "category", categoryId: hit.categoryId });
  }

  // Last resort: fresh start
  console.warn("Micro hit missing all parents, falling back to fresh");
  return buildWizardLink({ mode: "fresh" });
}

case "subcategory": {
  if (hit.categoryId) {
    return buildWizardLink({
      mode: "subcategory",
      categoryId: hit.categoryId,
      subcategoryId: hit.id,
    });
  }
  console.warn("Subcategory hit missing categoryId, falling back to fresh");
  return buildWizardLink({ mode: "fresh" });
}
```

---

### 3. Update Wizard Link Types

**File**: `src/lib/wizardLink.ts`

Remove the unsafe fallback modes since we now use the smart ladder:

```typescript
// REMOVE these modes - replaced by smart ladder in buildWizardUrlFromHit:
// | { mode: "microFallback"; microSlug: string }
// | { mode: "subcategoryFallback" }

export type WizardLinkParams =
  | { mode: "fresh" }
  | { mode: "category"; categoryId: string }
  | { mode: "subcategory"; categoryId: string; subcategoryId: string }
  | { mode: "micro"; categoryId: string; subcategoryId: string; microSlug: string }
  | { mode: "direct"; professionalId: string }
  | { mode: "resume" };
```

Remove the `microFallback` and `subcategoryFallback` cases from the switch statement.

---

### 4. Harden Resolver: Require Full Hierarchy for Questions

**File**: `src/components/wizard/canonical/lib/resolveWizardMode.ts`

Update `deriveTargetStepFromParams` to be conservative about Questions step:

```typescript
// No explicit step - derive from param completeness
// ENFORCEMENT: Only go to Questions if we have FULL hierarchy
// (the deep-link processor may hydrate parents from micro, but resolver doesn't assume)
if (params.category && params.subcategory && params.micro) {
  return WizardStep.Questions;
}

// Micro-only: don't assume Questions - let deep-link processor hydrate
// Start at a safe interim step
if (params.micro) {
  return WizardStep.Micro; // Deep-link processor may upgrade this to Questions
}

if (params.subcategory) {
  return WizardStep.Micro;
}
if (params.category) {
  return WizardStep.Subcategory;
}

return WizardStep.Category;
```

---

### 5. Robust ⌘K / Ctrl+K Detection

**File**: `src/hooks/useGlobalSearchShortcut.ts`

Accept both key combos for cross-platform support:

```typescript
const handleKeyDown = useCallback((e: KeyboardEvent) => {
  const isK = e.key.toLowerCase() === "k";
  // Accept BOTH meta and ctrl - works on all platforms without guessing
  const isCombo = (e.metaKey || e.ctrlKey) && isK;

  if (!isCombo) return;

  // Don't trigger when typing in input fields
  const target = e.target as HTMLElement | null;
  const tagName = target?.tagName?.toLowerCase();
  const isTypingField =
    tagName === "input" ||
    tagName === "textarea" ||
    target?.isContentEditable === true;

  if (isTypingField) return;

  e.preventDefault();
  onOpen();
}, [onOpen]);
```

---

### 6. Synonym Expansion Safeguards

**File**: `src/lib/searchSynonyms.ts`

Add sanitization and caps:

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

  return Array.from(expansions).slice(0, MAX_EXPANSIONS);
}

export function buildSearchOrClause(query: string): string {
  const terms = expandQuery(query);
  return terms
    .map(t => t.replace(/[,%]/g, " ").trim()) // Escape commas and wildcards
    .filter(t => t.length >= MIN_TERM_LENGTH)
    .map(t => `search_text.ilike.%${t}%`)
    .join(",");
}
```

---

### 7. Escape Key Closes Search

**File**: `src/components/search/UniversalSearchBar.tsx`

Add keyboard handler:

```typescript
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (e.key === "Escape") {
    setIsOpen(false);
    // Don't clear query - user might want to try again
  }
}, []);

// Add to Command component:
<Command
  className="rounded-lg border bg-card shadow-lg"
  shouldFilter={false}
  onKeyDown={handleKeyDown}
>
```

---

## Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/wizard/canonical/CanonicalJobWizard.tsx` | MODIFY | Add micro hydration in deep-link processor |
| `src/components/wizard/canonical/lib/resolveWizardMode.ts` | MODIFY | Conservative step derivation for micro-only |
| `src/lib/wizardLink.ts` | MODIFY | Remove unsafe fallback modes |
| `src/components/search/types.ts` | MODIFY | Smart fallback ladder in `buildWizardUrlFromHit` |
| `src/hooks/useGlobalSearchShortcut.ts` | MODIFY | Accept both ⌘K and Ctrl+K |
| `src/lib/searchSynonyms.ts` | MODIFY | Add sanitization + cap |
| `src/components/search/UniversalSearchBar.tsx` | MODIFY | Add Escape key handler |

---

## Testing Checklist

| Test | Expected Result |
|------|-----------------|
| `/post?micro=sink-leak` (valid slug) | Hydrates parents → lands on Questions step |
| `/post?micro=invalid-slug` | Lookup fails → lands on Category step |
| `/post?category=X&subcategory=Y&micro=Z` | Full hierarchy → lands on Questions |
| `/post?category=X&step=questions` (missing micro) | Falls back to Subcategory step |
| Search hit with full hierarchy → click | Lands on Questions |
| Search hit missing only microSlug → click | Falls back to Micro step |
| Search hit missing subcategory → click | Falls back to Subcategory step |
| Press ⌘K (Mac) or Ctrl+K (Windows) | Search opens |
| Press Escape while search open | Search closes |
| Search "sparky" | Expands to electrician synonyms, capped at 8 terms |

---

## Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Search Click                                  │
│                         │                                        │
│                         ▼                                        │
│        buildWizardUrlFromHit() - SMART LADDER                   │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │ Full hierarchy?     → mode:micro     → step=questions    │  │
│   │ Cat+Sub only?       → mode:subcategory → step=micro      │  │
│   │ Category only?      → mode:category   → step=subcategory │  │
│   │ Nothing?            → mode:fresh      → step=category    │  │
│   └──────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│                   navigate(url)                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Wizard Mount                                    │
│                         │                                        │
│                         ▼                                        │
│             resolveWizardMode()                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │ micro-only? → initialStep=Micro (pending hydration)      │  │
│   │ full hierarchy? → initialStep=Questions                  │  │
│   └──────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│             Deep-Link Processor (async)                          │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │ microSlug exists?                                        │  │
│   │   → Lookup micro → hydrate parents → Questions           │  │
│   │   → Lookup fails → stay at Micro/Category                │  │
│   └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Non-Negotiable Rules (Enforced)

1. ✅ `micro=` param is always slug (never UUID)
2. ✅ Incomplete hierarchy uses smart ladder (preserve max context)
3. ✅ Resolver is conservative - deep-link processor does hydration
4. ✅ Keyboard shortcuts work cross-platform
5. ✅ Synonym expansion is sanitized and capped
6. ✅ Escape closes search modal

