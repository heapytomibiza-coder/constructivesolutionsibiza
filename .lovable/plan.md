
# Universal Service Search with Deep-Link Support

## Overview
Add a **unified search bar** to the job wizard that allows users to type a service name (e.g., "underfloor heating") and skip directly to the **Questions step** with all taxonomy fields pre-populated. This implements a **fuzzy search → direct deep-link** pattern.

---

## Technical Architecture

### Database Query Strategy: Denormalized Materialized Search View

The most performant approach for instant search across 295+ micro-services:

```text
┌─────────────────────────────────────────────────────────────────┐
│                    service_search_index                          │
├─────────────────────────────────────────────────────────────────┤
│ micro_id       │ UUID (PK)                                      │
│ micro_name     │ TEXT                                           │
│ micro_slug     │ TEXT                                           │
│ subcategory_id │ UUID                                           │
│ subcategory_name│ TEXT                                          │
│ category_id    │ UUID                                           │
│ category_name  │ TEXT                                           │
│ search_text    │ TEXT (concatenated for fuzzy match)            │
│ has_pack       │ BOOLEAN (question pack exists)                 │
└─────────────────────────────────────────────────────────────────┘
```

**Query Pattern:**
```sql
SELECT * FROM service_search_index 
WHERE search_text ILIKE '%underfloor%heating%'
ORDER BY 
  CASE WHEN micro_name ILIKE 'underfloor heating%' THEN 0 ELSE 1 END,
  micro_name
LIMIT 10;
```

---

## Component Design

### 1. ServiceSearchBar Component

**Location:** `src/components/wizard/db-powered/ServiceSearchBar.tsx`

**Features:**
- Uses existing `cmdk` library (already installed) for command palette UX
- Debounced search (300ms) to prevent query spam
- Grouped results by category for clarity
- Shows breadcrumb trail: `HVAC → Heating Systems → Underfloor heating`
- Keyboard navigation support (arrow keys + enter)

**Props Interface:**
```typescript
interface ServiceSearchBarProps {
  onSelect: (result: {
    categoryId: string;
    categoryName: string;
    subcategoryId: string;
    subcategoryName: string;
    microId: string;
    microName: string;
    microSlug: string;
  }) => void;
  placeholder?: string;
}
```

### 2. Deep-Link Handler

**Integration Point:** `CanonicalJobWizard.tsx`

When a search result is selected:
1. Populate all taxonomy fields in `wizardState`
2. Jump directly to `WizardStep.Questions`
3. URL updates to `/post?step=questions`

```typescript
const handleSearchSelect = (result: SearchResult) => {
  setWizardState(prev => ({
    ...prev,
    mainCategory: result.categoryName,
    mainCategoryId: result.categoryId,
    subcategory: result.subcategoryName,
    subcategoryId: result.subcategoryId,
    microNames: [result.microName],
    microIds: [result.microId],
    microSlugs: [result.microSlug],
    answers: {},
  }));
  setCurrentStep(WizardStep.Questions);
};
```

---

## UI Layout

```text
┌────────────────────────────────────────────────────────────────┐
│  🔍 Search for a service...                                    │
│  ────────────────────────────────────────────────────────────  │
│  ▼ Results for "underfloor"                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 🔥 HVAC → Heating Systems                                 │ │
│  │    ▸ Underfloor heating installation                     │ │
│  │    ▸ Underfloor Heating                                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ───────────── OR browse categories below ─────────────        │
│  [Construction] [Carpentry] [Plumbing] [Electrical] ...       │
└────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Create Search View (Database Migration)
Create a `service_search_index` view joining all three taxonomy tables with a computed `search_text` column for fuzzy matching.

### Step 2: Build ServiceSearchBar Component
- React Query hook for search with debounce
- cmdk-based dropdown with grouped results
- Loading/empty states

### Step 3: Integrate into CategorySelector Step
- Add search bar above category grid
- "OR browse categories" separator
- Maintain existing category buttons as fallback

### Step 4: Add Deep-Link Handler to Wizard
- Handle search selection
- Skip to Questions step
- Preserve URL sync behavior

### Step 5: Verify Underfloor Heating Flow
- Confirm `underfloor-heating` micro-slug exists (verified: YES)
- Confirm question pack exists (verified: YES, with 8 questions)
- Test end-to-end: search → select → questions render

---

## Technical Notes

### Search Ranking Algorithm
Priority order for results:
1. **Exact prefix match** on micro name (highest)
2. **Word match** on micro name
3. **Partial match** on subcategory/category
4. **Contains match** anywhere in search text

### Performance Considerations
- View is denormalized for single-query performance
- ILIKE with prefix optimization via `text_pattern_ops` index
- Client-side debounce prevents excessive queries
- Results capped at 10 to avoid UI overload

### Existing Assets Confirmed
- `underfloor-heating` slug exists in `service_micro_categories`
- Question pack seeded with 8 questions (HVAC category contract)
- `cmdk` library already installed for command palette UI
