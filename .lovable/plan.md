

# Seed V2 Question Packs

## Summary
Deploy the `seedpacks` edge function and seed all 10 categories of V2 question packs into the database. This will increase coverage from 157 packs (53%) to approximately 265 packs (89%).

## Current State

| Category | Already Seeded | Total Micros | V2 Packs Ready |
|----------|---------------|--------------|----------------|
| Architects & Design | 0 | 12 | 12 |
| Carpentry | 7 | 23 | ✓ V2 file exists |
| Cleaning | 0 | 12 | 12 |
| Commercial & Industrial | 0 | 12 | 12 |
| Construction | 50 | 50 | Already complete |
| Electrical | 32 | 32 | Already complete |
| Floors, Doors & Windows | 0 | 13 | 13 |
| Gardening & Landscaping | 0 | 14 | 14 |
| Handyman & General | 1 | 7 | 7 |
| HVAC | 36 | 36 | Already complete |
| Kitchen & Bathroom | 15 | 15 | Already complete |
| Painting & Decorating | 0 | 20 | 20 |
| Plumbing | 10 | 10 | Already complete |
| Pool & Spa | 0 | 12 | 12 |
| Transport & Logistics | 6 | 15 | 15 |
| Legal & Regulatory | 0 | 12 | Not written |

**Expected result**: ~108 new packs seeded across 10 categories

## Implementation Steps

### Step 1: Deploy the Seedpacks Edge Function
The `seedpacks` function exists in the codebase but is not deployed. Deploy it first.

### Step 2: Run Dry-Run Validation
Call the seedpacks function for each category with `dry_run=1` to validate:
- All micro slugs exist in the database
- Quality scores (STRONG/ACCEPTABLE/WEAK/FAILING)
- No duplicate question IDs

### Step 3: Execute Live Seeding
Call seedpacks for each of the 10 V2 categories without dry_run flag:
1. Pool & Spa (12 packs)
2. Painting & Decorating (20 packs)
3. Gardening & Landscaping (14 packs)
4. Handyman & General (7 packs)
5. Cleaning (12 packs)
6. Floors, Doors & Windows (13 packs)
7. Transport & Logistics (15 packs)
8. Commercial & Industrial (12 packs)
9. Carpentry (~16 packs remaining)
10. Architects & Design (12 packs)

### Step 4: Verify Results
Query the database to confirm the new pack count and coverage percentage.

## Technical Details

The `seedpacks` edge function handles:
- **Slug validation**: Only inserts packs where `micro_slug` matches an active `service_micro_categories.slug`
- **Quality scoring**: Rates packs as STRONG/ACCEPTABLE/WEAK/FAILING based on question count, type mix, and conditional logic
- **Deduplication**: Removes duplicate questions by ID or label
- **Normalization**: Converts `dependsOn` → `show_if`, normalizes question types (`single` → `radio`, `multi` → `checkbox`)
- **Upsert logic**: Uses `ON CONFLICT micro_slug` to update existing packs rather than failing

Each V2 pack follows the canonical formula:
- 5-8 questions per pack
- 70%+ multiple choice (radio/checkbox)
- Includes metadata: `category_contract` and `inspection_bias`
- Question IDs follow `{micro_slug}_{NN}_{shortname}` convention

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Missing micro slugs | Dry-run validation first; function reports missing slugs |
| Quality failures | Quality report identifies FAILING packs before insert |
| Duplicate question IDs | Function dedupes automatically and reports duplicates |

## Expected Outcome
- **Before**: 157 packs (53% coverage)
- **After**: ~265 packs (89% coverage)
- Only **Legal & Regulatory** (12 micros) will remain without packs

