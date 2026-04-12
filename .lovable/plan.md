

# Agent 5: Smart Budget Suggestion — Implementation Plan

## What We're Building
A data-driven budget suggestion shown in the wizard's Logistics step (budget section). When micro services are selected, the system queries historical completed jobs to suggest a realistic price range. No AI for number generation — data only. Optional AI explanation deferred to Phase 2.

## Architecture Fit
- Data-driven first: SQL percentile aggregation on completed jobs via `job_micro_links`
- No schema drift: zero new columns on `jobs`; one new RPC function only
- Wizard unchanged: suggestion appears as an optional hint below the budget chips
- User retains full control: can accept, ignore, or override
- Not visible to professionals
- Not used in matching (v1)

## Implementation Steps

### 1. Database: RPC Function (Migration)
Create `get_budget_range_for_micros(p_micro_slugs text[])` that returns `(sample_size int, p20 numeric, p50 numeric, p80 numeric)` by joining `jobs` + `job_micro_links` on completed jobs with non-null budget values. Percentile-based to avoid outlier distortion.

### 2. Edge Function: `get-budget-suggestion`
- Input: `{ micro_slugs: string[] }`
- Calls the RPC with service-role client
- If `sample_size < 5` → returns safe fallback ("Not enough data")
- Otherwise returns `{ suggested_min, suggested_max, confidence, basis }` 
- Rounds to clean numbers (nearest €50)
- Confidence = `min(1, sample_size / 20)`
- No AI calls in v1
- Uses existing `_shared/cors.ts` pattern

### 3. Frontend: LogisticsStep Budget Section
- New hook `useBudgetSuggestion(microSlugs)` — calls edge function when micros are available
- Shows a subtle hint card above the budget chips when data is available:
  - "💡 Similar jobs: €X – €Y (based on N jobs)"
  - "Use this range" button sets `budgetRange` to nearest matching chip
  - Dismissible, non-blocking
- Loading state while fetching (~200ms, it's just SQL)
- Hidden when no data or below confidence threshold

### 4. Translation Keys
- Add `logistics.budget.suggestion`, `logistics.budget.suggestionBasis`, `logistics.budget.useSuggestion`, `logistics.budget.noData` to `en/wizard.json` and `es/wizard.json`

### 5. Config
- Add `[functions.get-budget-suggestion]` with `verify_jwt = false` to `supabase/config.toml`

## Files Affected
- **New**: `supabase/functions/get-budget-suggestion/index.ts`
- **New migration**: RPC `get_budget_range_for_micros`
- **New**: `src/features/wizard/canonical/steps/logistics/useBudgetSuggestion.ts`
- **Edit**: `src/features/wizard/canonical/steps/LogisticsStep.tsx` (add suggestion card in budget section)
- **Edit**: `public/locales/en/wizard.json` (new keys)
- **Edit**: `public/locales/es/wizard.json` (new keys)
- **Edit**: `supabase/config.toml` (function config)

## Safety
- Never overrides user input
- Never stores suggestions
- Falls back silently if RPC returns insufficient data
- Rounds numbers to avoid false precision
- Not visible to professionals
- Not used in matching or ranking
- Minimum sample size enforced (5 jobs)

