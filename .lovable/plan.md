

# Fix i18n Translation Keys Still Showing Raw

## Problem Analysis

The screenshot shows raw translation keys (`confirmation.title`, `confirmation.description`, etc.) on the confirmation screen even though:
1. The `ready` guard exists in Auth.tsx
2. Translations exist in `public/locales/en/auth.json`
3. Preloading is configured

**Root Cause**: The `ready` flag from `useTranslation('auth')` can return `true` before the actual translation content is loaded from the HTTP backend. This is a known edge case with `useSuspense: false` and lazy-loaded namespaces.

## Solution

Two-pronged fix to guarantee translations are loaded:

### 1. Add explicit translation validation check

Instead of relying solely on `ready`, also verify that a known translation key actually resolves (not to itself):

```typescript
const { t, ready } = useTranslation('auth');

// Double-check: if t('page.title') returns the key itself, translations aren't loaded
const translationsLoaded = ready && t('page.title') !== 'page.title';

if (!translationsLoaded) {
  return <LoadingSpinner />;
}
```

### 2. Move i18n initialization to block rendering

Ensure `preloadCoreNamespaces()` completes before the app renders by using a loading state in App.tsx:

```typescript
const [i18nReady, setI18nReady] = useState(false);

useEffect(() => {
  preloadCoreNamespaces().then(() => setI18nReady(true));
  // ...
}, []);

if (!i18nReady) return <GlobalLoader />;
```

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/auth/Auth.tsx` | Add explicit translation validation check (belt-and-suspenders) |
| `src/App.tsx` | Block routing until namespaces are loaded |

## Implementation Details

### Auth.tsx Changes
- Add a secondary check that `t('page.title')` doesn't return the raw key
- This catches the edge case where `ready` is `true` but HTTP fetch hasn't completed

### App.tsx Changes  
- Add `i18nReady` state that starts as `false`
- Only render `<Routes>` after `preloadCoreNamespaces()` promise resolves
- Show a minimal loader during the ~100ms fetch time

## Expected Result

- Zero possibility of raw translation keys showing
- Consistent loading experience across all auth screens
- Works on slow connections, cold cache, and first visits

