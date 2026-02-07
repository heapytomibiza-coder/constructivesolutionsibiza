
# Homepage Branding + Universal Search

## Overview

This plan adds two key features to the homepage:
1. **Prominent brand display** — "Constructive Solutions Ibiza" shown prominently in the hero
2. **Universal Search Bar** — A single search input that matches both services (→ wizard) AND community forum posts (→ forum)

---

## 1. Enhanced Branding in Hero

Currently the hero shows a tagline but not the full brand name. We'll add "Constructive Solutions Ibiza" as a featured brand header above the main headline.

### Changes to `src/pages/Index.tsx`

Add brand lockup above the title in the HeroBanner:

```text
    ┌─────────────────────────────────────┐
    │     CONSTRUCTIVE SOLUTIONS IBIZA    │  ← New brand header
    │   "Bridging the gap between idea    │
    │            and build"               │
    │                                     │
    │  We help you understand your...     │
    │                                     │
    │  [==== Universal Search Bar ====]   │  ← New search input
    │                                     │
    │   ✓ Guided process • ✓ Clear...     │
    │                                     │
    │  [ Start Your Project ] [ Browse ]  │
    └─────────────────────────────────────┘
```

The brand will use the `PLATFORM.name` value from `src/domain/scope.ts`.

---

## 2. Universal Search Component

Create a new `UniversalSearchBar` component that searches **both**:
- **Services** (existing `service_search_index`) → Opens wizard at appropriate step
- **Forum posts** (`forum_posts` table) → Opens forum post directly

### New File: `src/components/search/UniversalSearchBar.tsx`

Features:
- Uses cmdk Command component for keyboard navigation
- Debounced search (300ms)
- Groups results by type ("Services" vs "Community")
- Visual badges to distinguish result types
- Service results show depth badge (Category/Service/Task)
- Forum results show category name and reply count

### Search Logic

```text
User types: "pool leak"
                 │
    ┌────────────┴────────────┐
    │                         │
  Services                  Forum
  (service_search_index)    (forum_posts)
    │                         │
┌───┴───┐               ┌─────┴─────┐
│ Pool   │               │ "Pool     │
│ leak   │               │  leak     │
│ repair │               │  fix?"    │
└───────┘               └───────────┘

Results shown in grouped Command menu:
┌────────────────────────────────────┐
│ 🔧 Services                        │
│   Pool Leak Repair   [Task]        │
│   Pool Maintenance   [Service]     │
├────────────────────────────────────┤
│ 💬 Community                       │
│   "Has anyone fixed a pool leak?"  │
│   Recommendations • 4 replies      │
└────────────────────────────────────┘
```

### Database Query Strategy

**Services:** Use existing `service_search_index` view with `ILIKE` pattern matching

**Forum posts:** Query `forum_posts` table:
```sql
SELECT id, title, category_id, reply_count, tags
FROM forum_posts 
WHERE title ILIKE '%query%' OR content ILIKE '%query%'
LIMIT 5
```

Also join forum_categories to get category name for display.

---

## 3. Homepage Integration

### Changes to `src/pages/Index.tsx`

1. Import new `UniversalSearchBar` component
2. Add brand lockup above title
3. Replace buttons section with search bar as primary action, buttons as secondary

**Before:**
```text
"Bridging the gap..."
[Start Your Project] [Browse Professionals]
```

**After:**
```text
CONSTRUCTIVE SOLUTIONS IBIZA
"Bridging the gap..."
[========== What can we help you find? ==========]
[Start Your Project]  [Browse Professionals]
```

---

## 4. Navigation on Selection

When user selects a result:

| Result Type | Navigation Action |
|-------------|-------------------|
| Service (micro) | Navigate to `/post?micro={slug}` — wizard starts at questions step |
| Service (subcategory) | Navigate to `/post?subcat={id}` — wizard starts at micro selection |
| Service (category) | Navigate to `/post?cat={id}` — wizard starts at subcategory selection |
| Forum post | Navigate to `/forum/{category-slug}/{post-id}` |

The existing wizard already supports URL-based pre-population via `useWizardUrlStep` hook.

---

## 5. Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/search/UniversalSearchBar.tsx` | **Create** — New component |
| `src/components/search/index.ts` | **Create** — Barrel export |
| `src/pages/Index.tsx` | **Modify** — Add branding + search bar |
| `public/locales/en/common.json` | **Modify** — Add search translations |
| `public/locales/es/common.json` | **Modify** — Add Spanish search translations |

---

## 6. Translations

### English (`public/locales/en/common.json`)
```json
"universalSearch": {
  "placeholder": "What can we help you find?",
  "noResults": "No results for \"{{query}}\"",
  "services": "Services",
  "community": "Community Posts",
  "replies": "{{count}} replies",
  "startProject": "Start a project for \"{{query}}\"",
  "askCommunity": "Ask the community"
}
```

### Spanish (`public/locales/es/common.json`)
```json
"universalSearch": {
  "placeholder": "¿Qué podemos ayudarte a encontrar?",
  "noResults": "Sin resultados para \"{{query}}\"",
  "services": "Servicios",
  "community": "Publicaciones de la Comunidad",
  "replies": "{{count}} respuestas",
  "startProject": "Iniciar un proyecto para \"{{query}}\"",
  "askCommunity": "Preguntar a la comunidad"
}
```

---

## Technical Details

### UniversalSearchBar Component Structure

```tsx
interface UniversalSearchResult {
  type: 'service' | 'forum';
  id: string;
  title: string;
  subtitle: string;
  // Service-specific
  depth?: SearchDepth;
  microSlug?: string;
  categoryId?: string;
  subcategoryId?: string;
  // Forum-specific
  categorySlug?: string;
  replyCount?: number;
}
```

### Query Implementation

Uses two parallel queries via `useQuery`:
1. `['universal-search', 'services', query]` — queries service_search_index
2. `['universal-search', 'forum', query]` — queries forum_posts + forum_categories

Results are merged and displayed in grouped sections.

---

## Visual Design

The search bar will:
- Have a white/card background with subtle shadow
- Use a search icon on the left
- Show a keyboard hint (⌘K or Ctrl+K) on desktop
- Expand into a dropdown command palette on focus
- Group results with section headers
- Use existing color palette (primary for services, muted for forum)

---

## Summary

| Feature | Implementation |
|---------|---------------|
| Brand visibility | Add "Constructive Solutions Ibiza" above hero title |
| Universal search | New component querying services + forum |
| Smart routing | Service → wizard, Forum → post page |
| Translations | EN + ES for all new UI strings |
