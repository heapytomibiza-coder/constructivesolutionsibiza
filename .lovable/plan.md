

## Translation-Status Guard

### Root Cause
The migration (`20260224124257`) sets `translation_status text DEFAULT 'pending'` on both `jobs` and `service_listings`. Every new row starts as `'pending'` whether or not the edge function is ever invoked. If invocation fails or is skipped, the row stays `'pending'` forever.

Additionally, the edge function's `catch` block returns a 500 but never writes `translation_status = 'failed'` to the database, so even invoked-but-crashed translations stay `'pending'`.

### Fix (3 changes)

**1. Database migration — change default from `'pending'` to `NULL`**

```sql
ALTER TABLE public.jobs
  ALTER COLUMN translation_status SET DEFAULT NULL;

ALTER TABLE public.service_listings
  ALTER COLUMN translation_status SET DEFAULT NULL;

-- Clean up existing stuck rows
UPDATE public.jobs
SET translation_status = NULL
WHERE translation_status = 'pending'
  AND (source_lang IS NULL OR title_i18n = '{}'::jsonb);

UPDATE public.service_listings
SET translation_status = NULL
WHERE translation_status = 'pending'
  AND source_lang IS NULL;
```

New rows will have `translation_status = NULL` (meaning "not yet attempted"). The edge function writes `'complete'` on success.

**2. Edge function — write `'failed'` on error**

In `supabase/functions/translate-content/index.ts`, inside the `catch` block (before returning the 500 response), add a best-effort DB update:

```ts
// Best-effort: mark translation as failed so it doesn't stay pending
try {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, supabaseKey);
  await sb.from(body.entity).update({ translation_status: "failed" }).eq("id", body.id);
} catch (_) { /* ignore */ }
```

Also add `translation_status: 'pending'` to the update payload at the **start** of the function (before calling the AI gateway), so "pending" only exists while translation is actively in progress.

**3. No client-side changes needed**

Both `CanonicalJobWizard.tsx` and `ServiceListingEditor.tsx` already use fire-and-forget invocation without setting `translation_status`. This is correct — the edge function owns the status lifecycle entirely.

### Status lifecycle after fix

```text
NULL  →  (edge function invoked)  →  'pending'  →  'complete'
                                                 →  'failed'
NULL  →  (never invoked / no text)  →  stays NULL
```

No row can ever be stuck in `'pending'` because:
- Default is `NULL`, not `'pending'`
- Only the edge function sets `'pending'` (at start of processing)
- Edge function always exits with `'complete'` or `'failed'`

