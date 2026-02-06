

# Complete Dashboard + Wizard i18n Wiring Plan

## Summary

Wire all hardcoded English strings in `ClientDashboard.tsx`, `ProDashboard.tsx`, and `CanonicalJobWizard.tsx` to use the existing `dashboard.json` namespace and a new `wizard.json` namespace.

---

## Current State

| Component | Hardcoded Strings | Status |
|-----------|-------------------|--------|
| `ClientDashboard.tsx` | ~25 strings (title, stats, buttons, toast) | Not translated |
| `ProDashboard.tsx` | ~35 strings (title, stats, actions, profile) | Not translated |
| `CanonicalJobWizard.tsx` | ~30 strings (steps, draft modal, buttons, toasts) | Not translated |
| `dashboard.json` EN/ES | Complete keys exist | Ready to wire |
| `wizard.json` | Does not exist | Must create |

---

## Implementation Tasks

### Task 1: Wire ClientDashboard.tsx to dashboard.json

**File:** `src/pages/dashboard/ClientDashboard.tsx`

**Changes:**
1. Add `import { useTranslation } from 'react-i18next'`
2. Add `const { t } = useTranslation('dashboard')`
3. Replace all hardcoded strings with `t()` calls

**String mappings:**
| Hardcoded | Translation Key |
|-----------|-----------------|
| `"Dashboard"` | `t('client.title')` |
| `"Welcome back, {email}"` | `t('client.welcomeBack', { email })` |
| `"Post a Job"` | `t('client.postJob')` |
| `"Active Jobs"` | `t('client.activeJobs')` |
| `"In Progress"` | `t('client.inProgress')` |
| `"Draft Jobs"` | `t('client.draftJobs')` |
| `"Messages"` | `t('pro.messages')` |
| `"New"` | `t('stats.unread')` |
| `"Your Jobs"` | `t('client.yourJobs')` |
| `"You haven't posted any jobs yet."` | `t('client.noJobs')` |
| `"Post Your First Job"` | `t('client.postFirst')` |
| `"Signed out"` | `t('auth.signedOut')` (need to add) |

**Missing keys to add to dashboard.json:**
```json
"auth": {
  "signedOut": "Signed out"
}
"common": {
  "edit": "Edit"
}
```

---

### Task 2: Wire ProDashboard.tsx to dashboard.json

**File:** `src/pages/dashboard/ProDashboard.tsx`

**Changes:**
1. Add `import { useTranslation } from 'react-i18next'`
2. Add `const { t } = useTranslation('dashboard')`
3. Replace all hardcoded strings with `t()` calls

**String mappings (using existing keys):**
| Hardcoded | Translation Key |
|-----------|-----------------|
| `"Professional Dashboard"` | `t('pro.title')` |
| `"Welcome back, {email}"` | `t('pro.welcomeBack', { email })` |
| `"Browse All Jobs"` | `t('pro.browseAllJobs')` |
| `"Complete Your Setup"` | `t('pro.completeSetup')` |
| `"Add your services..."` | `t('pro.setupDescription')` |
| `"Set Up Services"` | `t('pro.setUpServices')` |
| `"Your Services"` | `t('pro.yourServices')` |
| `"Edit"` | `t('common.edit')` (need to add) |
| `"Matched Jobs"` | `t('pro.matchedJobs')` |
| `"Messages"` | `t('pro.messages')` |
| `"New"` | `t('stats.unread')` |
| `"Jobs that match..."` | `t('pro.matchedJobsDesc')` |
| `"View All"` | `t('pro.viewAll')` |
| `"Set up your services..."` | `t('pro.setUpServicesToSee')` |
| `"No matched jobs yet..."` | `t('pro.noMatchedJobs')` |
| `"Quick Actions"` | `t('pro.quickActions')` |
| `"Update Services"` | `t('pro.updateServices')` |
| `"Edit Profile"` | `t('pro.editProfile')` |
| `"View Messages"` | `t('pro.viewMessages')` |
| `"Profile Status"` | `t('pro.profileStatus')` |
| `"Services added"` | `t('pro.servicesAdded')` |
| `"Profile details"` | `t('pro.profileDetails')` |
| `"Publicly visible"` | `t('pro.publiclyVisible')` |
| `"Add services + complete..."` | `t('pro.addServicesHint')` |
| `"View"` | `t('client.view')` |
| `"Signed out"` | `t('auth.signedOut')` |

---

### Task 3: Create wizard.json Namespace

**Files to create:**
- `public/locales/en/wizard.json`
- `public/locales/es/wizard.json`

**Update i18n config:**
- `src/i18n/index.ts` - add `"wizard"` to `ns` array
- `src/i18n/namespaces.ts` - add `wizard: "wizard"` constant

**English wizard.json structure:**
```json
{
  "steps": {
    "category": "Service Type",
    "subcategory": "Service Details",
    "micro": "Specific Tasks",
    "questions": "Professional Briefing",
    "logistics": "Timing & Location",
    "extras": "Photos & Notes",
    "review": "Review & Post"
  },
  "draft": {
    "title": "Resume your draft?",
    "description": "We found an unfinished job posting. Would you like to continue where you left off?",
    "startFresh": "Start Fresh",
    "resume": "Resume Draft"
  },
  "progress": {
    "stepOf": "Step {{current}} of {{total}}",
    "helper": "Building your job specification helps professionals quote accurately"
  },
  "category": {
    "headline": "What type of service do you need?",
    "orBrowse": "or browse categories"
  },
  "subcategory": {
    "headline": "What kind of {{category}} work?"
  },
  "micro": {
    "headline": "Select the specific tasks you need",
    "hint": "Choose all that apply — this helps match you with the right professionals"
  },
  "buttons": {
    "back": "Back",
    "continue": "Continue",
    "submit": "Post Job",
    "signInToSubmit": "Sign In to Post"
  },
  "ui": {
    "submitting": "Submitting..."
  },
  "toasts": {
    "duplicate": "This job was already submitted",
    "convoFailed": "Job saved but could not start conversation",
    "directSuccess": "Job sent to professional!",
    "broadcastSuccess": "Job posted to marketplace!",
    "submitFailed": "Failed to post job. Please try again."
  },
  "errors": {
    "selectPro": "Please select a professional to send this job to"
  }
}
```

**Spanish wizard.json structure:**
```json
{
  "steps": {
    "category": "Tipo de Servicio",
    "subcategory": "Detalles del Servicio",
    "micro": "Tareas Específicas",
    "questions": "Información para el Profesional",
    "logistics": "Tiempo y Ubicación",
    "extras": "Fotos y Notas",
    "review": "Revisar y Publicar"
  },
  "draft": {
    "title": "¿Reanudar tu borrador?",
    "description": "Hemos encontrado un trabajo sin terminar. ¿Quieres continuar donde lo dejaste?",
    "startFresh": "Empezar de cero",
    "resume": "Reanudar borrador"
  },
  "progress": {
    "stepOf": "Paso {{current}} de {{total}}",
    "helper": "Construir una especificación clara ayuda a los profesionales a presupuestar con precisión"
  },
  "category": {
    "headline": "¿Qué tipo de servicio necesitas?",
    "orBrowse": "o explorar categorías"
  },
  "subcategory": {
    "headline": "¿Qué tipo de trabajo de {{category}}?"
  },
  "micro": {
    "headline": "Selecciona las tareas específicas que necesitas",
    "hint": "Elige todas las que correspondan — esto ayuda a encontrar al profesional adecuado"
  },
  "buttons": {
    "back": "Atrás",
    "continue": "Continuar",
    "submit": "Publicar Trabajo",
    "signInToSubmit": "Iniciar sesión para publicar"
  },
  "ui": {
    "submitting": "Enviando..."
  },
  "toasts": {
    "duplicate": "Este trabajo ya fue enviado",
    "convoFailed": "Trabajo guardado, pero no se pudo iniciar la conversación",
    "directSuccess": "¡Trabajo enviado al profesional!",
    "broadcastSuccess": "¡Trabajo publicado en el marketplace!",
    "submitFailed": "No se pudo publicar. Inténtalo de nuevo."
  },
  "errors": {
    "selectPro": "Selecciona un profesional para enviarle este trabajo"
  }
}
```

---

### Task 4: Wire CanonicalJobWizard.tsx to wizard.json

**File:** `src/components/wizard/canonical/CanonicalJobWizard.tsx`

**Changes:**
1. Add `import { useTranslation } from 'react-i18next'`
2. Add `const { t } = useTranslation('wizard')`
3. Create step title key mapping helper
4. Replace all hardcoded strings with `t()` calls

**Key replacements in wizard:**
- Line 573-578: Draft modal title/description → `t('draft.title')`, `t('draft.description')`
- Line 580-584: Draft buttons → `t('draft.startFresh')`, `t('draft.resume')`
- Line 598: Step counter → `t('progress.stepOf', { current, total })`
- Line 602: Step title → use mapping to `t('steps.<step>')`
- Line 619-621: Helper text → `t('progress.helper')`
- Line 629-640: Category headline + divider → `t('category.headline')`, `t('category.orBrowse')`
- Line 655-656: Subcategory headline → `t('subcategory.headline', { category })`
- Line 669-674: Micro headline + hint → `t('micro.headline')`, `t('micro.hint')`
- Line 733: Back button → `t('buttons.back')`
- Line 745-755: Submit button states → `t('ui.submitting')`, `t('buttons.submit')`, `t('buttons.signInToSubmit')`
- Line 767: Continue button → `t('buttons.continue')`
- Line 509, 532, 540, 549, 554: Toast messages → `t('toasts.*')`
- Line 485: Error message → `t('errors.selectPro')`

---

### Task 5: Update dashboard.json with missing keys

**Add to `en/dashboard.json`:**
```json
"auth": {
  "signedOut": "Signed out"
},
"common": {
  "edit": "Edit"
}
```

**Add to `es/dashboard.json`:**
```json
"auth": {
  "signedOut": "Sesión cerrada"
},
"common": {
  "edit": "Editar"
}
```

---

## Files to Modify

| File | Change Type |
|------|-------------|
| `src/pages/dashboard/ClientDashboard.tsx` | Wire i18n |
| `src/pages/dashboard/ProDashboard.tsx` | Wire i18n |
| `src/components/wizard/canonical/CanonicalJobWizard.tsx` | Wire i18n |
| `src/i18n/index.ts` | Add wizard namespace |
| `src/i18n/namespaces.ts` | Add wizard constant |
| `public/locales/en/wizard.json` | Create new |
| `public/locales/es/wizard.json` | Create new |
| `public/locales/en/dashboard.json` | Add auth/common keys |
| `public/locales/es/dashboard.json` | Add auth/common keys |

---

## Estimated Effort

| Task | Time |
|------|------|
| ClientDashboard i18n | 15 min |
| ProDashboard i18n | 20 min |
| Create wizard.json (EN/ES) | 15 min |
| Wire CanonicalJobWizard | 25 min |
| Update dashboard.json | 5 min |
| Update i18n config | 5 min |
| **Total** | **~1.5 hours** |

---

## Technical Notes

1. **Namespace loading**: The i18n config uses `i18next-http-backend` with lazy loading, so adding `wizard` to the `ns` array will automatically load the file when needed.

2. **Interpolation**: Use `{{ variable }}` syntax for dynamic values (e.g., `t('pro.welcomeBack', { email: user?.email })`).

3. **Fallback**: Each `t()` call can include a fallback: `t('key', 'Default text')` for safety.

4. **No functional changes**: All wiring is purely string replacement — zero logic changes.

