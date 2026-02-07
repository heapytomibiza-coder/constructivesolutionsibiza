

# Fix i18n Translation Keys Flash on Auth Page

## Problem

The auth confirmation screen shows raw translation keys (e.g., `confirmation.title`) because:

1. `preloadAlternateLanguage()` only preloads the **other** language (not current)
2. The current language namespaces load lazily via `i18next-http-backend`
3. `useSuspense: false` allows components to render before translations are ready
4. Auth page renders immediately → namespace not loaded → raw keys visible

## Solution

Two-part fix:

1. **Add `preloadCoreNamespaces()`** - Preload all namespaces for the current language on app mount
2. **Add `ready` guard on Auth page** - Fallback protection for slow connections

## Changes

### File 1: `src/i18n/preload.ts`

Add new function to preload current language namespaces:

```typescript
/**
 * Preload core namespaces for current language
 * Call on app mount to prevent raw keys flash
 */
export async function preloadCoreNamespaces(): Promise<void> {
  await i18n.loadNamespaces(CORE_NAMESPACES);
}
```

### File 2: `src/App.tsx`

Update the useEffect to preload current language first, then alternate:

```typescript
import { preloadAlternateLanguage, preloadCoreNamespaces } from "@/i18n/preload";

useEffect(() => {
  // Preload current language immediately
  preloadCoreNamespaces();
  // Preload alternate language after delay
  const id = window.setTimeout(preloadAlternateLanguage, 400);
  return () => window.clearTimeout(id);
}, []);
```

### File 3: `src/pages/auth/Auth.tsx`

Add `ready` guard as fallback protection:

```typescript
const { t, ready } = useTranslation('auth');

if (!ready) {
  return (
    <div className="min-h-screen bg-gradient-concrete flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
```

## Summary

| File | Change |
|------|--------|
| `src/i18n/preload.ts` | Add `preloadCoreNamespaces()` function |
| `src/App.tsx` | Call `preloadCoreNamespaces()` on mount, import it |
| `src/pages/auth/Auth.tsx` | Add `ready` guard with loading spinner |

## Expected Result

- No raw translation keys ever visible
- Auth page shows spinner until translations ready (only on very slow connections)
- Works on first visit, refresh, and language switch

