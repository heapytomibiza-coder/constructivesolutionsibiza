

# Price Calculator — Hardening Pass

## Findings from audit

### 1. Seed rules: 5, not 6

**Current DB**: `wall-painting`, `build-shelving`, `shelving-units`, `install-ceiling-lights`, `tree-pruning` — exactly 5 rules.

**Missing from handover**: "Plaster Repair" and "Furniture Assembly" do not exist in the taxonomy. The closest matches are `venetian-plaster` (different service) and `furniture-selection`/`furniture-delivery` (neither is assembly). These cannot be seeded without creating fake taxonomy entries.

**Overlap**: `build-shelving` (Construction → Carpentry) and `shelving-units` (Carpentry → Custom Furniture) are genuinely different micro services in our taxonomy. One is basic wall-mounted shelving, the other is custom furniture-grade units. Both are valid — no overlap to fix.

**Action**: Keep 5 rules. Document that Plaster Repair and Furniture Assembly are not in our taxonomy. No seed changes needed.

### 2. Confidence level hardcoded to `'medium'`

`calculateEstimate.ts` line 113 returns `confidence_level: 'medium'` for all manual-rule calculations. The DB column defaults to `'low'`, but the client-side function overrides it.

**Action**: Change `calculateEstimate.ts` to return `'low'` for `pricing_source: 'manual_rule'`. Phase 1 has no historical data, so `medium` is misleading.

### 3. No rule snapshot saved with estimates

Currently `useSaveEstimate` saves inputs and result values, but nothing about which rule or rule version was used. When rules change, old estimates become unauditable.

**Action**: 
- Add `rule_snapshot` jsonb column to `price_estimates` (nullable, default null)
- Add `EstimateResult.rule_snapshot` to the return type
- Save `{ rule_id, location_modifier, base_labour_min, base_labour_max, base_material_min, base_material_max, rule_updated_at }` at save time

### 4. Duplicate behavior — already correct

`useDuplicateEstimate` creates with `status: 'draft'`. This is the right behavior. No change needed.

### 5. "No pricing rule" empty state is a dead end

Current empty state (line 140-145 of PriceCalculatorPage) says "Post a job to receive real quotes" but has no link or CTA button.

**Action**: Add a "Post a Job" button linking to `/post-job` and a secondary note about requesting quotes. Keep it simple — one real CTA instead of plain text.

### 6. Query shape — no action needed now

All pricing rules are fetched once with `staleTime: 5min`. History is only loaded on `/history` page. This is fine for 5–50 rules. Flag for future only.

---

## Implementation

### Step 1: Migration — add `rule_snapshot` column

```sql
ALTER TABLE price_estimates 
  ADD COLUMN rule_snapshot jsonb DEFAULT NULL;
```

### Step 2: Update `calculateEstimate.ts`

- Change line 113 from `confidence_level: 'medium'` to `confidence_level: 'low'`
- Add `rule_snapshot` to `EstimateResult` interface (optional field, populated by caller)

### Step 3: Update `useEstimateHistory.ts` — save rule snapshot

In `useSaveEstimate`, accept the rule object and save a snapshot:
```typescript
rule_snapshot: {
  rule_id: args.rule.id,
  location_modifier: args.rule.location_modifier,
  base_labour_min: args.rule.base_labour_min,
  base_labour_max: args.rule.base_labour_max,
  base_material_min: args.rule.base_material_min,
  base_material_max: args.rule.base_material_max,
  rule_updated_at: args.rule.updated_at,
}
```

Update `SaveEstimateArgs` interface to include the rule.

### Step 4: Update `PriceCalculatorPage.tsx` — pass rule to save, fix empty state

- Pass `rule` object into `saveEstimate.mutate()` args
- Replace plain-text empty state with a CTA button to `/post-job`

### Step 5: Update `PriceCalculatorPage.tsx` — wire rule into save call

Update `handleSave` to include the rule in the mutation args.

---

## Files changed

| File | Change |
|---|---|
| `src/pages/prototype/lib/calculateEstimate.ts` | confidence → `'low'`, add `rule_snapshot` to interface |
| `src/pages/prototype/hooks/useEstimateHistory.ts` | accept rule in save args, persist snapshot |
| `src/pages/prototype/PriceCalculatorPage.tsx` | pass rule to save, improve empty state with CTA |
| Migration | add `rule_snapshot` column to `price_estimates` |

## What this does NOT change

- No new seed rules (taxonomy doesn't support the missing services)
- No duplicate behavior change (already correct)
- No query optimization (not needed at current scale)

