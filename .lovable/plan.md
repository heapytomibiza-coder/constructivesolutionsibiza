

# Fix Publish Flow — 3 Patches

## What We're Fixing

1. **BLOCKER**: `published_at` never set on publish → listings invisible in marketplace
2. **ISSUE**: Live listings can have required fields blanked via save
3. **FRAGILITY**: Publish is two sequential writes (save then status update) → race condition risk

## Implementation

### Patch 1 — DB Trigger (Migration)

Extend `validate_service_listing_live` to:
- **Set `published_at := now()`** on transition to `live` (when `OLD.status IS NULL OR OLD.status <> 'live'`)
- **Validate required fields on ALL updates where `status = 'live'`** — not just transitions. This prevents blanking title/description on a live listing via save.
- Keep the grandfather clause for pre-March-19 listings on the transition check, but enforce field integrity on all live updates regardless.

```sql
CREATE OR REPLACE FUNCTION public.validate_service_listing_live()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Validate required fields whenever status IS live (not just transition)
  IF NEW.status = 'live' THEN
    -- Grandfather clause only for initial publish of old listings
    IF NEW.created_at < '2026-03-19T12:00:00Z'
       AND (OLD.status IS NULL OR OLD.status <> 'live') THEN
      -- Allow grandfathered listings to go live without checks
      NULL;
    ELSE
      IF NEW.display_title IS NULL OR trim(NEW.display_title) = '' THEN
        RAISE EXCEPTION 'A display title is required for live listings';
      END IF;
      IF NEW.short_description IS NULL OR trim(NEW.short_description) = '' THEN
        RAISE EXCEPTION 'A short description is required for live listings';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM service_pricing_items
        WHERE service_listing_id = NEW.id
          AND is_enabled = true
          AND price_amount IS NOT NULL
          AND price_amount > 0
      ) THEN
        RAISE EXCEPTION 'At least one enabled pricing item is required for live listings';
      END IF;
    END IF;
  END IF;

  -- Set published_at on transition to live
  IF NEW.status = 'live' AND (OLD.status IS NULL OR OLD.status <> 'live') THEN
    NEW.published_at := now();
  END IF;

  RETURN NEW;
END;
$$;
```

### Patch 2 — Frontend Live-Save Guard

In `ServiceListingEditor.tsx`, add validation at the top of `handleSave`:

```typescript
// Before saving, if listing is live, ensure required fields remain valid
if (listing?.status === 'live') {
  const hasPricing = pricingItems.some(p => p.is_enabled && p.price_amount && p.price_amount > 0);
  const { canPublish } = evaluateListingReadiness({
    display_title: title,
    short_description: description,
    hero_image_url: heroUrl,
    hasPricing,
  });
  if (!canPublish) {
    toast.error('Live listings must keep title, description, and pricing complete');
    return;
  }
}
```

### Patch 3 — Atomic Publish (Single Write)

Replace the two-step `handlePublish` (save → publish) with a single atomic update:

```typescript
const handlePublish = async () => {
  if (!listingId || !listing) return;
  const hasPricing = pricingItems.some(p => p.is_enabled && p.price_amount && p.price_amount > 0);
  const { canPublish, issues } = evaluateListingReadiness({ ... });
  if (!canPublish) { toast.error(...); return; }

  try {
    const { error } = await supabase
      .from('service_listings')
      .update({
        display_title: title,
        short_description: description,
        hero_image_url: heroUrl,
        gallery,
        location_base: locationBase || null,
        pricing_summary: computedPricingSummary,
        status: 'live',
      })
      .eq('id', listingId);
    if (error) throw error;

    // fire-and-forget translation
    toast.success('Listing published');
    queryClient.invalidateQueries({ queryKey: ['listing-detail', listingId] });
    queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    navigate('/professional/listings');
  } catch (err) {
    toast.error('Failed to publish listing');
  }
};
```

This eliminates the race condition and reduces DB writes from 2 to 1. The trigger handles `published_at` automatically.

### Files Changed

| File | Change |
|------|--------|
| New migration SQL | Upgraded `validate_service_listing_live` trigger |
| `src/pages/professional/ServiceListingEditor.tsx` | Live-save guard + atomic publish |

### What We're NOT Changing
- `usePublishListing` / `useUnpauseListing` hooks — publish now handled inline; unpause already works via the dashboard and the trigger will set `published_at` for it automatically
- `listingPublishRules.ts` — no changes needed, contract is correct
- No new tables or RPCs

