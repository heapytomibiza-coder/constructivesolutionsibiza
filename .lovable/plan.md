

# Upgrade Painting Pricing Rule — Ibiza-Adjusted Model

## What this does

Enriches the `wall-painting` pricing rule with a proper room-based input model inspired by MyJobQuote's field structure, but with Ibiza-adjusted rates and modifiers. Also updates the calculation engine to support room-dimension-based area computation.

## Current state

The existing rule has 4 fields: `area_m2` (manual entry), `coats`, `finish_level`, `surface_prep`. Base rates are €8–15/m² labour, €3–7/m² materials, with 1.15 location modifier.

This is functional but primitive. Users must calculate wall area themselves, and key cost drivers (ceiling, trim, furniture, wallpaper removal) are missing.

## What changes

### 1. Update `adjustment_factors` JSON for `wall-painting`

Replace the current 4-field schema with a richer 9-field schema:

**Number fields** (drive area calculation):
- `room_length` — Room length (m), min 1, max 20, default 4
- `room_width` — Room width (m), min 1, max 15, default 3
- `room_height` — Room height (m), min 2, max 5, default 2.5
- `coats` — Number of coats, min 1, max 4, default 2

**Select fields** (multiply modifiers):
- `paint_quality` — Standard (1.0) / Washable (1.15) / Premium (1.35)
- `wall_condition` — Good (1.0) / Minor repairs (1.15) / Major prep needed (1.4)
- `finish_level` — Standard (1.0) / Premium (1.25) / High-end (1.5)

**Boolean fields** (toggle modifiers):
- `include_ceiling` — Yes adds ~25% more area (modifier_true: 1.25, modifier_false: 1.0)
- `include_trim` — Skirting/trim adds ~15% (modifier_true: 1.15, modifier_false: 1.0)
- `furniture_moving` — Furniture in room adds time (modifier_true: 1.1, modifier_false: 1.0)
- `wallpaper_removal` — Significant prep uplift (modifier_true: 1.35, modifier_false: 1.0)

### 2. Update calculation engine

Add room-dimension area auto-calculation to `calculateEstimate.ts`:

```
if room_length && room_width && room_height exist in inputs:
  wall_area = 2 * (length + width) * height
  use wall_area as multiplier instead of area_m2
else:
  fall back to area_m2 or quantity as before
```

This means users enter room dimensions and the engine calculates paintable wall area automatically — much better UX than asking "how many m²?"

### 3. Adjust base rates for Ibiza

Current: €8–15/m² labour, €3–7/m² materials.

MyJobQuote UK data suggests ~£10–16/m² labour for decorators. Ibiza professional rates are typically 20–40% higher than UK mainland due to island logistics, smaller labour pool, and import costs.

Proposed Ibiza-adjusted rates:
- **Labour**: €12–22/m² (up from €8–15)
- **Materials**: €4–8/m² (modest increase for import costs)

These are still ballpark — the confidence stays `low`.

### 4. No code structure changes

The existing `DynamicInputForm` already handles number, select, and boolean field types. The `calculateEstimate` engine already processes select modifiers and boolean modifiers. The only code change is adding the room-dimension area calculation fallback.

## Files changed

| File | Change |
|---|---|
| `src/pages/prototype/lib/calculateEstimate.ts` | Add room-dimension area calculation (6 lines) |
| Database (UPDATE via insert tool) | Update `adjustment_factors` JSON and base rates for `wall-painting` rule |

## What this does NOT do

- Does not add new pricing rules or micro services
- Does not change the UI components (DynamicInputForm already renders all field types)
- Does not change RLS or table schema
- Does not copy UK prices — uses Ibiza-adjusted assumptions

