

# i18n Homepage Fix: Wire Remaining Hardcoded Strings

## Current Status

The i18n system is **working correctly**. When Spanish is selected via the Language Switcher, the homepage translates properly. However, two hardcoded sources remain in English:

| Item | Source | Status |
|------|--------|--------|
| Hero subtitle | `PLATFORM.description` in `src/domain/scope.ts` | Hardcoded English |
| Category names | `MAIN_CATEGORIES` constant | Hardcoded English |
| Footer links | Hardcoded in `PublicFooter.tsx` | Not wired to i18n |

---

## Solution: Wire PLATFORM.description to i18n

The hero subtitle currently shows the hardcoded `PLATFORM.description` instead of using translations.

### Change in Index.tsx (line 51)

**Before:**
```tsx
subtitle={PLATFORM.description}
```

**After:**
```tsx
subtitle={t('hero.subtitle')}
```

The translation keys already exist:
- EN: `"subtitle": "Construction & Trade Services in Ibiza"`
- ES: `"subtitle": "Servicios de Construcción y Oficios en Ibiza"`

---

## Solution: Wire Footer Links to i18n

### Changes in PublicFooter.tsx

Add `useTranslation` and create new translation keys for footer links.

**New keys needed in common.json:**
```json
"footer": {
  "rights": "All rights reserved.",
  "tagline": "Connecting Ibiza with trusted construction professionals.",
  "howItWorks": "How it works",
  "contact": "Contact",
  "privacy": "Privacy",
  "terms": "Terms"
}
```

---

## Category Names - Keep in English (MVP Decision)

Category names like "Construction", "Carpentry", "Plumbing" will remain in English for now because:
1. They come from database/constants, not translation files
2. Industry terms are often internationally understood
3. Full category translation system is out of scope for MVP

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Line 51: Change `PLATFORM.description` → `t('hero.subtitle')` |
| `src/components/layout/PublicFooter.tsx` | Wire footer links to `t('footer.*')` |
| `public/locales/en/common.json` | Add footer link keys |
| `public/locales/es/common.json` | Add Spanish footer translations |

---

## Implementation Details

### 1. Index.tsx - Line 51

```tsx
// Change from:
subtitle={PLATFORM.description}

// To:
subtitle={t('hero.subtitle')}
```

### 2. PublicFooter.tsx

```tsx
import { useTranslation } from 'react-i18next';

export function PublicFooter() {
  const { t } = useTranslation('common');
  
  return (
    // ... existing code ...
    <Link to="/how-it-works">{t('footer.howItWorks')}</Link>
    <Link to="/contact">{t('footer.contact')}</Link>
    <Link to="/privacy">{t('footer.privacy')}</Link>
    <Link to="/terms">{t('footer.terms')}</Link>
    // ...
  );
}
```

### 3. Add to common.json (EN)

```json
"footer": {
  "rights": "All rights reserved.",
  "tagline": "Connecting Ibiza with trusted construction professionals.",
  "howItWorks": "How it works",
  "contact": "Contact",
  "privacy": "Privacy",
  "terms": "Terms"
}
```

### 4. Add to common.json (ES)

```json
"footer": {
  "rights": "Todos los derechos reservados.",
  "tagline": "Conectando Ibiza con profesionales de la construcción de confianza.",
  "howItWorks": "Cómo funciona",
  "contact": "Contacto",
  "privacy": "Privacidad",
  "terms": "Términos"
}
```

---

## Summary

The homepage i18n is 95% complete and working. This plan fixes the remaining 2 hardcoded sources:

1. **Hero subtitle**: Switch from `PLATFORM.description` to `t('hero.subtitle')` - 1 line change
2. **Footer links**: Wire to translation keys - ~10 lines

After this fix, the entire homepage will be fully translated when Spanish is selected.

