

# Step 4 Contract Lock - Final Implementation Plan

## Current State Summary

### What's Already Done ✅

1. **Seedpacks Function** (`supabase/functions/seedpacks/index.ts`):
   - Already has `dependsOn` → `show_if` normalization (line 152-157)
   - Already has `helpText` → `help` normalization (line 169)
   - Already has quality scoring and tier classification
   - Already has banned phrase detection

2. **QuestionPackRenderer** (`src/components/wizard/canonical/steps/QuestionPackRenderer.tsx`):
   - Already supports `file` type (lines 125-137)
   - Already has `shouldShowQuestion` conditional visibility (lines 76-85)
   - Already displays `help` text (lines 207-209)

3. **QuestionsStep** (`src/components/wizard/canonical/steps/QuestionsStep.tsx`):
   - Already has quality tier detection (`getPackQualityTier` function, lines 45-57)
   - Already shows tier-specific labels ("General briefing", "Upgrading this service")

4. **Strong Packs in DB**: 23 strong packs already seeded (up from 15):
   - `pipe-repair`, `fix-leak`, `dining-tables`, `wardrobes`, `shelving-units`
   - `kitchen-cabinets`, `install-toilet`, `install-shower`
   - Plus 15 more from HVAC, Construction, Transport, Electrical

### Coverage Stats
- **102 total packs** in DB
- **23 strong packs** (trade-aware, 5+ questions, no generic opener)
- **78 generic packs** (have "briefly describe" opener)
- **286 micro-services** in taxonomy

---

## Critical Finding: Slug Mismatch

The source files use slugs that **don't exist in the V2 taxonomy**:

| Source File Pack | Source Slug | DB Taxonomy Has? |
|------------------|-------------|------------------|
| Plumbing: burstPipePack | `burst-pipe` | ❌ No |
| Plumbing: sewerBackupPack | `sewer-backup` | ❌ No |
| Plumbing: waterHeaterEmergencyPack | `water-heater-emergency` | ❌ No |
| Carpentry: bespokeTablesPack | `bespoke-tables` | ❌ No (`dining-tables` exists) |
| Carpentry: slidingDoorWardrobesPack | `sliding-door-wardrobes` | ❌ No (`wardrobes` exists) |
| Carpentry: staircasesHandrailsPack | `staircases-handrails` | ❌ No |

**This is why the seeding script would fail** - the slugs from source files won't match the DB taxonomy validation.

---

## What Actually Needs To Be Done

### Option A: Remap Source Slugs to DB Slugs (Recommended)

Update the seeding scripts to map source slugs to actual DB taxonomy slugs:

```typescript
// In seed-strong-packs.ts, add slug remapping
const SLUG_ALIASES: Record<string, string> = {
  'burst-pipe': 'pipe-repair',        // Maps to existing DB slug
  'bespoke-tables': 'dining-tables',  // Maps to existing DB slug
  'sliding-door-wardrobes': 'wardrobes', // Maps to existing DB slug
};

const remapPack = (pack) => ({
  ...pack,
  microSlug: SLUG_ALIASES[pack.microSlug] || pack.microSlug,
});
```

**Problem**: The packs for `pipe-repair`, `dining-tables`, `wardrobes` are already seeded with strong questions. No action needed for those.

### Option B: Add Missing Slugs to Taxonomy (For True Gap Coverage)

Add these micro-services to the taxonomy:
- `sewer-backup` → under Plumbing > Drainage
- `water-heater-emergency` → under Plumbing > Hot Water
- `staircases-handrails` → under Carpentry > Structural or Bespoke

Then seed the source packs with matching slugs.

---

## Recommended Next Steps

### 1. Verify What's Actually Missing

Run this query to see which commercial micros still have generic/missing packs:

```sql
SELECT smc.slug, smc.name, sc.name as category,
  COALESCE(qp.q_count, 0) as questions,
  CASE 
    WHEN qp.micro_slug IS NULL THEN 'MISSING'
    WHEN qp.questions::text ILIKE '%briefly describe%' THEN 'GENERIC'
    ELSE 'STRONG'
  END as status
FROM service_micro_categories smc
JOIN service_subcategories ssc ON smc.subcategory_id = ssc.id
JOIN service_categories sc ON ssc.category_id = sc.id
LEFT JOIN (
  SELECT micro_slug, questions, jsonb_array_length(questions) as q_count
  FROM question_packs WHERE is_active = true
) qp ON qp.micro_slug = smc.slug
WHERE smc.is_active = true
ORDER BY status DESC, sc.name, smc.name;
```

### 2. Priority Actions

| Action | Impact | Effort |
|--------|--------|--------|
| Add `sewer-backup`, `water-heater-emergency`, `staircases-handrails` to taxonomy | Unlocks 3 V1 packs | Low (SQL migration) |
| Seed those 3 packs via seedpacks | +3 strong packs | Low |
| Rewrite top 10 generic HVAC packs | Major quality lift | Medium |

### 3. Seedpacks Edge Function Status

The function is deployed and working. The previous 404 errors were platform propagation delays. Current deployment is functional.

---

## Files Status Summary

| File | Status | Action Needed |
|------|--------|---------------|
| `seedpacks/index.ts` | ✅ Complete | None - all normalizations present |
| `QuestionPackRenderer.tsx` | ✅ Complete | None - file/conditionals/help all work |
| `QuestionsStep.tsx` | ✅ Complete | None - quality tier labels present |
| `scripts/seed-strong-packs.ts` | ⚠️ Needs fix | Update slugs to match DB taxonomy |
| `plumbingQuestionPacks.ts` | ⚠️ Slug mismatch | Slugs don't match DB (`burst-pipe` vs `pipe-repair`) |
| `carpentryQuestionPacks.ts` | ⚠️ Slug mismatch | Slugs don't match DB (`bespoke-tables` vs `dining-tables`) |

---

## Recommended Implementation

### Phase 1: Add Missing Taxonomy Entries (SQL Migration)

```sql
-- Add missing micro-services that have V1 pack content ready
INSERT INTO service_micro_categories (subcategory_id, name, slug, is_active)
SELECT 
  ssc.id,
  'Sewer backup' as name,
  'sewer-backup' as slug,
  true
FROM service_subcategories ssc
WHERE ssc.slug = 'drainage' AND NOT EXISTS (
  SELECT 1 FROM service_micro_categories WHERE slug = 'sewer-backup'
);

-- Similar for water-heater-emergency and staircases-handrails
```

### Phase 2: Fix Seeding Script Slugs

Update `scripts/seed-strong-packs.ts` to either:
1. Filter to only packs with matching DB slugs, OR
2. Skip packs that would fail validation

### Phase 3: Seed Remaining Strong Packs

After taxonomy is extended, run the seed script.

---

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Strong packs in DB | 23 | 30+ |
| Renderer supports conditionals | ✅ | ✅ |
| Renderer supports file type | ✅ | ✅ |
| Quality tier labels | ✅ | ✅ |
| Fallback clearly labeled | ✅ | ✅ |

**The core Step 4 contract lock is ALREADY IMPLEMENTED.** The remaining work is content seeding and taxonomy alignment.

