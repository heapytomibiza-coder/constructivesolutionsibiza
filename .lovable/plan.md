

# Price Calculator — Implementation Plan

## Context

Nothing has been built yet. No tables, no files, no routes exist. The handover doc is a guideline — several details don't match our platform (REST endpoints, category names, some micro services). This plan adapts everything to our architecture.

## Key Adaptations from Handover

| Handover says | Our platform does |
|---|---|
| REST endpoints (`GET /pricing/...`) | Direct Supabase client queries, no API layer |
| Separate `/results` page | Inline estimate card on same page (simpler, faster) |
| Categories like "Home & Property Services" | Our 16 construction categories (`Painting & Decorating`, `Carpentry`, etc.) |
| "Flat-pack furniture assembly", "Plaster repair", "Garden clearance" | These micro slugs don't exist in our taxonomy. We'll seed rules for real micros only |
| `user_role` column on estimates | Not needed — derive from `user_roles` table at read time |
| `linked_to_job` estimate status | Keep as future; Phase 1 uses `draft`, `calculated`, `saved`, `archived` only |

## Seed Services (Real Taxonomy Matches)

These 6 micros exist and are active:

1. **Wall Painting** (`wall-painting`) — Painting & Decorating → Interior Painting
2. **Paint walls** (`paint-walls`) — Painting & Decorating → Interior
3. **Build shelving** (`build-shelving`) — Construction → Carpentry
4. **Shelving Units** (`shelving-units`) — Carpentry → Custom Furniture
5. **Install ceiling lights** (`install-ceiling-lights`) — Electrical → Lighting
6. **Tree pruning** (`tree-pruning`) — Gardening & Landscaping → Maintenance

We'll seed 5 rules (combining the two painting variants into one rule keyed on `wall-painting`).

## Implementation Steps

### Step 1: Database Migration

**Table: `pricing_rules`**
- `id`, `category`, `subcategory`, `micro_slug` (unique), `micro_name`
- `base_labour_unit` (hour/day/m2/item/project), `base_labour_min`, `base_labour_max`
- `base_material_min`, `base_material_max`
- `location_modifier` (default 1.0), `difficulty_modifier`, `urgency_modifier`
- `adjustment_factors` (jsonb — drives dynamic input form fields)
- `is_active`, `created_by`, `created_at`, `updated_at`
- RLS: public read for active rules, admin-only write (using `has_role` + `is_admin_email`)

**Table: `price_estimates`**
- `id`, `user_id` (not null, references auth), `category`, `subcategory`, `micro_slug`, `micro_name`
- `inputs` (jsonb), `materials_min/max`, `labour_min/max`, `additional_min/max`, `total_min/max`
- `currency` (default EUR), `confidence_level`, `pricing_source`, `disclaimer_version`
- `status` (draft/calculated/saved/archived), `linked_job_id` (nullable)
- `created_at`, `updated_at`
- RLS: users CRUD own, admins read all

**Seed**: 5 pricing rules with realistic Ibiza rates and `adjustment_factors.fields` jsonb defining the dynamic inputs for each service.

### Step 2: Frontend — Core Logic (3 files)

- `src/pages/prototype/lib/calculateEstimate.ts` — pure function: rule + inputs → min/max ranges
- `src/pages/prototype/hooks/usePricingRules.ts` — React Query hook to fetch active rules
- `src/pages/prototype/hooks/useEstimateHistory.ts` — CRUD hooks for saved estimates

### Step 3: Frontend — Components (4 files)

- `ServiceSelector.tsx` — category → subcategory → micro cascading selects, reusing `useServiceTaxonomy()` pattern, then loads pricing rule for selected micro
- `DynamicInputForm.tsx` — renders inputs from `adjustment_factors.fields` jsonb (number, select, boolean types)
- `EstimateCard.tsx` — materials/labour/additional/total ranges with confidence badge
- `DisclaimerBanner.tsx` — persistent "ballpark only" warning

### Step 4: Frontend — Pages (3 files)

- `PriceCalculatorPage.tsx` — main page: desktop left/right split, mobile stacked, sticky summary
- `EstimateHistoryPage.tsx` — list saved estimates with duplicate action
- `EstimateDetailPage.tsx` — full breakdown view

### Step 5: Admin Page (1 file)

- `AdminPricingRulesPage.tsx` — CRUD table for pricing rules, coverage gaps view, activate/deactivate toggle

### Step 6: Route Wiring

**Registry** — add `prototypeRoutes` array (no nav, no rollout gating):
```
/prototype/price-calculator        → public
/prototype/price-calculator/history → auth
/prototype/price-calculator/history/:id → auth
```

Add admin route under existing `adminRoutes`:
```
/dashboard/admin/pricing-rules → admin
```

**App.tsx** — 4 lazy imports + routes: 3 prototype routes (public + protected), 1 admin route nested under existing admin layout.

### Calculation Formula

```
multiplier = area_m2 || quantity || 1
modifiers  = product of select-field modifier values
coats      = inputs.coats || 1

labour     = rule.base_labour_[min|max] × multiplier × modifiers × coats × location_modifier
materials  = rule.base_material_[min|max] × multiplier × modifiers × coats × location_modifier
additional = 5–15% of labour (transport/access/waste)
total      = labour + materials + additional
confidence = "medium" if rule exists, "low" if no rule
```

### What's NOT included (Phase 1)

- No job-posting integration
- No historical quote comparison
- No notifications or i18n
- Not in main navigation
- No edge functions

### Files Summary

| Action | File |
|---|---|
| Create | `src/pages/prototype/PriceCalculatorPage.tsx` |
| Create | `src/pages/prototype/EstimateHistoryPage.tsx` |
| Create | `src/pages/prototype/EstimateDetailPage.tsx` |
| Create | `src/pages/prototype/components/ServiceSelector.tsx` |
| Create | `src/pages/prototype/components/DynamicInputForm.tsx` |
| Create | `src/pages/prototype/components/EstimateCard.tsx` |
| Create | `src/pages/prototype/components/DisclaimerBanner.tsx` |
| Create | `src/pages/prototype/hooks/usePricingRules.ts` |
| Create | `src/pages/prototype/hooks/useEstimateHistory.ts` |
| Create | `src/pages/prototype/lib/calculateEstimate.ts` |
| Create | `src/pages/admin/pricing/AdminPricingRulesPage.tsx` |
| Modify | `src/App.tsx` — add 4 lazy routes |
| Modify | `src/app/routes/registry.ts` — add prototype + admin route entries |
| Migration | Create `pricing_rules` + `price_estimates` tables, RLS, seed data |

