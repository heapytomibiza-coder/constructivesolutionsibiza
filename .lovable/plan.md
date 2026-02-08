

# Lock-In Universal Search: 3-Way Grouped Results

## Problem Analysis

The current `UniversalSearchBar` has a critical flaw in `transformServiceResults()`:

```text
Current Logic (else-if chain):
  if (micro)      → add micro
  else if (sub)   → add subcategory  
  else if (cat)   → add category
```

**Result**: If a row contains a micro, its parent subcategory and category are never extracted. The search feels "micro-heavy" and users rarely see broader category/subcategory matches.

---

## Solution Overview

1. **Independent Collection** - Extract all 3 entity types from each row (no else-if)
2. **Grouped UI** - Display results in 3 distinct sections: Tasks, Services, Categories
3. **Safe Fallbacks** - Harden URL builder for missing parent IDs
4. **i18n Keys** - Add translation keys for new section headings

---

## Technical Changes

### 1. `src/components/search/UniversalSearchBar.tsx`

**Replace `transformServiceResults` function** (lines 44-98):

```typescript
function transformServiceResults(data: Array<{
  category_id: string | null;
  category_name: string | null;
  subcategory_id: string | null;
  subcategory_name: string | null;
  micro_id: string | null;
  micro_name: string | null;
  micro_slug: string | null;
}>): SearchHit[] {
  const seen = new Set<string>();

  const micros: SearchHit[] = [];
  const subs: SearchHit[] = [];
  const cats: SearchHit[] = [];

  // Separate score buckets to maintain type grouping
  let microScore = 300;
  let subScore = 200;
  let catScore = 100;

  for (const row of data) {
    // 1) Micros (Tasks) - most specific
    if (row.micro_id && row.micro_name) {
      const key = `micro-${row.micro_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        micros.push({
          type: "micro",
          id: row.micro_id,
          label: row.micro_name,
          categoryId: row.category_id || undefined,
          categoryName: row.category_name || undefined,
          subcategoryId: row.subcategory_id || undefined,
          subcategoryName: row.subcategory_name || undefined,
          microSlug: row.micro_slug || undefined,
          score: microScore--,
        });
      }
    }

    // 2) Subcategories (Services)
    if (row.subcategory_id && row.subcategory_name) {
      const key = `sub-${row.subcategory_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        subs.push({
          type: "subcategory",
          id: row.subcategory_id,
          label: row.subcategory_name,
          categoryId: row.category_id || undefined,
          categoryName: row.category_name || undefined,
          score: subScore--,
        });
      }
    }

    // 3) Categories (broadest)
    if (row.category_id && row.category_name) {
      const key = `cat-${row.category_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        cats.push({
          type: "category",
          id: row.category_id,
          label: row.category_name,
          score: catScore--,
        });
      }
    }
  }

  // Limit each type, then merge (order: tasks first, then services, then categories)
  const topMicros = micros.slice(0, 5);
  const topSubs = subs.slice(0, 3);
  const topCats = cats.slice(0, 3);

  return [...topMicros, ...topSubs, ...topCats];
}
```

**Add filter helpers inside component** (before return):

```typescript
const taskHits = serviceResults.filter((h) => h.type === "micro");
const subHits = serviceResults.filter((h) => h.type === "subcategory");
const catHits = serviceResults.filter((h) => h.type === "category");
```

**Replace single `CommandGroup` with 3 grouped sections** (lines 205-231):

```text
{taskHits.length > 0 && (
  <CommandGroup heading={t("universalSearch.tasks", "Tasks")}>
    {/* Task items with Wrench icon */}
  </CommandGroup>
)}

{subHits.length > 0 && (
  <CommandGroup heading={t("universalSearch.subcategories", "Services")}>
    {/* Subcategory items with Layers icon */}
  </CommandGroup>
)}

{catHits.length > 0 && (
  <CommandGroup heading={t("universalSearch.categories", "Categories")}>
    {/* Category items with FolderOpen icon */}
  </CommandGroup>
)}
```

**Add icon imports**:
- `Layers` for subcategories
- `FolderOpen` for categories

---

### 2. `src/components/search/types.ts`

**Harden `buildWizardUrlFromHit` with safe fallbacks** (lines 46-73):

Current implementation already has basic fallbacks, but we can improve the micro case:

```typescript
case "micro":
  // Best case: full hierarchy available
  if (hit.categoryId && hit.subcategoryId && hit.microSlug) {
    return `${base}?category=${hit.categoryId}&subcategory=${hit.subcategoryId}&micro=${hit.microSlug}&step=questions`;
  }
  // Fallback 1: have micro slug but missing parents
  if (hit.microSlug) {
    return `${base}?micro=${hit.microSlug}&step=questions`;
  }
  // Fallback 2: have micro ID only
  console.warn("SearchHit micro missing microSlug, falling back to ID");
  return `${base}?micro=${hit.id}&step=questions`;
```

---

### 3. Translation Files

**`public/locales/en/common.json`** - Add to `universalSearch` section:

```json
"universalSearch": {
  "placeholder": "What can we help you find?",
  "noResults": "No results for \"{{query}}\"",
  "services": "Services",
  "tasks": "Tasks",
  "subcategories": "Services", 
  "categories": "Categories",
  "community": "Community Posts",
  "replies": "{{count}} replies",
  "startProject": "Start a project for \"{{query}}\"",
  "askCommunity": "Ask the community"
}
```

**`public/locales/es/common.json`** - Spanish equivalents:

```json
"universalSearch": {
  "placeholder": "¿Qué podemos ayudarte a encontrar?",
  "noResults": "Sin resultados para \"{{query}}\"",
  "services": "Servicios",
  "tasks": "Tareas",
  "subcategories": "Servicios",
  "categories": "Categorías",
  "community": "Publicaciones de la Comunidad",
  "replies": "{{count}} respuestas",
  "startProject": "Iniciar un proyecto para \"{{query}}\"",
  "askCommunity": "Preguntar a la comunidad"
}
```

---

## Visual UI Improvement

Each result type gets a distinct icon for instant recognition:

| Type | Icon | Purpose |
|------|------|---------|
| Tasks (micro) | `Wrench` | Most specific - actual job tasks |
| Services (subcategory) | `Layers` | Service type within a category |
| Categories | `FolderOpen` | Broadest - top-level trade |

Each row shows breadcrumb context using existing `getHitBreadcrumb()`:
- **Task**: "Plumbing → Repairs → Sink Leak"
- **Service**: "Plumbing → Repairs"  
- **Category**: "Plumbing"

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/search/UniversalSearchBar.tsx` | Replace else-if with independent collection, add grouped UI |
| `src/components/search/types.ts` | Harden URL builder fallbacks |
| `public/locales/en/common.json` | Add `tasks`, `subcategories`, `categories` keys |
| `public/locales/es/common.json` | Add Spanish translations |

---

## Testing Checklist

1. Search "plumb" → Should show:
   - Tasks: Sink Leak, Drain Blockage, etc.
   - Services: General Plumbing, Emergency Plumbing
   - Categories: Plumbing

2. Click a Task → Lands on Step 4 (Questions) with hierarchy pre-filled

3. Click a Service → Lands on Step 3 (Micro selection) with cat+sub pre-filled

4. Click a Category → Lands on Step 2 (Subcategory selection) with category pre-filled

5. Invalid IDs → Wizard resolver handles gracefully with fallback steps

