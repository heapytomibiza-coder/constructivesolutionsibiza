
# Seed Missing Question Packs from Master Framework

## Status: ✅ FILES CREATED

**Created:** 2026-02-04

All 8 pack definition files and the batch seeder have been created.

## Files Created

| File | Packs | Status |
|------|-------|--------|
| `supabase/functions/_shared/poolSpaQuestionPacksV2.ts` | 12 | ✅ |
| `supabase/functions/_shared/paintingDecoratingQuestionPacksV2.ts` | 20 | ✅ |
| `supabase/functions/_shared/gardeningLandscapingQuestionPacksV2.ts` | 14 | ✅ |
| `supabase/functions/_shared/handymanQuestionPacksV2.ts` | 7 | ✅ |
| `supabase/functions/_shared/cleaningQuestionPacksV2.ts` | 12 | ✅ |
| `supabase/functions/_shared/floorsDoorsWindowsQuestionPacksV2.ts` | 13 | ✅ |
| `supabase/functions/_shared/transportLogisticsQuestionPacksV2.ts` | 15 | ✅ |
| `supabase/functions/_shared/commercialIndustrialQuestionPacksV2.ts` | 12 | ✅ |
| `scripts/seed-all-new-packs.ts` | — | ✅ |

**Total: 105 packs ready**

## Next Steps

1. **Run dry-run to validate:**
   ```bash
   npx tsx scripts/seed-all-new-packs.ts
   ```

2. **Review quality report** for any warnings

3. **Run live seed:**
   ```bash
   DRY_RUN=0 npx tsx scripts/seed-all-new-packs.ts
   ```

4. **Verify in wizard** that questions render correctly

## Still Needed (Not Provided)

- **Architects & Design:** 12 packs
- **Legal & Regulatory:** 12 packs
- **Carpentry:** 16 packs
