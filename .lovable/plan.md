
# Wizard Translation Audit & Fix Plan

## Issues Found

The screenshot shows the wizard step 3 (Micro) in Spanish, but with **four critical translation gaps**:

| Component | Issue | Example |
|-----------|-------|---------|
| **MicroStep** | Hardcoded English UI strings | "Select tasks (multiple allowed)", "Loading…", "No services available" |
| **MicroStep** | Database names not translated | "Facade Painting", "Fence Painting", "Deck Staining" |
| **CategorySelector** | Hardcoded English | "Loading categories…" |
| **SubcategorySelector** | Hardcoded English | "Loading subcategories…", "No subcategories available" |
| **QuestionsStep** | Hardcoded English | "Loading questions...", "All set!", "Question X of Y", "Back", "Select all that apply", "Continue to next step" |
| **QuestionPackRenderer** | Hardcoded English | "(uploads after job is posted)", "Selected:" |

---

## Solution Overview

### Part 1: Add missing translation keys to wizard.json

Add keys for all the hardcoded UI strings in both EN and ES.

### Part 2: Update components to use useTranslation

Each of the four affected components needs to:
1. Import `useTranslation` from `react-i18next`
2. Replace hardcoded strings with `t()` calls

### Part 3: Category/Subcategory/Micro name translation

The database stores English names. Two options:

**Option A (Simple):** Use the existing `CATEGORY_KEYS` mapping and extend it to subcategories/micros  
**Option B (Scalable):** Add `name_es` column to database tables and fetch based on locale

For this plan, we'll use **Option A** with a fallback — display the translated key if available, otherwise show the database name.

---

## File Changes

### 1. `public/locales/en/wizard.json` — Add missing keys

```json
{
  "micro": {
    "headline": "Select the specific tasks you need",
    "hint": "Choose all that apply — this helps match you with the right professionals",
    "selectMultiple": "Select tasks (multiple allowed)",
    "selectSingle": "Select a service",
    "loading": "Loading…",
    "noServices": "No services available",
    "tasksSelected": "{{count}} task selected",
    "tasksSelected_plural": "{{count}} tasks selected"
  },
  "category": {
    "headline": "What type of service do you need?",
    "orBrowse": "or browse categories",
    "loading": "Loading categories…"
  },
  "subcategory": {
    "headline": "What kind of {{category}} work?",
    "loading": "Loading subcategories…",
    "noSubcategories": "No subcategories available"
  },
  "questions": {
    "loading": "Loading questions...",
    "allSet": "All set!",
    "noQuestionsNeeded": "No additional questions needed. Continue to the next step.",
    "questionOf": "Question {{current}} of {{total}}",
    "back": "Back",
    "selectAll": "Select all that apply",
    "continueToNext": "Continue to next step",
    "uploadsAfterPost": "(uploads after job is posted)",
    "selectedFiles": "Selected: {{files}}"
  }
}
```

### 2. `public/locales/es/wizard.json` — Spanish equivalents

```json
{
  "micro": {
    "headline": "Selecciona las tareas específicas que necesitas",
    "hint": "Elige todas las que correspondan — esto ayuda a encontrar al profesional adecuado",
    "selectMultiple": "Selecciona tareas (se permiten varias)",
    "selectSingle": "Selecciona un servicio",
    "loading": "Cargando…",
    "noServices": "No hay servicios disponibles",
    "tasksSelected": "{{count}} tarea seleccionada",
    "tasksSelected_plural": "{{count}} tareas seleccionadas"
  },
  "category": {
    "headline": "¿Qué tipo de servicio necesitas?",
    "orBrowse": "o explorar categorías",
    "loading": "Cargando categorías…"
  },
  "subcategory": {
    "headline": "¿Qué tipo de trabajo de {{category}}?",
    "loading": "Cargando subcategorías…",
    "noSubcategories": "No hay subcategorías disponibles"
  },
  "questions": {
    "loading": "Cargando preguntas...",
    "allSet": "¡Todo listo!",
    "noQuestionsNeeded": "No se necesitan más preguntas. Continúa al siguiente paso.",
    "questionOf": "Pregunta {{current}} de {{total}}",
    "back": "Atrás",
    "selectAll": "Selecciona todas las que correspondan",
    "continueToNext": "Continuar al siguiente paso",
    "uploadsAfterPost": "(se subirán después de publicar)",
    "selectedFiles": "Seleccionados: {{files}}"
  }
}
```

### 3. `src/components/wizard/db-powered/MicroStep.tsx`

Add `useTranslation` and replace hardcoded strings:

```tsx
import { useTranslation } from 'react-i18next';

export default function MicroStep({ ... }: Props) {
  const { t } = useTranslation('wizard');
  
  // Line 82-84: Replace label
  <label className="block text-sm font-medium mb-2">
    {multiSelect ? t('micro.selectMultiple') : t('micro.selectSingle')}
  </label>
  
  // Line 87: Replace loading
  <p className="text-muted-foreground">{t('micro.loading')}</p>
  
  // Line 89: Replace no services
  <p className="text-muted-foreground">{t('micro.noServices')}</p>
  
  // Line 128: Replace tasks selected
  <p className="mt-3 text-sm text-muted-foreground">
    {t('micro.tasksSelected', { count: selectedMicroIds.length })}
  </p>
}
```

### 4. `src/components/wizard/db-powered/CategorySelector.tsx`

```tsx
import { useTranslation } from 'react-i18next';

export default function CategorySelector({ ... }: Props) {
  const { t } = useTranslation('wizard');
  
  // Line 38: Replace loading
  return <p className="text-muted-foreground">{t('category.loading')}</p>;
}
```

### 5. `src/components/wizard/db-powered/SubcategorySelector.tsx`

```tsx
import { useTranslation } from 'react-i18next';

export default function SubcategorySelector({ ... }: Props) {
  const { t } = useTranslation('wizard');
  
  // Line 57: Replace loading
  return <p className="text-muted-foreground">{t('subcategory.loading')}</p>;
  
  // Line 63: Replace no subcategories
  <p className="text-muted-foreground">{t('subcategory.noSubcategories')}</p>
}
```

### 6. `src/components/wizard/canonical/steps/QuestionsStep.tsx`

```tsx
import { useTranslation } from 'react-i18next';

export function QuestionsStep({ ... }: Props) {
  const { t } = useTranslation('wizard');
  
  // Line 343-344: Replace loading
  <p className="text-muted-foreground">{t('questions.loading')}</p>
  
  // Lines 354-358: Replace "All set!" section
  <h3>{t('questions.allSet')}</h3>
  <p>{t('questions.noQuestionsNeeded')}</p>
  
  // Line 378: Replace "Question X of Y"
  {t('questions.questionOf', { current: currentIndex + 1, total: visibleQuestions.length })}
  
  // Line 386: Replace "Back"
  {t('questions.back')}
  
  // Lines 410-412: Replace "Select all that apply"
  <p>{t('questions.selectAll')}</p>
  
  // Line 484: Replace "Continue to next step"
  {currentIndex === visibleQuestions.length - 1 ? `✓ ${t('questions.continueToNext')}` : t('buttons.continue')}
}
```

### 7. `src/components/wizard/canonical/steps/QuestionPackRenderer.tsx`

```tsx
import { useTranslation } from 'react-i18next';

export function QuestionPackRenderer({ ... }: Props) {
  const { t } = useTranslation('wizard');
  
  // Line 296-297: Replace file upload messages
  <p className="text-sm text-muted-foreground">
    {t('questions.selectedFiles', { files: fileNames.join(', ') })}{' '}
    <span className="italic">{t('questions.uploadsAfterPost')}</span>
  </p>
}
```

---

## About Database Names (Category/Subcategory/Micro)

The category and subcategory names come from the database in English. For now, they will display as-is (English) because:

1. Creating a full translation mapping for all ~200 micro-services is a large effort
2. The existing `CATEGORY_KEYS` covers main categories but not subcategories or micros
3. Adding `name_es` columns to the database would be the cleanest long-term solution

**Recommendation:** After this fix, the UI chrome will be fully translated. A follow-up task can address database name localization by either:
- Adding Spanish translations to `CATEGORY_KEYS` style mapping
- Adding `name_es` columns to `service_categories`, `service_subcategories`, and `service_micro_categories` tables

---

## Files Summary

| File | Action |
|------|--------|
| `public/locales/en/wizard.json` | Add missing keys for micro, category, subcategory, questions |
| `public/locales/es/wizard.json` | Add Spanish translations for same keys |
| `src/components/wizard/db-powered/MicroStep.tsx` | Add useTranslation, replace 4 hardcoded strings |
| `src/components/wizard/db-powered/CategorySelector.tsx` | Add useTranslation, replace 1 hardcoded string |
| `src/components/wizard/db-powered/SubcategorySelector.tsx` | Add useTranslation, replace 2 hardcoded strings |
| `src/components/wizard/canonical/steps/QuestionsStep.tsx` | Add useTranslation, replace 7 hardcoded strings |
| `src/components/wizard/canonical/steps/QuestionPackRenderer.tsx` | Add useTranslation, replace 2 hardcoded strings |

---

## Result

After these changes:
- All wizard UI text will display in the user's selected language
- Loading states, empty states, and helper text will be properly localized
- Database names (task names like "Facade Painting") will remain in English until a follow-up localization task
