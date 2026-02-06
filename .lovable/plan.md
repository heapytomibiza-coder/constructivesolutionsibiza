

# Translate Category Names in Service Tiles

## Problem

The service category tiles on the homepage display hardcoded English names from the `MAIN_CATEGORIES` constant, even when Spanish is selected. As shown in the screenshot, everything translates except: "Construction", "Carpentry", "Plumbing", etc.

---

## Solution

Add a `categories` namespace to `common.json` and create a translation helper to map English category names to localized versions.

---

## Files to Modify

| File | Changes |
|------|---------|
| `public/locales/en/common.json` | Add `categories.*` keys for all 16 categories |
| `public/locales/es/common.json` | Add Spanish translations for all 16 categories |
| `src/pages/Index.tsx` | Use translation helper to display localized category names |

---

## Translation Keys to Add

### English (common.json)
```json
"categories": {
  "construction": "Construction",
  "carpentry": "Carpentry",
  "plumbing": "Plumbing",
  "electrical": "Electrical",
  "hvac": "HVAC",
  "paintingDecorating": "Painting & Decorating",
  "cleaning": "Cleaning",
  "gardeningLandscaping": "Gardening & Landscaping",
  "poolSpa": "Pool & Spa",
  "architectsDesign": "Architects & Design",
  "transportLogistics": "Transport & Logistics",
  "kitchenBathroom": "Kitchen & Bathroom",
  "floorsDoorsWindows": "Floors, Doors & Windows",
  "handymanGeneral": "Handyman & General",
  "commercialIndustrial": "Commercial & Industrial",
  "legalRegulatory": "Legal & Regulatory"
}
```

### Spanish (common.json)
```json
"categories": {
  "construction": "Construcción",
  "carpentry": "Carpintería",
  "plumbing": "Fontanería",
  "electrical": "Electricidad",
  "hvac": "Climatización",
  "paintingDecorating": "Pintura y Decoración",
  "cleaning": "Limpieza",
  "gardeningLandscaping": "Jardinería y Paisajismo",
  "poolSpa": "Piscina y Spa",
  "architectsDesign": "Arquitectos y Diseño",
  "transportLogistics": "Transporte y Logística",
  "kitchenBathroom": "Cocina y Baño",
  "floorsDoorsWindows": "Suelos, Puertas y Ventanas",
  "handymanGeneral": "Manitas y General",
  "commercialIndustrial": "Comercial e Industrial",
  "legalRegulatory": "Legal y Normativo"
}
```

---

## Index.tsx Changes

Create a mapping from English category names to translation keys:

```typescript
// Category name to translation key mapping
const CATEGORY_KEYS: Record<string, string> = {
  'Construction': 'categories.construction',
  'Carpentry': 'categories.carpentry',
  'Plumbing': 'categories.plumbing',
  'Electrical': 'categories.electrical',
  'HVAC': 'categories.hvac',
  'Painting & Decorating': 'categories.paintingDecorating',
  'Cleaning': 'categories.cleaning',
  'Gardening & Landscaping': 'categories.gardeningLandscaping',
  'Pool & Spa': 'categories.poolSpa',
  'Architects & Design': 'categories.architectsDesign',
  'Transport & Logistics': 'categories.transportLogistics',
  'Kitchen & Bathroom': 'categories.kitchenBathroom',
  'Floors, Doors & Windows': 'categories.floorsDoorsWindows',
  'Handyman & General': 'categories.handymanGeneral',
  'Commercial & Industrial': 'categories.commercialIndustrial',
  'Legal & Regulatory': 'categories.legalRegulatory',
};
```

Then update line 102 from:
```tsx
<span className="font-medium text-foreground">{category}</span>
```

To:
```tsx
<span className="font-medium text-foreground">
  {t(CATEGORY_KEYS[category] || category)}
</span>
```

---

## Result

After this change:
- **English**: Construction, Carpentry, Plumbing...
- **Spanish**: Construcción, Carpintería, Fontanería...

The URL slugs remain in English (e.g., `/services/construction`) for SEO and consistency with database values.

---

## Implementation Order

1. Add `categories.*` keys to EN common.json
2. Add Spanish translations to ES common.json
3. Add `CATEGORY_KEYS` mapping to Index.tsx
4. Update the category label render to use `t()`
5. Test language switching on homepage

