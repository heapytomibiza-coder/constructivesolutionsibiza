

## Launch Polish: Copy and Visual Fixes

Three changes covering the dispatch mode copy update, budget display formatting, and the broader copy consistency pass.

---

### 1. Update dispatch mode copy (ReviewStep)

**File:** `src/features/wizard/canonical/steps/ReviewStep.tsx`

Replace the two radio option labels and descriptions:

| Current | New |
|---------|-----|
| Send to available professionals | Post to job board |
| Your job will be visible to matching professionals who can respond | All professionals in this category can see and respond |
| Send to a specific professional | Send privately |
| Start a private conversation — no public listing | Only professionals you select will receive this job |

These strings are hardcoded in the component (not in i18n files), so the edit is directly in ReviewStep.tsx lines ~133-152.

---

### 2. Fix budget display formatting (underscore in UI)

**File:** `src/features/wizard/canonical/lib/formatDisplay.ts`

The `formatBudgetRange` fallback currently does `raw.replace(/_/g, ' ')` which could show `under 500` instead of a proper label. The existing `BUDGET_DISPLAY` map handles known values, but ensure the fallback also applies proper formatting. This is already mostly handled -- just verify no raw underscore values leak through.

---

### 3. Add dispatch copy to i18n files (optional but recommended)

Move the hardcoded dispatch strings into the translation files so Spanish users see translated text:

**File:** `public/locales/en/jobs.json` -- add under `wizard`:
```
"dispatchTitle": "How would you like to send this job?",
"broadcastTitle": "Post to job board",
"broadcastDesc": "All professionals in this category can see and respond",
"directTitle": "Send privately",
"directDesc": "Only professionals you select will receive this job"
```

**File:** `public/locales/es/jobs.json` -- add under `wizard`:
```
"dispatchTitle": "Como quieres enviar este trabajo?",
"broadcastTitle": "Publicar en bolsa de trabajo",
"broadcastDesc": "Todos los profesionales de esta categoria pueden ver y responder",
"directTitle": "Enviar en privado",
"directDesc": "Solo los profesionales que selecciones recibiran este trabajo"
```

Then update ReviewStep.tsx to use `t('jobs:wizard.broadcastTitle')` etc. instead of hardcoded strings.

---

### Files Changed

| File | Change |
|------|--------|
| `src/features/wizard/canonical/steps/ReviewStep.tsx` | Update dispatch option copy, use i18n keys |
| `public/locales/en/jobs.json` | Add dispatch mode translation keys |
| `public/locales/es/jobs.json` | Add Spanish dispatch mode translations |

