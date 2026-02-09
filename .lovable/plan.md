

## Consolidate Location Taxonomy: Single Source of Truth

### The Problem

Two separate files define Ibiza locations with **different ID formats**:

| Source | Example ID | Used For |
|--------|-----------|----------|
| `zones.ts` | `playa-den-bossa` | Pro service areas |
| `logistics/constants.ts` | `playa_den_bossa` | Client job location |

This creates a matching gap: when a job is posted in `san_antonio`, it won't automatically match pros who selected `san-antonio`.

---

### The Solution

Make `zones.ts` the single source of truth and derive the logistics locations from it.

---

### Implementation Steps

**Step 1: Add Main/Popular grouping to zones.ts**

Extend the zone type to include a `tier` property:

```typescript
export type IbizaZone = { 
  id: string; 
  label: string; 
  tier?: 'main' | 'popular';  // NEW: for wizard grouping
};
```

Mark the 5 main towns with `tier: 'main'`:
- Ibiza Town, San Antonio, Santa Eulalia, San José, San Juan

All others default to `tier: 'popular'`.

---

**Step 2: Create helper functions**

Add to `zones.ts`:

```typescript
/** Main towns for wizard dropdown (first tier) */
export const getMainZones = () => 
  IBIZA_ZONES.flatMap(g => g.zones.filter(z => z.tier === 'main'));

/** Popular areas for wizard expanded view */
export const getPopularZones = () => 
  IBIZA_ZONES.flatMap(g => g.zones.filter(z => z.tier !== 'main'));

/** Get zone by ID (for display lookups) */
export const getZoneById = (id: string) => 
  IBIZA_ZONES.flatMap(g => g.zones).find(z => z.id === id);
```

---

**Step 3: Update LogisticsStep to use zones.ts**

Replace the hardcoded `MAIN_LOCATIONS` and `POPULAR_LOCATIONS` imports with:

```typescript
import { getMainZones, getPopularZones, OTHER_LOCATION } from '@/shared/components/professional/zones';
```

Map the zones to the Select format:
```typescript
const mainLocations = getMainZones().map(z => ({ value: z.id, label: z.label }));
const popularLocations = getPopularZones().map(z => ({ value: z.id, label: z.label }));
```

Keep `OTHER_LOCATION` in constants.ts for the "Other area" option.

---

**Step 4: Delete redundant constants**

Remove from `logistics/constants.ts`:
- `MAIN_LOCATIONS`
- `POPULAR_LOCATIONS`
- `ALL_LOCATIONS`
- `LocationOption` type (use `IbizaZone` instead)

Keep:
- `TIMING_OPTIONS`
- `BUDGET_OPTIONS`
- `CONTACT_OPTIONS`
- `OTHER_LOCATION`

---

### Files Changed

| File | Action |
|------|--------|
| `src/shared/components/professional/zones.ts` | Add `tier` property + helper functions |
| `src/features/wizard/canonical/steps/logistics/constants.ts` | Remove location arrays, keep OTHER_LOCATION |
| `src/features/wizard/canonical/steps/LogisticsStep.tsx` | Import from zones.ts |

---

### Result

- **One taxonomy** for all location references
- **Direct matching**: job location → pro zones (same IDs)
- **Cleaner code**: ~40 lines removed from constants.ts
- **No breaking changes**: just ID unification

---

### Migration Note

If existing jobs have `snake_case` location values in the database, you'll need a one-time migration to normalize them to `kebab-case`, or add a slug-alias map. That's a data cleanup task, not a code change.

---

### Scope Labels

**Missing from zones.ts (in constants.ts):**
- `san_rafael` → add as `san-rafael`
- `santa_gertrudis` → add as `santa-gertrudis`

These two zones should be added to zones.ts under their appropriate groups.

