

# i18n Wiring Fix Plan: Homepage & Search Components

## Problem Summary

The i18n infrastructure is working correctly - translation files load, language switching works, and components using `t()` translate properly. However, several major components still contain hardcoded English strings instead of using the existing translation keys.

---

## Current State

| Component | Translation Status |
|-----------|-------------------|
| PublicNav | Working - uses `t('nav.*')` |
| Wizard buttons/steps | Working - uses `t('wizard.*')` |
| Dashboards | Working - uses `t('dashboard.*')` |
| Index.tsx (Homepage) | Broken - hardcoded strings |
| ServiceSearchBar | Broken - hardcoded strings |
| CategorySelector | Broken - hardcoded strings |

---

## What Needs Fixing

### 1. Index.tsx (Homepage) - Wire to common.json

The translation keys already exist in `common.json`. We need to:

1. Add `useTranslation('common')` import
2. Replace hardcoded strings with existing keys

**String mappings:**
| Hardcoded | Key |
|-----------|-----|
| "Find Trusted Construction Professionals" | `t('hero.title')` |
| "Post a Job" | `t('hero.postJob')` |
| "Browse Professionals" | `t('hero.browsePros')` |
| "Verified trades" | `t('trust.verified')` |
| "Same-day response" | `t('trust.sameDay')` |
| "Ibiza-based" | `t('trust.local')` |

**New keys needed in common.json:**
```json
"home": {
  "ourServices": "Our Services",
  "ourServicesDesc": "Find trusted professionals across all construction and property services",
  "viewAllServices": "View All Services",
  "verifiedTitle": "Verified Professionals",
  "verifiedDesc": "All professionals are vetted and verified before joining",
  "quickTitle": "Quick Response",
  "quickDesc": "Get quotes from multiple professionals within hours",
  "qualityTitle": "Quality Guaranteed",
  "qualityDesc": "Rated and reviewed by real customers in Ibiza",
  "ctaTitle": "Ready to start your project?",
  "ctaDesc": "Post your job for free and receive quotes from trusted local professionals.",
  "ctaButton": "Post a Job Now"
}
```

---

### 2. ServiceSearchBar - Wire to wizard.json

Add search-related keys to wizard namespace.

**New keys for wizard.json:**
```json
"search": {
  "placeholder": "Search for a service (e.g., underfloor heating, need painter ASAP)...",
  "noResults": "No services found for \"{{query}}\"",
  "jobDetected": "We detected a job request — we'll skip ahead to save you time",
  "depthCategory": "Category",
  "depthService": "Service",
  "depthTask": "Task",
  "depthJobRequest": "Job Request",
  "ready": "Ready"
}
```

---

### 3. Category Names - Create categories namespace

Category names come from `MAIN_CATEGORIES` constant and database. Two options:

**Option A (Recommended):** Create a category translation helper that maps English category names to translation keys:
```typescript
const categoryKeys: Record<string, string> = {
  'Construction': 'categories.construction',
  'Carpentry': 'categories.carpentry',
  // ...
};
```

**Option B:** Keep categories in English (acceptable for MVP since they're proper nouns/industry terms that are often the same across languages)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add `useTranslation('common')`, wire all strings |
| `src/components/wizard/db-powered/ServiceSearchBar.tsx` | Add `useTranslation('wizard')`, wire labels |
| `public/locales/en/common.json` | Add `home.*` keys |
| `public/locales/es/common.json` | Add Spanish `home.*` keys |
| `public/locales/en/wizard.json` | Add `search.*` keys |
| `public/locales/es/wizard.json` | Add Spanish `search.*` keys |

---

## Implementation Order

1. **Add missing translation keys** to common.json and wizard.json (EN + ES)
2. **Wire Index.tsx** - replace all hardcoded strings
3. **Wire ServiceSearchBar** - replace placeholder and labels
4. **Test** - Switch to Spanish and verify homepage + search translate

---

## Spanish Translations to Add

**common.json ES - home section:**
```json
"home": {
  "ourServices": "Nuestros Servicios",
  "ourServicesDesc": "Encuentra profesionales de confianza en todos los servicios de construcción",
  "viewAllServices": "Ver Todos los Servicios",
  "verifiedTitle": "Profesionales Verificados",
  "verifiedDesc": "Todos los profesionales están verificados antes de unirse",
  "quickTitle": "Respuesta Rápida",
  "quickDesc": "Recibe presupuestos de varios profesionales en horas",
  "qualityTitle": "Calidad Garantizada",
  "qualityDesc": "Valorados por clientes reales en Ibiza",
  "ctaTitle": "¿Listo para empezar tu proyecto?",
  "ctaDesc": "Publica tu trabajo gratis y recibe presupuestos de profesionales locales.",
  "ctaButton": "Publicar Trabajo Ahora"
}
```

**wizard.json ES - search section:**
```json
"search": {
  "placeholder": "Buscar un servicio (ej: calefacción suelo radiante, necesito pintor urgente)...",
  "noResults": "No se encontraron servicios para \"{{query}}\"",
  "jobDetected": "Detectamos una solicitud de trabajo — te llevaremos directamente",
  "depthCategory": "Categoría",
  "depthService": "Servicio",
  "depthTask": "Tarea",
  "depthJobRequest": "Solicitud",
  "ready": "Listo"
}
```

---

## Estimated Effort

| Task | Time |
|------|------|
| Add translation keys to JSON files | 10 min |
| Wire Index.tsx | 15 min |
| Wire ServiceSearchBar | 10 min |
| Testing | 5 min |
| **Total** | ~40 min |

---

## Technical Notes

1. **Category names**: For MVP, keeping English category names is acceptable since they're industry terms often used internationally. A full category translation system can be added later.

2. **Database content**: Category/subcategory names stored in the database will remain in English. Full database localization is out of scope for this phase.

3. **Existing keys**: The `common.json` already has `hero.*` and `trust.*` keys that just need to be wired up.

