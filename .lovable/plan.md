

# Auto-Translation for User-Generated Content + buildJobPayload Highlights Fix

## Problem

Two distinct issues remain:

### Issue 1: `buildJobPayload.ts` stores hardcoded English in the database

The `buildHighlights()` function writes English strings directly into the `highlights` column:
- `"⚡ ASAP"`, `"📅 This week"`, `"📅 This month"`
- `"Under 500 €"`, `"Quote needed"`, etc.
- `"🏠 Site visit needed"`, `"📹 Video call available"`
- `"🅿️ Parking available"`, `"🪜 Stairs only"`, `"🔑 Key pickup required"`
- `"📋 Permits may be needed"`
- `"📸 2 photos"`

These are **stored in the DB** and displayed on cards. Since `buildHighlights` runs server-side at insert time (no React context), it cannot use `useTranslation`. The `JobListingCard` already has `formatHighlight()` that translates budget ranges, but the other highlight types (timing, access, permits, photos) still leak English.

**Fix**: Store only data keys in highlights (e.g. `"timing:asap"`, `"access:parking"`, `"permits:concern"`), then translate at render time in `formatHighlight()`. This is a breaking change for existing stored highlights though.

**Pragmatic alternative**: Keep storing emoji+English as-is (they're machine-readable enough), but expand `formatHighlight()` in `JobListingCard.tsx` to recognize and translate ALL highlight patterns, not just budgets.

### Issue 2: User-generated text (title, teaser, description, notes) is single-language

When someone writes a job in Spanish, English-speaking viewers see Spanish text and vice versa. This requires:
1. Schema changes: add `title_i18n`, `teaser_i18n`, `description_i18n` (JSONB) columns + `source_lang` column
2. A translation edge function that auto-detects language and translates
3. UI helper to pick the right language version at render time

## Implementation Plan

### Phase A: Fix highlight rendering (no schema change needed)

Expand `formatHighlight()` in `JobListingCard.tsx` to translate all known highlight patterns:

```text
// Timing highlights
"⚡ ASAP" → t('board.asap')
"📅 This week" → t('card.thisWeek')
"📅 This month" → t('card.thisMonth')
"📅 ${date}" → t('card.start', { date })

// Access highlights  
"🏠 Site visit needed" → t('card.siteVisitNeeded')
"📹 Video call available" → t('card.videoCallAvailable')
"🅿️ Parking available" → t('card.parkingAvailable')
"🪜 Stairs only" → t('card.stairsOnly')
"🛗 Elevator access" → t('card.elevatorAccess')
"🚪 Gated property" → t('card.gatedProperty')
"🔑 Key pickup required" → t('card.keyPickupRequired')

// Other
"📋 Permits may be needed" → t('card.permitsMayBeNeeded')
"📸 X photo(s)" → t('card.photosCount', { count: X })
"📏 Qty: X" → t('card.quantity', { count: X })
"📐 Xm²" → keep as-is (measurement)
```

Add these ~15 new keys to `en/jobs.json` and `es/jobs.json`.

### Phase B: Auto-translation schema (migration)

Add columns to `jobs` table:

```sql
ALTER TABLE public.jobs
  ADD COLUMN source_lang text,
  ADD COLUMN title_i18n jsonb DEFAULT '{}',
  ADD COLUMN teaser_i18n jsonb DEFAULT '{}',
  ADD COLUMN description_i18n jsonb DEFAULT '{}',
  ADD COLUMN translation_status text DEFAULT 'pending';
```

Add same to `service_listings`:

```sql
ALTER TABLE public.service_listings
  ADD COLUMN source_lang text,
  ADD COLUMN display_title_i18n jsonb DEFAULT '{}',
  ADD COLUMN short_description_i18n jsonb DEFAULT '{}',
  ADD COLUMN translation_status text DEFAULT 'pending';
```

Update the `job_details` and `jobs_board` views to include the new columns.

### Phase C: Translation edge function

Create `supabase/functions/translate-content/index.ts`:

- Accepts `{ entity: "jobs"|"service_listings", id: string, fields: Record<string, string> }`
- Uses Lovable AI (Gemini Flash) to detect language and translate
- Updates the `*_i18n` JSONB columns and sets `source_lang` + `translation_status = 'complete'`
- Idempotent: skips if content hasn't changed (compare against stored original)

### Phase D: Trigger translation on create/update

In `CanonicalJobWizard.tsx`, after successful insert/update, call:
```typescript
supabase.functions.invoke('translate-content', {
  body: { entity: 'jobs', id: jobId, fields: { title, teaser, description } }
});
```

Fire-and-forget (don't block the user). Translation status starts as `pending`, becomes `complete` when the edge function finishes.

Same pattern in `ServiceListingEditor.tsx` after save.

### Phase E: UI rendering helper

Create `src/lib/i18nContent.ts`:

```typescript
export function getI18nField(
  original: string | null | undefined,
  i18nMap: Record<string, string> | null | undefined,
  lang: "en" | "es"
): string {
  if (i18nMap && typeof i18nMap === "object" && i18nMap[lang]) return i18nMap[lang];
  return original ?? "";
}
```

Update `JobDetailsModal`, `JobListingCard`, `ServiceListingCard` to use this helper for title/teaser/description, falling back to original when translation isn't ready.

### Phase F: Messages (separate pattern)

Messages should NOT be auto-translated. Instead:
- Add a "Translate" button per message bubble
- On click, call the translate edge function for that single message
- Cache translation in a `message_translations` table or in message metadata JSONB

This is lower priority and can be done later.

## File Changes Summary

| Phase | Files | Type |
|-------|-------|------|
| A | `JobListingCard.tsx`, `en/jobs.json`, `es/jobs.json` | Code + locale |
| B | SQL migration (2 ALTER TABLEs + view updates) | Schema |
| C | `supabase/functions/translate-content/index.ts` | New edge function |
| D | `CanonicalJobWizard.tsx`, `ServiceListingEditor.tsx` | Code |
| E | `src/lib/i18nContent.ts` (new), `JobDetailsModal.tsx`, `JobListingCard.tsx`, `ServiceListingCard.tsx` | Code |
| F | Future phase | — |

## Recommended Order

Start with **Phase A** (highlight translations) since it's pure frontend, no migration needed, and fixes visible English leaks immediately.

Then **Phases B+C+D+E** together as the auto-translation feature — this is a proper feature that needs schema + edge function + UI all working together.

Phase F (messages) can wait.

