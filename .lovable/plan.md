

# Implement Full Auth Page Internationalization

## Overview

Apply the fully internationalized Auth page and translation files you've provided. This will make the entire authentication flow fully bilingual (English/Spanish) with zero hardcoded strings.

---

## Files to Modify

| File | Action |
|------|--------|
| `src/pages/auth/Auth.tsx` | Replace with your i18n-wired version |
| `src/components/auth/IntentSelector.tsx` | Update translation key paths to match new structure |
| `public/locales/en/auth.json` | Replace with complete key set |
| `public/locales/es/auth.json` | Replace with complete Spanish translations |

---

## Key Changes

### 1. Auth.tsx
- Wire all 30+ strings to `useTranslation('auth')`
- Use `t('page.title')`, `t('tabs.signIn')`, `t('signUp.intentBadge.client')`, etc.
- Add fallback defaults for toast messages
- Keep brand "CS Ibiza" untranslated (intentional)

### 2. IntentSelector.tsx
Update the translation key references to match the new JSON structure:

```tsx
// Current (old structure)
titleKey: 'intent.client.title'

// New structure
t('intent.options.client.title')
```

Also needs to use `intent.title` and `intent.subtitle` for the header (currently using `intent.header` and `intent.subheader`).

### 3. Translation Files
Complete key set including:
- `page.*` - Card header
- `tabs.*` - Tab labels
- `form.*` - Field labels/placeholders
- `signIn.*` - Sign in specific
- `signUp.*` - Sign up specific (phone, intent badge, etc.)
- `toast.*` - All toast messages
- `intent.*` - Intent selector content
- `legal.*` - Footer legal text
- `forgotPassword`, `trust` - Misc strings

---

## Translation Key Alignment

The IntentSelector currently uses these keys:
```
intent.header → intent.title
intent.subheader → intent.subtitle  
intent.client.title → intent.options.client.title
intent.client.description → intent.options.client.description
```

Both files will be updated to use the `intent.options.*` structure you specified.

---

## Technical Notes

1. **Brand unchanged**: "CS Ibiza" remains hardcoded (brand names typically aren't translated)

2. **Toast fallbacks**: Using `defaultValue` parameter ensures graceful degradation if keys are missing

3. **AuthHeroVisual**: Already in place from previous implementation - no changes needed

4. **Form autocomplete**: Added proper `autoComplete` attributes for better UX

---

## Result

After implementation:
- Spanish mode will show "Bienvenido", "Iniciar Sesión", "Registrándote como Profesional"
- English mode will show "Welcome", "Sign In", "Signing up as a Tasker"
- Zero hardcoded English strings in the auth flow
- Toast messages localized in both languages

