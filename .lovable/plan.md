
# Seed Missing Question Packs from Master Framework

## Overview

You've provided question pack definitions for **8 categories** covering **105 micro-services**. I'll transform these into the correct database format and create seeding scripts.

## Current Status

| Category | Missing | Your Definitions | Status |
|----------|---------|------------------|--------|
| Pool & Spa | 12 | 12 | Ready to seed |
| Painting & Decorating | 20 | 20 | Ready to seed |
| Gardening & Landscaping | 14 | 14 | Ready to seed |
| Handyman & General | 6 | 7 | Ready to seed |
| Cleaning | 12 | 12 | Ready to seed |
| Floors, Doors & Windows | 13 | 13 | Ready to seed |
| Transport & Logistics | 9 | 15 | Ready to seed |
| Commercial & Industrial | 12 | 12 | Ready to seed |
| Architects & Design | 12 | 0 | Not provided |
| Legal & Regulatory | 12 | 0 | Not provided |
| Carpentry | 16 | 0 | Not provided |

**Total: 105 packs ready to seed** (from your definitions)
**Remaining: 40 packs still need definitions** (Architects, Legal, Carpentry)

---

## Implementation Plan

### Phase 1: Create Pack Definition Files

Create TypeScript files in `supabase/functions/_shared/` for each category:

```text
supabase/functions/_shared/
├── poolSpaQuestionPacksV2.ts      (12 packs)
├── paintingDecoratingQuestionPacks.ts  (20 packs)
├── gardeningLandscapingQuestionPacksV2.ts  (14 packs)
├── handymanQuestionPacksV2.ts     (7 packs)
├── cleaningQuestionPacks.ts       (12 packs)
├── floorsDoorsWindowsQuestionPacksV2.ts  (13 packs)
├── transportLogisticsQuestionPacks.ts  (15 packs)
└── commercialIndustrialQuestionPacks.ts  (12 packs)
```

### Phase 2: Create Seeder Scripts

Create scripts in `scripts/` directory:

```text
scripts/
├── seed-pool-spa-v2.ts
├── seed-painting-decorating.ts
├── seed-gardening-landscaping-v2.ts
├── seed-handyman-v2.ts
├── seed-cleaning.ts
├── seed-floors-doors-windows-v2.ts
├── seed-transport-logistics.ts
└── seed-commercial-industrial.ts
```

### Phase 3: Run Seeders

Execute in order (dry-run first, then live):
```bash
# Dry run
npx tsx scripts/seed-pool-spa-v2.ts

# Live (after verification)
DRY_RUN=0 npx tsx scripts/seed-pool-spa-v2.ts
```

---

## Technical Details

### Pack Format Transformation

Your definitions use a simplified format:
```
Q1. Location
- Apartment
- Villa / House
- Commercial property
```

Transforms to database format:
```typescript
{
  micro_slug: 'concrete-pools',
  title: 'Concrete Pools',
  version: 1,
  is_active: true,
  metadata: {
    category_contract: 'pool-spa',
    inspection_bias: 'medium'
  },
  questions: [
    {
      id: 'concrete_pools_01_location',
      label: 'Location',
      type: 'radio',
      required: true,
      options: [
        { value: 'apartment', label: 'Apartment' },
        { value: 'villa_house', label: 'Villa / House' },
        { value: 'commercial_property', label: 'Commercial property' }
      ]
    },
    // ... more questions
  ]
}
```

### Slug Mapping

Your definitions will be mapped to these exact database slugs:

**Pool & Spa (12)**
```text
concrete-pools, fibreglass-pools, infinity-pools, chemical-balancing,
equipment-service, pool-cleaning, pool-deck-repair, pool-resurfacing,
tile-replacement, hot-tub-installation, sauna-installation, spa-maintenance
```

**Painting & Decorating (20)**
```text
faux-finishes, murals, textured-walls, venetian-plaster,
paint-facade, paint-fence, deck-staining, facade-painting,
fence-painting, pressure-washing, paint-ceiling, paint-walls,
paint-woodwork, cabinet-painting, ceiling-painting, trim-woodwork,
wall-painting, feature-walls, wallpaper-installation, wallpaper-removal
```

**Gardening & Landscaping (14)**
```text
create-garden-plan, garden-planning, hardscaping, install-irrigation,
planting-schemes, drip-irrigation, irrigation-repair, sprinkler-installation,
lawn-treatment, turf-installation, hedge-trimming, lawn-mowing,
tree-pruning, tree-removal
```

**Handyman & General (7)** *(includes minor-repairs not in your list)*
```text
general-maintenance, gutter-cleaning, pressure-cleaning,
curtain-rails, picture-hanging, tv-mounting, minor-repairs
```

**Cleaning (12)**
```text
office-cleaning, restaurant-cleaning, retail-cleaning,
carpet-cleaning, oven-cleaning, upholstery-cleaning,
debris-removal, dust-removal, final-polish,
move-in-out-cleaning, regular-cleaning, spring-cleaning
```

**Floors, Doors & Windows (13)**
```text
door-fitting, door-hardware, door-replacement,
floor-sanding, hardwood-flooring, laminate-flooring, tile-flooring,
glass-repair, glass-replacement, mirror-installation,
double-glazing, window-fitting, window-replacement
```

**Transport & Logistics (15)** *(your list has 15, DB has 9 missing)*
```text
same-day-delivery, machinery-rental, scaffolding-rental, tool-rental,
international-moving, local-moving, packing-services,
garden-waste, rubbish-clearance
```

**Commercial & Industrial (12)**
```text
office-fit-out, restaurant-fit-out, retail-fit-out,
factory-building, industrial-flooring, warehouse-construction,
meeting-rooms, partition-walls, suspended-ceilings,
bar-construction, hotel-renovation, shop-front
```

---

## Files to Create

### 1. Pool & Spa Pack File
`supabase/functions/_shared/poolSpaQuestionPacksV2.ts`

- 12 packs with your exact questions
- Uses radio buttons for all single-choice
- Includes file upload for photos/plans
- Category contract: pool-spa

### 2. Painting & Decorating Pack File
`supabase/functions/_shared/paintingDecoratingQuestionPacks.ts`

- 20 packs covering all subcategories
- Decorative Finishes, Exterior, Interior, Wallpapering
- Category contract: painting

### 3. Gardening & Landscaping Pack File
`supabase/functions/_shared/gardeningLandscapingQuestionPacksV2.ts`

- 14 packs for garden design, irrigation, lawn care, maintenance
- Category contract: gardening

### 4. Handyman Pack File
`supabase/functions/_shared/handymanQuestionPacksV2.ts`

- 7 packs for home maintenance and odd jobs
- Category contract: handyman

### 5. Cleaning Pack File
`supabase/functions/_shared/cleaningQuestionPacks.ts`

- 12 packs: commercial, deep cleaning, post-construction, residential
- Category contract: cleaning

### 6. Floors, Doors & Windows Pack File
`supabase/functions/_shared/floorsDoorsWindowsQuestionPacksV2.ts`

- 13 packs for doors, flooring, glazing, windows
- Category contract: floors-doors-windows

### 7. Transport & Logistics Pack File
`supabase/functions/_shared/transportLogisticsQuestionPacks.ts`

- 15 packs (only 9 will match active DB slugs)
- Category contract: transport

### 8. Commercial & Industrial Pack File
`supabase/functions/_shared/commercialIndustrialQuestionPacks.ts`

- 12 packs for fit-outs, industrial, office, retail
- Category contract: commercial

### 9. Batch Seeder Script
`scripts/seed-all-new-packs.ts`

- Seeds all 8 categories in sequence
- Supports dry-run mode
- Reports quality scores and any missing slugs

---

## Execution Order

1. **Create all pack definition files** (8 files)
2. **Create batch seeder script** (1 file)
3. **Run dry-run** to validate slug matching
4. **Review quality report** for any warnings
5. **Run live seed** to insert packs
6. **Verify in wizard** that questions render

---

## Still Needed (Not Provided)

You'll need to create question definitions for:

1. **Architects & Design (12 packs)**
   - 3D Visualization: 3d-rendering, floor-plans, virtual-walkthrough
   - Architectural Design: renovation-design, extension-design, new-build-design
   - Interior Design: space-planning, color-consultation, furniture-selection
   - Project Management: budget-management, contractor-coordination, construction-management

2. **Legal & Regulatory (12 packs)**
   - Building Permits: council-liaison, document-preparation, permit-application
   - Compliance: environmental-compliance, health-safety, building-regulations
   - Inspections: safety-inspection, pre-purchase-survey, building-inspection
   - Planning Applications: pre-application-advice, appeal-support, planning-submission

3. **Carpentry (16 packs)**
   - Custom Furniture: bed-frames
   - Decking & Pergolas: wooden-decking, pergola-construction, gazebos, composite-decking
   - Doors & Windows: window-frames, shutters, exterior-doors, interior-doors
   - Restoration: antique-restoration, wood-repair, refinishing
   - Structural Carpentry: wall-framing, beam-installation, floor-joists, roof-framing

---

## Summary

- **105 packs ready** from your definitions
- **8 TypeScript pack files** to create
- **1 batch seeder script**
- **40 packs still need definitions** (Architects, Legal, Carpentry)

After approval, I'll create all the files and you can run the seeder to populate the database.
