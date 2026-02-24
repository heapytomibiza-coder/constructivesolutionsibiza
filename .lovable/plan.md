

# Final i18n Leak Fixes — buildJobPack + Status Prettifiers + Alt Text

## Problem

After all the component-level i18n work, there are still English strings leaking through because **the data layer itself produces English display strings**. Three root causes:

### Root Cause 1: `buildJobPack.ts` produces hardcoded English

This file generates all `.display` strings consumed by JobDetailsModal, JobListingCard, etc. It contains:

- `BUDGET_DISPLAY` map: `"Under 500 €"`, `"Quote needed"`, `"To be discussed"` (line 92-99, 119)
- `formatTiming()`: `"ASAP"`, `"This week"`, `"This month"`, `"Flexible"`, `"Specific: ..."`, `"Start: ..."` (lines 125-135)
- `formatLocationDisplay()`: `"Custom location"`, fallback `"Ibiza"` (lines 140-167)

Since `buildJobPack` is a pure utility (no React hooks), it cannot call `useTranslation`. Two options:
1. **Pass a `t` function in** — cleanest, used elsewhere in the codebase
2. **Return enum keys instead of display strings, translate at render time** — more structural change

**Recommendation: Option 1** — pass `t` into `buildJobPack()` as a parameter. The callers (`JobDetailsModal`, `JobListingCard`, `JobsMarketplace`) already have `t` available. This is a minimal diff.

### Root Cause 2: `prettyStatus()` in JobDetailsModal + JobListingCard

Both files have a `prettyStatus()` function that converts `"in_progress"` → `"In Progress"` (English). These should use a status translation map instead.

**Fix**: Replace `prettyStatus(status)` with `t('status.${status}')` using a status key map. The `dashboard.json` already has `status.open`, `status.draft`, `status.in_progress`, `status.completed` keys — but those are in the `dashboard` namespace. We need equivalent keys in the `jobs` namespace (or share via a common approach). Simplest: add a `status` section to `jobs.json`.

### Root Cause 3: Minor hardcoded alt text and error fallbacks

- `alt={`Photo ${i + 1} of ${photos.length}`}` — two places in JobDetailsModal (lines 111, 342)
- `"Unknown error"` fallback — lines 181 (JobDetailsModal), 155 (JobsMarketplace), 40 (messageJob.action.ts)

## Changes Required

### 1. `src/pages/jobs/lib/buildJobPack.ts`

**Add `t` parameter to `buildJobPack()`**:
```text
export function buildJobPack(
  row: JobDetailsRow,
  packs: QuestionPack[],
  t?: (key: string, opts?: any) => string
): JobPack
```

Update `formatBudget()` to accept and use `t`:
- `'Under 500 €'` → `t?.('card.under500') ?? 'Under 500 €'`
- `'Quote needed'` → `t?.('card.quoteNeeded') ?? 'Quote needed'`
- `'To be discussed'` → `t?.('card.tbd') ?? 'TBD'`

Update `formatTiming()` to accept and use `t`:
- `"ASAP"` → `t?.('board.asap') ?? 'ASAP'`
- `"This week"` → `t?.('card.thisWeek') ?? 'This week'`
- `"This month"` → `t?.('card.thisMonth') ?? 'This month'`
- `"Flexible"` → `t?.('card.flexible') ?? 'Flexible'`
- `"Specific: ${date}"` / `"Start: ${date}"` → `t?.('card.start', { date }) ?? \`Start: ${date}\``

Update `formatLocationDisplay()`:
- `"Custom location"` → `t?.('detail.customLocation') ?? 'Custom location'`
- `"Ibiza"` fallback stays as-is (proper noun)

### 2. All callers of `buildJobPack()` — pass `t`

- `JobDetailsModal.tsx` line 160: `buildJobPack(row, packs ?? [], t)`
- `JobListingCard.tsx` (if it calls buildJobPack — check) or its parent
- `JobsMarketplace.tsx` / `JobBoardPage.tsx` (check if they call it)

### 3. `JobDetailsModal.tsx` — remaining fixes

- **Line 47-49**: Replace `prettyStatus()` with a translated status:
  ```text
  const STATUS_KEYS: Record<string, string> = {
    open: 'status.open', draft: 'status.draft',
    in_progress: 'status.inProgress', completed: 'status.completed',
    cancelled: 'status.cancelled', ready: 'status.ready',
  };
  ```
  Then: `t(STATUS_KEYS[status] ?? status)`

- **Line 111**: `alt={`Photo ${i + 1} of ${photos.length}`}` → `alt={t('detail.lightbox.photo', { current: i + 1, total: photos.length })}`

- **Line 181**: `"Unknown error"` → `t('detail.unknownError')`

- **Line 342**: `alt={`Job photo ${idx + 1}`}` → `alt={t('detail.lightbox.photo', { current: idx + 1, total: jobPack.photos.length })}`

### 4. `JobListingCard.tsx` — remaining fixes

- **Line 37-39**: Replace `prettyStatus()` with the same translated status map
- **Line 161**: `prettyStatus(job.status)` → translated version

### 5. `JobsMarketplace.tsx` — minor

- **Line 155**: `"Unknown error"` → `t('board.unknownError')` or reuse existing key

### 6. `messageJob.action.ts` — minor

- **Line 40**: `"Unknown error"` — this is internal error handling, not UI-facing. Low priority but can add `unknownError` key.

### 7. Locale file additions

**EN `jobs.json`** — add:
```json
{
  "status": {
    "open": "Open",
    "draft": "Draft",
    "ready": "Saved",
    "in_progress": "In Progress",
    "completed": "Completed",
    "cancelled": "Cancelled"
  },
  "detail": {
    "unknownError": "Unknown error",
    "customLocation": "Custom location",
    "lightbox": {
      "photo": "Photo {{current}} of {{total}}"
    }
  }
}
```

**ES `jobs.json`** — add:
```json
{
  "status": {
    "open": "Abierto",
    "draft": "Borrador",
    "ready": "Guardado",
    "in_progress": "En Progreso",
    "completed": "Completado",
    "cancelled": "Cancelado"
  },
  "detail": {
    "unknownError": "Error desconocido",
    "customLocation": "Ubicación personalizada",
    "lightbox": {
      "photo": "Foto {{current}} de {{total}}"
    }
  }
}
```

## Files Modified

| File | Change |
|------|--------|
| `src/pages/jobs/lib/buildJobPack.ts` | Add `t` parameter, translate budget/timing/location display strings |
| `src/pages/jobs/JobDetailsModal.tsx` | Pass `t` to buildJobPack, replace prettyStatus with translated map, fix alt text + unknownError |
| `src/pages/jobs/JobListingCard.tsx` | Replace prettyStatus with translated map |
| `src/pages/jobs/JobsMarketplace.tsx` | Fix "Unknown error" fallback |
| `public/locales/en/jobs.json` | Add `status.*`, `detail.unknownError`, `detail.customLocation`, `detail.lightbox.photo` |
| `public/locales/es/jobs.json` | Same keys in Spanish |
| `src/i18n/index.ts` | Bump cache version |

## Impact

This eliminates the **last category of English leaks**: data-layer display strings that flow through to every component that renders budget, timing, status, or location. After this, switching to Spanish will show fully translated content everywhere.

