

# Fix Missing `react-i18next` Dependency

## Problem

The build is failing because `react-i18next` is not installed. The i18n configuration file (`src/i18n/index.ts`) imports from `react-i18next`, but this package is not in `package.json`.

**Current installed packages:**
- `i18next` - Core library
- `i18next-browser-languagedetector` - Language detection
- `i18next-http-backend` - Lazy loading translations

**Missing:**
- `react-i18next` - React bindings (hooks like `useTranslation`)

---

## Solution

Install the missing dependency:

```
npm install react-i18next
```

This single package provides:
- `useTranslation` hook used throughout the app
- `initReactI18next` plugin used in the i18n config
- React context provider for translations

---

## Why This Happened

The previous implementation likely added the dependency, but it wasn't persisted to `package.json` or there was a sync issue.

---

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `react-i18next` to dependencies |

---

## After the Fix

Once installed, the app will:
1. Build successfully
2. Initialize i18n with lazy-loaded namespaces from `/public/locales/`
3. Enable the `LanguageSwitcher` component in the nav
4. Allow all components using `useTranslation()` to work

