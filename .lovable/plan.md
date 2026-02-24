

# Cleanup: Remove `as any` casts + Harden Zod schemas + Safer emoji regex

## Problem

Three minor but real issues remain after the i18n implementation:

### 1. Dead `as any` casts in `buildJobPack.ts`
Lines 364-367 use `(row as any).source_lang`, `(row as any).title_i18n`, etc. — but `JobDetailsRow` (from `types.ts`) already defines these fields. The casts are unnecessary and hide potential type errors.

### 2. Zod schemas missing i18n fields
`JobsBoardRowSchema` and `JobDetailsRowSchema` in `validators.ts` don't define `source_lang`, `title_i18n`, `teaser_i18n`, `description_i18n`, or `translation_status`. They rely on `.passthrough()` to not reject the fields at runtime, but the inferred DTO types (`JobsBoardRowDTO`, `JobDetailsRowDTO`) won't include them. If any code path uses DTO types instead of the manual types, those fields would be invisible to TypeScript.

### 3. Emoji regex fragility
`JobListingCard.tsx` line 89 uses `\p{Emoji_Presentation}\p{Emoji}` Unicode property escapes. While modern runtimes support this, it can fail silently in some build targets. A safer pattern `[^\p{L}\p{N}]+` (strip leading non-letter/non-number characters) achieves the same result more reliably.

## Changes

### File 1: `src/pages/jobs/lib/buildJobPack.ts`
Remove the `as any` casts on lines 364-367. Access the fields directly since `JobDetailsRow` already defines them:
```
sourceLang: row.source_lang ?? null,
titleI18n: row.title_i18n ?? null,
teaserI18n: row.teaser_i18n ?? null,
descriptionI18n: row.description_i18n ?? null,
```

### File 2: `src/pages/jobs/validators.ts`
Add a reusable i18n map schema and include the new fields in both Zod schemas:

In `JobsBoardRowSchema`, add after `is_publicly_listed`:
```
source_lang: z.string().nullable().optional(),
translation_status: z.string().nullable().optional(),
title_i18n: z.record(z.string()).nullable().optional(),
teaser_i18n: z.record(z.string()).nullable().optional(),
```

In `JobDetailsRowSchema`, add:
```
description_i18n: z.record(z.string()).nullable().optional(),
```

This ensures DTO types derived from Zod are consistent with the manual `types.ts` definitions.

### File 3: `src/pages/jobs/JobListingCard.tsx`
Replace the emoji-stripping regex on line 89:
```
// Before (fragile):
const stripped = highlight.replace(/^[\p{Emoji_Presentation}\p{Emoji}\uFE0F]+\s*/u, '').trim();

// After (safer — strips leading non-letter/non-number chars):
const stripped = highlight.replace(/^[^\p{L}\p{N}]+/u, '').trim();
```

## Files Modified

| File | Change |
|------|--------|
| `src/pages/jobs/lib/buildJobPack.ts` | Remove 4 unnecessary `as any` casts |
| `src/pages/jobs/validators.ts` | Add i18n fields to Zod schemas |
| `src/pages/jobs/JobListingCard.tsx` | Use safer emoji-stripping regex |

## Impact
Type safety improvements and build resilience. No behavioral changes — all three fixes are correctness/hardening only.

