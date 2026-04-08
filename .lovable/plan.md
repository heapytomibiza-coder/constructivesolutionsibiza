

# Fail-Safe Job Wizard: Architecture Hardening Plan

## Current State

The wizard already has a solid 7-step structure (Category → Subcategory → Micro → Questions → Logistics → Extras → Review), draft persistence (dual-storage), deep-link hydration, custom request escape hatch, and a `general-project` fallback question pack with 4 questions.

**Gaps identified:**
- No timeout handling on any DB fetch (categories, subcategories, micros, question packs)
- SubcategorySelector and MicroStep show empty states ("No services available") with no escape
- CategorySelector shows error state with retry but no fallback content
- QuestionsStep loading state has no timeout — infinite spinner possible
- No auto-skip logic when steps return empty data
- No "safe mode" / minimal backup for DB-down scenarios
- No error/timeout tracking for wizard step failures

---

## Architecture: 3-Tier Resilience Per Step

```text
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   PLAN A    │────▶│   PLAN B     │────▶│   PLAN C     │
│  DB Query   │ 5s  │  Cached /    │     │  Universal   │
│  (live)     │ out │  Retry once  │fail │  Fallback    │
└─────────────┘     └──────────────┘     └──────────────┘
```

Each DB-powered selector gets a `useResilientQuery` wrapper that enforces:
- 5-second timeout (AbortController)
- 1 retry on failure
- Fallback trigger after retry exhaustion

---

## Step-by-Step Hardening

### Step 1 — Category (required)
- **Plan A**: DB query (existing)
- **Plan B**: Retry once (existing via React Query `retry: 3` — reduce to `retry: 1` + 5s timeout)
- **Plan C**: Hardcoded category list (16 known categories from taxonomy) rendered as static tiles
- **Escape**: Custom Request CTA already exists — always visible

### Step 2 — Subcategory (required, but auto-skippable)
- **Plan A**: DB query (existing)
- **Plan B**: Retry once + 5s timeout
- **Plan C**: If empty/failed after timeout → auto-skip to Micro step with subcategory marked as "General"
- **Escape**: Custom Request CTA already exists

### Step 3 — Micro (required, but has escape)
- **Plan A**: DB query (existing)
- **Plan B**: Retry once + 5s timeout
- **Plan C**: If empty/failed → show "Describe your project" free-text input (uses custom request path internally)
- **Escape**: Custom Request CTA already exists — promote it to primary CTA when micro list is empty

### Step 4 — Questions (optional, already skippable)
- **Plan A**: DB question packs (existing)
- **Plan B**: `general-project` fallback pack (existing — 4 questions)
- **Plan C**: Auto-skip with "All set!" state (existing behavior)
- **Add**: 5-second timeout on pack fetch; if exceeded, trigger Plan C
- **Add**: Track `question_pack_timeout` event

### Step 5 — Logistics (required)
- Pure frontend — no DB dependency. Already fail-safe.
- No changes needed.

### Step 6 — Extras (optional)
- Pure frontend — no DB dependency. Already fail-safe.
- No changes needed.

### Step 7 — Review (required)
- Pure frontend render of collected state. Already fail-safe.
- No changes needed.

---

## New Shared Hook: `useResilientQuery`

A thin wrapper around React Query that adds:
- `AbortController` with configurable timeout (default 5s)
- `onTimeout` callback for fallback triggering
- Reduced retry count (1 instead of 3)
- Auto-tracking of timeout/failure events via `trackEvent`

Used by: CategorySelector, SubcategorySelector, MicroStep, QuestionsStep

---

## Hardcoded Category Fallback

Create `src/features/wizard/canonical/lib/fallbackCategories.ts` containing the 16 known category names and IDs (sourced from current DB). This is the Plan C for Step 1 — only rendered when DB is unreachable.

---

## Auto-Skip Logic

Add to `CanonicalJobWizard.tsx`:
- When SubcategorySelector reports empty results after timeout → auto-advance to Micro
- When MicroStep reports empty results after timeout → switch to custom mode and advance to Logistics
- When QuestionsStep times out → auto-advance to Logistics

Each auto-skip shows a toast: "Let's keep things simple — we'll fill in details later"

---

## UX Guarantees

1. **No blank screens**: Every loading state has a max 5s visible duration before fallback renders
2. **No infinite spinners**: Timeout forces resolution to fallback or skip
3. **Always show progress**: Progress bar already renders before content — no change needed
4. **Always a way forward**: Custom Request CTA on steps 1-3; steps 4-6 are optional/pure-frontend; step 7 always has submit
5. **Fallback messaging**: Friendly copy like "Let's keep this simple" when degrading

---

## Error Tracking

Add `trackEvent` calls for:
- `wizard_step_timeout` — step name, timeout duration
- `wizard_step_fallback` — step name, fallback tier (B or C)
- `wizard_step_empty` — step name (no results from DB)
- `wizard_auto_skip` — step name, reason

These feed into the existing `daily_platform_metrics` pipeline.

---

## Auto-Save (Already Implemented)

- Draft saves to both `sessionStorage` and `localStorage` every 600ms (existing)
- Resume flow with draft modal (existing)
- Auth redirect preserves draft (existing)
- No changes needed

---

## Files to Create/Edit

| File | Action |
|---|---|
| `src/features/wizard/canonical/hooks/useResilientQuery.ts` | **Create** — timeout + fallback wrapper |
| `src/features/wizard/canonical/lib/fallbackCategories.ts` | **Create** — hardcoded Plan C data |
| `src/features/wizard/db-powered/CategorySelector.tsx` | **Edit** — use resilient query, add Plan C |
| `src/features/wizard/db-powered/SubcategorySelector.tsx` | **Edit** — add timeout, auto-skip on empty |
| `src/features/wizard/db-powered/MicroStep.tsx` | **Edit** — add timeout, promote custom CTA on empty |
| `src/features/wizard/canonical/steps/QuestionsStep.tsx` | **Edit** — add 5s timeout on pack fetch |
| `src/features/wizard/canonical/CanonicalJobWizard.tsx` | **Edit** — add auto-skip handlers, fallback toasts |

No database changes required. No edge function changes.

