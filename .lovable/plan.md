

## Fix: Location Display on Review Step

### Problem
The Review step shows raw zone IDs like "San-Jose" instead of proper labels like "San José (Sant Josep)".

**Root cause:** `formatLocationDisplay` in `formatDisplay.ts` looks up location IDs against `LOCATION_LABELS` from `answerResolver.ts`, which uses legacy **snake_case** keys (e.g., `ibiza_town`). But the wizard now stores **kebab-case** IDs (e.g., `san-jose`). The lookup misses, and the fallback just title-cases the raw ID, producing "San-Jose" with a visible hyphen.

### Solution
Replace the `LOCATION_LABELS` import with the `getZoneByIdSafe` helper from `zones.ts` -- the single source of truth that handles both kebab-case and legacy snake_case IDs.

### Change

**File:** `src/features/wizard/canonical/lib/formatDisplay.ts`

Replace the import and `formatLocationDisplay` function:

**Current:**
```typescript
import { LOCATION_LABELS } from '@/pages/jobs/lib/answerResolver';
```

**New:**
```typescript
import { getZoneByIdSafe } from '@/shared/components/professional/zones';
```

And update the function body:

**Current:**
```typescript
export function formatLocationDisplay(
  location: string | undefined,
  customLocation?: string
): string {
  if (!location) return 'Not specified';
  if (location === 'other') return customLocation || 'Custom location';
  return (
    LOCATION_LABELS[location] ||
    location
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
```

**New:**
```typescript
export function formatLocationDisplay(
  location: string | undefined,
  customLocation?: string
): string {
  if (!location) return 'Not specified';
  if (location === 'other') return customLocation || 'Custom location';
  const zone = getZoneByIdSafe(location);
  if (zone) return zone.label;
  return location
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
```

This gives us:
- `san-jose` displays as "San José (Sant Josep)"
- `ibiza_town` (legacy) displays as "Ibiza Town (Eivissa)"
- Unknown values get a clean title-case fallback (replacing both hyphens and underscores)

### Files Changed

| File | Change |
|------|--------|
| `src/features/wizard/canonical/lib/formatDisplay.ts` | Switch from `LOCATION_LABELS` to `getZoneByIdSafe` for proper zone label resolution |

One file, one import swap, zero risk.

