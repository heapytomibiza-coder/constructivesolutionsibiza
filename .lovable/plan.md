

# Service Category Deep-Link + Professional Filtering Implementation

## Overview

Connect the `/services/:categorySlug` page to the database, display real subcategories with selection UI, and enable two user paths that preserve context through URL parameters:

1. **Post Job Path**: `/post?category=<uuid>&subcategory=<uuid>` → Wizard jumps to Step 3 (Micro)
2. **Browse Pros Path**: `/professionals?category=<uuid>&subcategory=<uuid>` → Filtered professional directory

---

## User Flow Diagram

```text
/services                          /services/hvac
┌────────────────────┐            ┌──────────────────────────────────┐
│ [Construction]     │            │  HVAC                            │
│ [Plumbing]         │  click     │  ─────────────────────────────── │
│ [HVAC]      ───────┼───────────▶│  Select a subcategory:           │
│ [Electrical]       │            │  ○ Air Conditioning              │
│ ...                │            │  ● Heating Systems  ← selected   │
└────────────────────┘            │  ○ Ventilation                   │
                                  │  ○ Maintenance                   │
                                  │                                  │
                                  │ [Post HVAC Job →] [Browse Pros]  │
                                  └───────────┬──────────────┬───────┘
                                              │              │
                                              ▼              ▼
                                  ┌──────────────────┐  ┌─────────────────────┐
                                  │ /post            │  │ /professionals      │
                                  │ ?category=abc    │  │ ?category=abc       │
                                  │ &subcategory=xyz │  │ &subcategory=xyz    │
                                  │                  │  │                     │
                                  │ Step 3: Micro    │  │ Filtered pro list   │
                                  │ (cat+sub filled) │  │ matching services   │
                                  └──────────────────┘  └─────────────────────┘
```

---

## Implementation Details

### 1. ServiceCategory.tsx - DB-Driven Subcategory Page

**Current State**: Uses static `MAIN_CATEGORIES` array, placeholder content for subcategories

**Changes**:
- Fetch category by slug from `service_categories` table
- Fetch subcategories for that category from `service_subcategories` table
- Add radio button selection UI for subcategories
- Pass `category` and `subcategory` UUIDs to CTA links
- Auto-select first subcategory for "idiot-proof" UX

**Query Pattern**:
```sql
-- Get category by slug
SELECT id, name, slug FROM service_categories 
WHERE slug = 'hvac' AND is_active = true;

-- Get subcategories
SELECT id, name, slug FROM service_subcategories 
WHERE category_id = '<uuid>' AND is_active = true 
ORDER BY display_order;
```

**CTA Links**:
```typescript
// Post Job CTA
/post?category=${categoryId}&subcategory=${selectedSubcategoryId}

// Browse Pros CTA  
/professionals?category=${categoryId}&subcategory=${selectedSubcategoryId}
```

---

### 2. CanonicalJobWizard.tsx - Deep-Link Initialization

**Current State**: No URL parameter reading on mount

**Changes**:
- Read `category` and `subcategory` query params via `useLocation` + `URLSearchParams`
- Fetch category/subcategory names from DB (IDs come from URL, names needed for UI)
- Validate subcategory belongs to category (security/integrity check)
- Populate wizard state with fetched data
- Jump to correct step:
  - `?category=abc` → Step 2 (Subcategory)
  - `?category=abc&subcategory=xyz` → Step 3 (Micro)
- Integration with draft modal:
  - If draft exists → wait for user decision
  - "Resume Draft" → ignore deep-link params
  - "Start Fresh" → apply deep-link params

**New Refs**:
```typescript
const deepLinkAppliedRef = useRef(false);
const pendingDeepLinkRef = useRef<{ categoryId?: string; subcategoryId?: string } | null>(null);
```

**Step Jump Logic**:
```typescript
if (validSubcategory) {
  setCurrentStep(WizardStep.Micro);  // Step 3
} else if (validCategory) {
  setCurrentStep(WizardStep.Subcategory);  // Step 2
}
```

---

### 3. Professionals.tsx - Category/Subcategory Filtering

**Current State**: Static empty state, no filtering

**Changes**:
- Read `category` and `subcategory` query params
- Build query that joins:
  - `professional_profiles` → `professional_services` → `service_micro_categories` → `service_subcategories` → `service_categories`
- Filter professionals who have registered services matching the category/subcategory
- Show filter badges with clear buttons
- Handle empty results gracefully

**Query Strategy**:
```sql
-- Professionals who have ANY micro-service under the given subcategory
SELECT DISTINCT pp.id, pp.display_name, pp.avatar_url
FROM professional_profiles pp
JOIN professional_services ps ON ps.user_id = pp.user_id
JOIN service_micro_categories m ON m.id = ps.micro_id
JOIN service_subcategories s ON s.id = m.subcategory_id
WHERE s.category_id = '<category_uuid>'
  AND s.id = '<subcategory_uuid>'  -- optional
  AND pp.is_publicly_listed = true;
```

---

## Wizard Entry Point Summary

| Entry Source | URL | Starting Step | Pre-populated |
|--------------|-----|---------------|---------------|
| Direct `/post` | `/post` | Step 1 (Category) | None |
| Category only | `/post?category=abc` | Step 2 (Subcategory) | mainCategory + mainCategoryId |
| Category + Sub | `/post?category=abc&subcategory=xyz` | Step 3 (Micro) | All taxonomy fields |
| Search micro | `/post?step=questions` | Step 4 (Questions) | Full taxonomy via search bar |

---

## Edge Cases Handled

1. **Invalid/inactive category slug** → Show "Category not found" with back link
2. **Subcategory doesn't belong to category** → Ignore subcategory, go to Step 2
3. **Draft modal showing** → Wait for user decision before applying deep-link
4. **User resumes draft** → Deep-link params ignored (draft takes priority)
5. **No subcategories exist** → Show message, CTA still works with category-only

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/public/ServiceCategory.tsx` | Complete rewrite: DB queries, radio selection, dynamic CTAs |
| `src/components/wizard/canonical/CanonicalJobWizard.tsx` | Add deep-link initialization effect, refs, draft integration |
| `src/pages/public/Professionals.tsx` | Add filtering logic, query params, filter badges |

---

## Technical Notes

### Why `useLocation` instead of `useSearchParams`?

The project already uses `useSearchParams` in the wizard URL hook, so both work. Using `useLocation` with manual `URLSearchParams` is equally valid and more explicit about when we read vs. write params.

### Database Relationship Chain

```text
service_categories (16 rows)
       ↓ category_id
service_subcategories (84 rows)
       ↓ subcategory_id  
service_micro_categories (295 rows)
       ↓ micro_id
professional_services (join table)
       ↓ user_id
professional_profiles (directory)
```

### State Consistency

Deep-link initialization uses the same `setWizardState` pattern as existing handlers (`handleCategorySelect`, `handleSubcategorySelect`), ensuring downstream fields are properly reset when jumping in mid-flow.

