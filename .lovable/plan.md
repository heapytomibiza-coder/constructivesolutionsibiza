

# Internationalization (i18n) Implementation Plan

## Tech Stack Clarification

**This is NOT a Next.js project.** The stack is:
- React 18 + Vite
- React Router DOM v6
- shadcn/ui + Radix primitives
- Supabase backend

The i18n approach needs to be adapted accordingly.

---

## Recommended Library: react-i18next

`react-i18next` is the most mature, well-documented solution for React SPAs. It provides:
- Simple `t()` function for translations
- React hooks (`useTranslation`)
- Namespace support for code splitting
- Pluralization and interpolation
- Language detection

---

## Proposed Architecture

```text
src/
├── i18n/
│   ├── index.ts           # i18n initialization
│   ├── locales/
│   │   ├── en/
│   │   │   ├── common.json     # nav, buttons, shared
│   │   │   ├── auth.json       # login/signup
│   │   │   ├── jobs.json       # job wizard, board
│   │   │   ├── forum.json      # community
│   │   │   └── dashboard.json  # dashboards
│   │   └── es/
│   │       ├── common.json
│   │       ├── auth.json
│   │       ├── jobs.json
│   │       ├── forum.json
│   │       └── dashboard.json
│   └── types.ts           # TypeScript types for keys
```

---

## Implementation Phases

### Phase A: Foundation (Quick Win)

| Task | Details |
|------|---------|
| Install react-i18next | `npm install react-i18next i18next i18next-browser-languagedetector` |
| Create i18n config | Initialize with language detection, fallback |
| Add LocaleContext | Store preference in localStorage |
| Add LanguageSwitcher | Simple EN/ES toggle in nav |
| Translate nav + footer | First visible elements |

### Phase B: Core UI Translation

| Task | Details |
|------|---------|
| Homepage | Hero, trust signals, CTAs |
| Auth pages | Login/signup forms, toasts |
| Job wizard | All steps, labels, buttons |
| Job board | Filters, cards, modals |

### Phase C: Deep Integration

| Task | Details |
|------|---------|
| Forum | Categories, post form, replies |
| Dashboards | Stats, cards, actions |
| Messages | Thread UI, empty states |
| Settings | All form labels |

### Phase D: Data Layer

| Task | Details |
|------|---------|
| Taxonomy tables | Add `name_en`, `name_es` columns |
| Question packs | Bilingual labels |
| Validation errors | Use translation keys |
| Date/number formatting | Use `Intl` with locale |

---

## Technical Implementation Details

### 1. i18n Configuration

Create `src/i18n/index.ts`:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';
// ... other namespaces

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      es: { common: esCommon },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React handles escaping
    },
  });

export default i18n;
```

### 2. Translation File Structure

Example `src/i18n/locales/en/common.json`:

```json
{
  "nav": {
    "services": "Services",
    "jobs": "Jobs",
    "professionals": "Professionals",
    "howItWorks": "How it works",
    "community": "Community",
    "contact": "Contact",
    "signIn": "Sign in",
    "signOut": "Sign out",
    "dashboard": "Dashboard",
    "messages": "Messages"
  },
  "hero": {
    "title": "Find Trusted Construction Professionals",
    "postJob": "Post a Job",
    "browsePros": "Browse Professionals"
  },
  "trust": {
    "verified": "Verified trades",
    "sameDay": "Same-day response",
    "local": "Ibiza-based"
  },
  "toast": {
    "signOutSuccess": "Signed out successfully",
    "signOutError": "Failed to sign out"
  }
}
```

Spanish version `src/i18n/locales/es/common.json`:

```json
{
  "nav": {
    "services": "Servicios",
    "jobs": "Trabajos",
    "professionals": "Profesionales",
    "howItWorks": "Cómo funciona",
    "community": "Comunidad",
    "contact": "Contacto",
    "signIn": "Iniciar sesión",
    "signOut": "Cerrar sesión",
    "dashboard": "Panel",
    "messages": "Mensajes"
  },
  "hero": {
    "title": "Encuentra Profesionales de Construcción de Confianza",
    "postJob": "Publicar un Trabajo",
    "browsePros": "Ver Profesionales"
  },
  "trust": {
    "verified": "Oficios verificados",
    "sameDay": "Respuesta el mismo día",
    "local": "En Ibiza"
  },
  "toast": {
    "signOutSuccess": "Sesión cerrada correctamente",
    "signOutError": "Error al cerrar sesión"
  }
}
```

### 3. Language Switcher Component

Create `src/components/layout/LanguageSwitcher.tsx`:

```typescript
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('en')}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('es')}>
          Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 4. Usage in Components

Before (hardcoded):
```tsx
<Button>Post a Job</Button>
toast.success('Signed out successfully');
```

After (translated):
```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

<Button>{t('hero.postJob')}</Button>
toast.success(t('toast.signOutSuccess'));
```

### 5. Locale-Aware Formatting

Create `src/lib/formatters.ts`:

```typescript
import { useTranslation } from 'react-i18next';

export function useFormatters() {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'es' ? 'es-ES' : 'en-GB';
  
  return {
    formatDate: (date: Date) => 
      new Intl.DateTimeFormat(locale, { 
        dateStyle: 'medium' 
      }).format(date),
    
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
      }).format(amount),
  };
}
```

---

## Database: Bilingual Taxonomy

Currently, taxonomy tables have single `name` columns. To support bilingual:

### Option A: Add separate columns (Recommended)

```sql
ALTER TABLE service_categories
ADD COLUMN name_en text,
ADD COLUMN name_es text;

-- Backfill from existing name (English)
UPDATE service_categories SET name_en = name;

-- Same for subcategories and micro_categories
```

### Option B: JSONB structure

```sql
ALTER TABLE service_categories
ADD COLUMN labels jsonb DEFAULT '{}';

-- Store as: {"en": "Plumbing", "es": "Fontanería"}
```

Option A is simpler and more queryable.

---

## URL Routing Decision

**Two approaches:**

### A. No locale in URL (simpler)
- Same URLs: `/jobs`, `/services`
- Language stored in localStorage/cookie
- Less SEO benefit but simpler to implement
- No need to change React Router setup

### B. Locale prefix in URL (better SEO)
- URLs become: `/en/jobs`, `/es/jobs`
- Requires wrapping all routes in `/:locale`
- Better for Google indexing

**Recommendation for MVP:** Start with Option A (no URL prefix) to ship faster. Add locale routing later if SEO becomes important.

---

## Validation Errors (Zod)

Instead of hardcoding English error messages:

```typescript
// Before
const schema = z.object({
  email: z.string().email('Invalid email'),
});

// After - return error codes
const schema = z.object({
  email: z.string().email({ message: 'validation.invalidEmail' }),
});

// In component, translate the error key
const errorMessage = errors.email 
  ? t(errors.email.message) 
  : null;
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/i18n/index.ts` | Create - i18n initialization |
| `src/i18n/locales/en/*.json` | Create - English translations |
| `src/i18n/locales/es/*.json` | Create - Spanish translations |
| `src/components/layout/LanguageSwitcher.tsx` | Create - language toggle |
| `src/main.tsx` | Modify - import i18n |
| `src/components/layout/PublicNav.tsx` | Modify - add LanguageSwitcher |
| `src/domain/scope.ts` | Modify - bilingual PLATFORM config |
| All UI components | Modify - replace hardcoded strings with `t()` |

---

## Estimated Scope

| Phase | Effort | Priority |
|-------|--------|----------|
| A - Foundation | 2-3 hours | High |
| B - Core UI | 4-6 hours | High |
| C - Deep Integration | 4-6 hours | Medium |
| D - Data Layer | 2-4 hours | Low (can defer) |

Total: ~15-20 hours for full implementation

---

## Why This Approach Scales

1. **Separation of concerns**: Translations live in JSON files, not code
2. **TypeScript safety**: Can type translation keys for autocomplete
3. **Namespace splitting**: Load only needed translations per route
4. **Easy to extend**: Adding a third language (German, French) is just more JSON files
5. **Team-friendly**: Translators can edit JSON without touching code

