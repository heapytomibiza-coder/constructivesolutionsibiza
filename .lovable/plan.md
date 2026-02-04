

# Complete Question Pack Coverage to 100%

## Current State Summary

Based on the database audit, here are the missing packs for each category:

| Category | Total Micros | Has Pack | Missing | Status |
|----------|-------------|----------|---------|--------|
| **Cleaning** | 12 | 11 | 1 | 92% ✅ |
| **Commercial & Industrial** | 12 | 11 | 1 | 92% ✅ |
| **Pool & Spa** | 12 | 10 | 2 | 83% 🔶 |
| **Gardening & Landscaping** | 14 | 11 | 3* | 78% 🔶 |
| **Floors, Doors & Windows** | 13 | 9 | 4 | 69% 🔶 |
| **Architects & Design** | 12 | 7 | 5 | 58% 🔶 |
| **Painting & Decorating** | 20 | 10 | 10* | 50% 🔶 |
| **Carpentry** | 23 | 11 | 12 | 48% 🔶 |
| **Legal & Regulatory** | 12 | 0 | 12 | 0% ⚠️ |

*Some have V2 packs written but with slug mismatches

---

## Missing Packs Detail

### Cleaning (1 missing)
- `move-in-out-cleaning` — Move In/Out Cleaning

### Commercial & Industrial (1 missing)  
- `shop-front` — Shop Front

### Pool & Spa (2 missing)
- `spa-maintenance` — Spa Maintenance
- `tile-replacement` — Tile Replacement

### Gardening & Landscaping (2 missing)
- `tree-removal` — Tree Removal
- `turf-installation` — Turf Installation

### Floors, Doors & Windows (4 missing)
- `double-glazing` — Double Glazing
- `mirror-installation` — Mirror Installation
- `window-fitting` — Window Fitting
- `window-replacement` — Window Replacement

### Architects & Design (5 missing)
- `3d-rendering` — 3D Rendering
- `budget-management` — Budget Management
- `contractor-coordination` — Contractor Coordination
- `floor-plans` — Floor Plans
- `virtual-walkthrough` — Virtual Walkthrough

### Painting & Decorating (7 missing - some written but slug mismatch)
- `cabinet-painting` — Cabinet Painting
- `feature-walls` — Feature Walls
- `fence-painting` — Fence Painting
- `pressure-washing` — Pressure Washing
- `trim-woodwork` — Trim & Woodwork
- `wall-painting` — Wall Painting
- `wallpaper-installation` — Wallpaper Installation

### Carpentry (12 missing)
- `antique-restoration` — Antique Restoration
- `beam-installation` — Beam Installation
- `composite-decking` — Composite Decking
- `exterior-doors` — Exterior Doors
- `floor-joists` — Floor Joists
- `interior-doors` — Interior Doors
- `pergola-construction` — Pergola Construction
- `refinishing` — Refinishing
- `roof-framing` — Roof Framing
- `shutters` — Shutters
- `wall-framing` — Wall Framing
- `wood-repair` — Wood Repair

### Legal & Regulatory (12 missing - not written)
- `appeal-support` — Appeal Support
- `building-inspection` — Building Inspection
- `building-regulations` — Building Regulations
- `council-liaison` — Council Liaison
- `document-preparation` — Document Preparation
- `environmental-compliance` — Environmental Compliance
- `health-safety` — Health & Safety
- `permit-application` — Permit Application
- `planning-submission` — Planning Submission
- `pre-application-advice` — Pre-Application Advice
- `pre-purchase-survey` — Pre-Purchase Survey
- `safety-inspection` — Safety Inspection

---

## Implementation Plan

### Step 1: Write Missing Packs for Categories Near Completion
Create question packs for the remaining services to achieve 100% in "near complete" categories:

**Cleaning** (1 pack)
- `move-in-out-cleaning`

**Commercial & Industrial** (1 pack)
- `shop-front`

**Pool & Spa** (2 packs)
- `spa-maintenance`
- `tile-replacement`

### Step 2: Complete Moderate Coverage Categories
Write packs for categories in the 50–80% range:

**Gardening & Landscaping** (2 packs)
- `tree-removal`
- `turf-installation`

**Floors, Doors & Windows** (4 packs)
- `double-glazing`, `mirror-installation`, `window-fitting`, `window-replacement`

**Architects & Design** (5 packs)
- `3d-rendering`, `budget-management`, `contractor-coordination`, `floor-plans`, `virtual-walkthrough`

**Painting & Decorating** (7 packs)
- `cabinet-painting`, `feature-walls`, `fence-painting`, `pressure-washing`, `trim-woodwork`, `wall-painting`, `wallpaper-installation`

**Carpentry** (12 packs)
- `antique-restoration`, `beam-installation`, `composite-decking`, `exterior-doors`, `floor-joists`, `interior-doors`, `pergola-construction`, `refinishing`, `roof-framing`, `shutters`, `wall-framing`, `wood-repair`

### Step 3: Write Legal & Regulatory (12 packs)
Create the entire Legal & Regulatory category from scratch with focus on Ibiza/Spain regulatory context.

### Step 4: Deploy and Seed
1. Add new packs to existing V2 files
2. Deploy `seedpacks` edge function (already done)
3. Seed all packs to database
4. Verify 100% coverage

---

## Technical Details

Each new pack follows the canonical formula:
- **5–8 questions** per pack
- **70%+ selection-based** (radio, checkbox)
- **ID convention**: `{micro_slug}_{NN}_{shortname}`
- **Required metadata**: `category_contract` and `inspection_bias`
- **Standard spine**: Location → Scope → Size → Materials/Finish → Access → Timeline → Budget (optional) → Photos (optional)

---

## Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| Total Packs | 245 | 295 |
| Coverage | 83% | **100%** |
| Categories at 100% | 5 | **16** |

All 295 active micro-services will have professional question packs, completing the wizard's data foundation.

