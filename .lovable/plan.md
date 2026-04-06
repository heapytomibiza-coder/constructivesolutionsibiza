
# Price Calculator — Implementation Plan

## Adaptation Notes (Dev Handover vs Our Platform)

The handover doc proposes generic REST endpoints and a separate API layer. Our platform uses Supabase directly (RLS + RPCs + React Query). The plan below translates their intent into our architecture:

- **No REST endpoints** — all data flows through Supabase client + RPCs
- **Taxonomy already exists** — `service_categories` (16), `service_subcategories` (90), `service_micro_categories` (316) are live. Reuse `useServiceTaxonomy()` hook
- **Routes use `/prototype/` prefix** — kept outside main nav, not wired to rollout system
- **Terminology** — "Asker/Tasker" in UI copy, "client/professional" in code (per `scope.ts`)
- **Categories in handover doc** (e.g. "Home & Property Services") don't match ours — we use the 16 construction-only categories from `MAIN_CATEGORIES`

---

## Phase 1 Scope (This Build)

### 1. Database: Two New Tables

**`pricing_rules`** — admin-managed base rates per micro service
```
id, category, subcategory, micro_slug, micro_name,
base_labour_unit (hour|day|m2|item|project),
base_labour_min, base_labour_max,
base_material_min, base_material_max,
location_modifier (default 1.0 for Ibiza),
difficulty_modifier, urgency_modifier,
adjustment_factors (jsonb),
is_active, created_by,
created_at, updated_at
```
RLS: Admin-only write. Public read for active rules.

**`price_estimates`** — saved user estimates
```
id, user_id (nullable for concept but required by RLS),
category, subcategory, micro_slug, micro_name,
inputs (jsonb),
materials_min, materials_max,
labour_min, labour_max,
additional_min, additional_max,
total_min, total_max,
currency (default EUR),
confidence_level (low|medium|high),
pricing_source (manual_rule|template_rule|historical_average),
disclaimer_version (default v1),
status (draft|calculated|saved|archived),
linked_job_id (nullable),
created_at, updated_at
```
RLS: Users can CRUD own estimates. Admins can read all.

Seed 6 starter pricing rules for the initial covered services:
- Painting a room
- Plaster repair
- Flat-pack furniture assembly
- Built-in shelving
- Basic electrical light fitting replacement
- Garden clearance

### 2. Routes (4 pages)

Add to route registry under a new `prototypeRoutes` array:

| Route | Access | Component |
|---|---|---|
| `/prototype/price-calculator` | public | `PriceCalculatorPage` |
| `/prototype/price-calculator/history` | auth | `EstimateHistoryPage` |
| `/prototype/price-calculator/history/:id` | auth | `EstimateDetailPage` |
| `/prototype/admin/price-calculator` | admin | `AdminPricingRulesPage` |

Not added to nav. Accessed via direct URL or future CTA.

### 3. Frontend Components

**PriceCalculatorPage** (main page)
- Desktop: left panel (selection + inputs) / right panel (live estimate card)
- Mobile: stacked, sticky total summary
- Reuses `useServiceTaxonomy()` for category/subcategory/micro selection
- Dynamic input form driven by `adjustment_factors` jsonb from the pricing rule
- Disclaimer banner always visible
- "Save Estimate" button (auth-gated, shows login prompt for guests)
- "View History" link for authenticated users

**EstimateCard** — materials/labour/additional/total ranges with confidence badge

**EstimateHistoryPage** — table/cards of saved estimates with duplicate action

**EstimateDetailPage** — full saved record with breakdown

**AdminPricingRulesPage** — CRUD for pricing rules, coverage gaps view

### 4. Calculation Logic

Client-side calculation from the pricing rule (no edge function needed for Phase 1):

```
base_labour = rule.base_labour_min..max × quantity_or_area
base_material = rule.base_material_min..max × quantity_or_area
adjustments = apply difficulty/urgency/access modifiers
total = (labour + material) × location_modifier × adjustments
confidence = rule exists ? "medium" : "low"
```

### 5. Files to Create/Modify

**New files:**
- `src/pages/prototype/PriceCalculatorPage.tsx`
- `src/pages/prototype/EstimateHistoryPage.tsx`
- `src/pages/prototype/EstimateDetailPage.tsx`
- `src/pages/prototype/components/ServiceSelector.tsx`
- `src/pages/prototype/components/DynamicInputForm.tsx`
- `src/pages/prototype/components/EstimateCard.tsx`
- `src/pages/prototype/components/DisclaimerBanner.tsx`
- `src/pages/prototype/hooks/usePricingRule.ts`
- `src/pages/prototype/hooks/useEstimateHistory.ts`
- `src/pages/prototype/lib/calculateEstimate.ts`
- `src/pages/admin/pricing/AdminPricingRulesPage.tsx`

**Modified files:**
- `src/App.tsx` — add 4 lazy routes
- `src/app/routes/registry.ts` — add prototype routes (no nav)

**Migrations:**
- Create `pricing_rules` table + RLS
- Create `price_estimates` table + RLS
- Seed 6 starter pricing rules

### 6. What's NOT in Phase 1

- No link to job posting flow
- No historical quote comparison
- No notifications
- No edge function (calculation is client-side from rules)
- No i18n (English-only prototype copy)
- Not in main nav or rollout gating
