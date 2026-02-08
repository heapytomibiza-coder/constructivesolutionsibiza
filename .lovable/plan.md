
# Lock-In Search → Wizard Flow: Complete Implementation Plan

## Executive Summary

This plan delivers four high-impact improvements to make the search-to-wizard flow bulletproof:

1. **Harden wizard resolver fallbacks** - Prevent wrong-step issues with defensive validation
2. **Add search synonyms** - "leak", "aircon", "sparky" all resolve correctly
3. **Add ⌘K / Ctrl+K global shortcut** - Premium keyboard experience
4. **Unify all wizard entry points** - Single helper for URL generation, zero drift

---

## Current Architecture Analysis

| Component | Purpose | Status |
|-----------|---------|--------|
| `resolveWizardMode.ts` | URL → wizard state resolution | ✅ Good foundation |
| `buildWizardUrlFromHit` | Search hit → URL builder | ✅ Exists, needs fallback hardening |
| `UniversalSearchBar` | Homepage search | ✅ Uses typed hits |
| Entry points (ServiceCategory, Professionals, etc.) | Various navigation sources | ⚠️ Inconsistent URL building |
| Keyboard shortcut | Global ⌘K access | ❌ Not implemented |
| Synonyms | "leak" → "pipe leak" expansion | ❌ Not implemented |

---

## Implementation Details

### 1. Harden Wizard Resolver with Step/Param Validation

**Problem**: URL says `step=questions` but `micro` param is missing → user lands on wrong step.

**Solution**: Add validation in `deriveTargetStepFromParams` to enforce param requirements:

**File**: `src/components/wizard/canonical/lib/resolveWizardMode.ts`

```typescript
/**
 * Derive target step with ENFORCEMENT:
 * - step=questions requires micro
 * - step=micro requires subcategory
 * - step=subcategory requires category
 * Falls back to the highest valid step if params are missing.
 */
function deriveTargetStepFromParams(params: UrlParams): WizardStep {
  // If step is explicitly provided, validate requirements
  if (params.step && isValidStep(params.step)) {
    const requestedStep = params.step as WizardStep;
    
    // Enforce param requirements for each step
    if (requestedStep === WizardStep.Questions && !params.micro) {
      return params.subcategory ? WizardStep.Micro : 
             params.category ? WizardStep.Subcategory : 
             WizardStep.Category;
    }
    if (requestedStep === WizardStep.Micro && !params.subcategory) {
      return params.category ? WizardStep.Subcategory : WizardStep.Category;
    }
    if (requestedStep === WizardStep.Subcategory && !params.category) {
      return WizardStep.Category;
    }
    
    return requestedStep;
  }
  
  // No explicit step - derive from param completeness (existing logic)
  if (params.micro) return WizardStep.Questions;
  if (params.subcategory) return WizardStep.Micro;
  if (params.category) return WizardStep.Subcategory;
  
  return WizardStep.Category;
}
```

---

### 2. Create Unified Wizard Link Builder

**Purpose**: Single source of truth for all wizard navigation URLs.

**File**: `src/lib/wizardLink.ts` (NEW)

```typescript
/**
 * Wizard Link Builder
 * SINGLE SOURCE OF TRUTH for all wizard navigation.
 * All entry points MUST use this - no inline URL strings.
 */

export type WizardLinkParams =
  | { mode: "fresh" }
  | { mode: "category"; categoryId: string }
  | { mode: "subcategory"; categoryId: string; subcategoryId: string }
  | { mode: "micro"; categoryId: string; subcategoryId: string; microSlug: string }
  | { mode: "direct"; professionalId: string }
  | { mode: "resume" };

export function buildWizardLink(params: WizardLinkParams): string {
  const base = "/post";
  
  switch (params.mode) {
    case "fresh":
      return base;
      
    case "category":
      return `${base}?category=${params.categoryId}&step=subcategory`;
      
    case "subcategory":
      return `${base}?category=${params.categoryId}&subcategory=${params.subcategoryId}&step=micro`;
      
    case "micro":
      return `${base}?category=${params.categoryId}&subcategory=${params.subcategoryId}&micro=${params.microSlug}&step=questions`;
      
    case "direct":
      return `${base}?pro=${params.professionalId}`;
      
    case "resume":
      return `${base}?resume=true`;
      
    default:
      return base;
  }
}
```

**Then update all entry points** to use this helper:

| File | Current | After |
|------|---------|-------|
| `ServiceCategory.tsx` | Inline `/post?category=...` | `buildWizardLink({ mode: 'subcategory', ... })` |
| `Professionals.tsx` | Inline `/post?pro=...` | `buildWizardLink({ mode: 'direct', ... })` |
| `ProfessionalDetails.tsx` | Inline `/post?pro=...` | `buildWizardLink({ mode: 'direct', ... })` |
| `search/types.ts` | `buildWizardUrlFromHit` | Delegate to `buildWizardLink` |

---

### 3. Add Search Synonyms

**File**: `src/lib/searchSynonyms.ts` (NEW)

```typescript
/**
 * Search Synonyms
 * Expand user queries to match more results.
 * Fast, controlled, no AI required.
 */

export const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Common misspellings and alternatives
  leak: ["water leak", "pipe leak", "sink leak", "leaking"],
  drain: ["blocked drain", "drain blockage", "unblock drain", "clogged"],
  toilet: ["wc", "loo", "toilet repair", "cistern"],
  tap: ["faucet", "mixer tap", "tap repair"],
  
  // Trade slang
  electrician: ["sparky", "electrical", "electrics"],
  plumber: ["plumbing", "pipes"],
  
  // Climate/comfort
  aircon: ["ac", "air conditioning", "a/c", "air con"],
  hvac: ["heating", "ventilation", "cooling"],
  
  // Materials/finishes
  plaster: ["plastering", "skim", "skim coat"],
  paint: ["painting", "decorator", "decorating"],
  tile: ["tiling", "tiles", "retile"],
  
  // Outdoor
  pool: ["swimming pool", "pool maintenance", "pool cleaning"],
  garden: ["gardening", "landscaping", "lawn"],
};

/**
 * Expand a query into multiple search terms
 */
export function expandQuery(query: string): string[] {
  const normalized = query.trim().toLowerCase();
  const expansions = new Set([normalized]);

  for (const [key, values] of Object.entries(SEARCH_SYNONYMS)) {
    // If query contains the key, add all synonyms
    if (normalized.includes(key)) {
      values.forEach(v => expansions.add(v));
    }
    // If query matches a synonym, add the key
    for (const synonym of values) {
      if (normalized.includes(synonym)) {
        expansions.add(key);
        break;
      }
    }
  }

  return Array.from(expansions);
}
```

**Update `UniversalSearchBar.tsx`** query function:

```typescript
import { expandQuery } from '@/lib/searchSynonyms';

// In queryFn:
const queries = expandQuery(debouncedQuery);

// Build OR clause for multiple terms
const orClauses = queries.map(q => `search_text.ilike.%${q}%`).join(",");

const { data, error } = await supabase
  .from("service_search_index")
  .select("*")
  .or(orClauses)
  .limit(15);
```

---

### 4. Add ⌘K / Ctrl+K Global Shortcut

**File**: `src/hooks/useGlobalSearchShortcut.ts` (NEW)

```typescript
import { useEffect } from "react";

/**
 * Global keyboard shortcut for search (⌘K on Mac, Ctrl+K on Windows/Linux)
 */
export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect platform
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const isK = e.key.toLowerCase() === "k";
      const isCombo = isMac ? e.metaKey && isK : e.ctrlKey && isK;

      if (!isCombo) return;

      // Don't trigger when typing in input fields
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingField =
        tagName === "input" ||
        tagName === "textarea" ||
        target?.isContentEditable;

      if (isTypingField) return;

      e.preventDefault();
      onOpen();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}
```

**Update `UniversalSearchBar.tsx`**:

```typescript
import { useGlobalSearchShortcut } from '@/hooks/useGlobalSearchShortcut';

export function UniversalSearchBar({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Global ⌘K shortcut
  useGlobalSearchShortcut(() => {
    setIsOpen(true);
    // Focus input after opening
    setTimeout(() => inputRef.current?.focus(), 0);
  });
  
  // Add ref to CommandInput
  <CommandInput ref={inputRef} ... />
}
```

---

## Files Modified Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/wizard/canonical/lib/resolveWizardMode.ts` | MODIFY | Harden `deriveTargetStepFromParams` with step/param enforcement |
| `src/lib/wizardLink.ts` | NEW | Unified wizard link builder |
| `src/lib/searchSynonyms.ts` | NEW | Synonym expansion for search |
| `src/hooks/useGlobalSearchShortcut.ts` | NEW | ⌘K keyboard hook |
| `src/components/search/UniversalSearchBar.tsx` | MODIFY | Add synonym expansion + keyboard shortcut + input ref |
| `src/components/search/types.ts` | MODIFY | Delegate `buildWizardUrlFromHit` to centralized builder |
| `src/pages/public/ServiceCategory.tsx` | MODIFY | Use `buildWizardLink` |
| `src/pages/public/Professionals.tsx` | MODIFY | Use `buildWizardLink` |
| `src/pages/public/ProfessionalDetails.tsx` | MODIFY | Use `buildWizardLink` |

---

## Testing Checklist (QA)

### URL Validation Tests
| Test URL | Expected Behavior |
|----------|-------------------|
| `/post?category=<id>&step=subcategory` | Land on subcategory step with category pre-filled |
| `/post?category=<id>&subcategory=<id>&step=micro` | Land on micro step with cat+sub pre-filled |
| `/post?category=<id>&subcategory=<id>&micro=<slug>&step=questions` | Land on questions step with full hierarchy |
| `/post?step=questions` (missing micro) | Fallback to category step |
| `/post?category=<id>&step=questions` (missing micro/sub) | Fallback to subcategory step |
| `/post?micro=invalid-slug&step=questions` | Fallback to micro step with error handling |

### Search Click Tests
| Action | Expected Result |
|--------|-----------------|
| Click category result | `/post?category=<id>&step=subcategory` |
| Click subcategory result | `/post?category=<id>&subcategory=<id>&step=micro` |
| Click micro/task result | `/post?category=<id>&subcategory=<id>&micro=<slug>&step=questions` |

### Synonym Tests
| Query | Expected Matches |
|-------|------------------|
| "leak" | Pipe Leak, Sink Leak, Water Leak tasks |
| "sparky" | Electrical category/subcategories |
| "aircon" | HVAC, Air Conditioning results |
| "blocked drain" | Drain Blockage micro |

### Keyboard Shortcut Tests
| Action | Expected |
|--------|----------|
| Press ⌘K (Mac) | Search opens, input focused |
| Press Ctrl+K (Windows) | Search opens, input focused |
| Press ⌘K while in input field | Does not open search |
| Press Escape | Search closes |

---

## Architecture Diagram

```text
┌──────────────────────────────────────────────────────────────────┐
│                      Entry Points                                │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Search Bar   │ Service Page │ Pro Profile  │ Dashboard          │
│ (click)      │ (subcategory)│ (Request)    │ (Post Job)         │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────────┘
       │              │              │                │
       ▼              ▼              ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│              buildWizardLink() - SINGLE SOURCE                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ mode: category   → /post?category=<id>&step=subcategory     │ │
│  │ mode: subcategory→ /post?category=..&subcategory=..&step=.. │ │
│  │ mode: micro      → /post?category=..&subcategory=..&micro=..│ │
│  │ mode: direct     → /post?pro=<userId>                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                  navigate(url) - URL ONLY                        │
│              No state mutation outside wizard                    │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│          Wizard Mount → resolveWizardMode()                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 1. Parse URL params                                         │ │
│  │ 2. Validate step/param requirements                         │ │
│  │ 3. Fallback if params missing                               │ │
│  │ 4. Async lookup for names                                   │ │
│  │ 5. Set initial state + step                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Non-Negotiables (Locked-In Rules)

These rules prevent regression:

1. ✅ **Search results are typed** (category/subcategory/micro)
2. ✅ **Click → navigate only** (no state mutation outside wizard)
3. ✅ **Wizard is the only place that resolves URL → state**
4. ✅ **Resolver validates params and falls back safely**
5. ✅ **All entry points use `buildWizardLink()`** - no inline URL strings
