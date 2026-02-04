
# Live Run: Seed 105 Question Packs

## Status Check Complete

### ✅ What's Ready
- **Edge Function**: `seedpacks` is deployed and working
- **Pack Files**: 8 TypeScript files with 105 total packs
- **Database**: Micro-service slugs verified for all 8 categories
- **Seeder Script**: `scripts/seed-all-new-packs.ts` ready

### ⚠️ Slug Status (After Fixes)

**Fixed (now match DB):**
- `minor-repairs` → `general-project` ✅
- `material-transport` → `material-delivery` ✅
- `site-deliveries` → `furniture-delivery` ✅
- `forklift-hire` → `skip-hire` ✅ (repurposed)
- `container-hire` → `man-with-van` ✅ (repurposed)

**Still Missing (will be skipped):**
- `storage-solutions` (was `storage-services`) - No matching DB slug

**Note:** `crane-hire` was already correct and exists in DB.

---

## Implementation Plan

### Step 1: Fix Slug Mismatches
Update the pack definition files to use correct database slugs:

**File: `supabase/functions/_shared/handymanQuestionPacksV2.ts`**
- Change `minor-repairs` → `general-project`

**File: `supabase/functions/_shared/transportLogisticsQuestionPacksV2.ts`**
- Change `material-transport` → `material-delivery`
- Change `site-deliveries` → `furniture-delivery`  
- Change `forklift-hire` → `heavy-equipment-transport`
- Change `container-hire` → `skip-hire`
- Change `storage-services` → `man-with-van`

### Step 2: Deploy Seeder Function
The `seedpacks` edge function is already deployed and verified working.

### Step 3: Run Dry-Run Test
Test via the edge function directly:
```
POST /functions/v1/seedpacks?dry_run=1
Body: { packs: [...all 105 packs...] }
```

Expected response:
- `validCount: 105` (all packs matched)
- `qualitySummary`: breakdown of STRONG/ACCEPTABLE/WEAK tiers
- `missingCount: 0` (after fixes)

### Step 4: Live Insert
Once dry-run passes:
```
POST /functions/v1/seedpacks
Body: { packs: [...all 105 packs...] }
```

Or run the batch seeder script:
```bash
DRY_RUN=0 npx tsx scripts/seed-all-new-packs.ts
```

### Step 5: Verify in Database
```sql
SELECT 
  COUNT(*) as total_packs,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '5 minutes' THEN 1 END) as new_packs
FROM question_packs;
```

---

## Expected Quality Distribution (After Seeding)

Based on the seeder's quality scoring:

| Tier | Count | Criteria |
|------|-------|----------|
| STRONG | ~0 | Requires `show_if` conditionals (+2 points) |
| ACCEPTABLE | ~90 | 5+ questions, 70%+ selection-based |
| WEAK | ~15 | 4 questions or lower selection ratio |
| FAILING | 0 | No banned phrases in any pack |

---

## Technical Notes

### Seeder Normalization (automatic)
- `microSlug` → `micro_slug`
- `question` → `label`
- `helpText` → `help`
- Adds `version: 1`, `is_active: true` defaults
- Type normalization: `single`/`yesno` → `radio`, `multi` → `checkbox`

### Upsert Behavior
The seeder uses `onConflict: "micro_slug"` so:
- New packs are **inserted**
- Existing packs are **updated** (replaced with new version)
- Safe to re-run multiple times

---

## Files to Modify

1. `supabase/functions/_shared/handymanQuestionPacksV2.ts` - Fix 1 slug
2. `supabase/functions/_shared/transportLogisticsQuestionPacksV2.ts` - Fix 5 slugs

## Summary

- **99 packs ready now** (will match DB slugs)
- **6 packs need slug fixes** (simple find/replace)
- **0 quality failures** (no banned phrases detected)
- **Edge function deployed** and verified
- **Batch seeder script ready** for execution
