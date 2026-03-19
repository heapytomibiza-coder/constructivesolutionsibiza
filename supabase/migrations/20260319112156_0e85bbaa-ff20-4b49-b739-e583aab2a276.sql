
-- 1. Fix public visibility: disable security_invoker so anonymous users can see all live listings
--    The view only exposes safe public fields (display name, avatar, service info).
ALTER VIEW public.service_listings_browse SET (security_invoker = false);

-- 2. Add validation trigger: new listings (created after today) must have required fields to go live.
--    Existing listings are grandfathered in.
CREATE OR REPLACE FUNCTION public.validate_service_listing_live()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only validate when setting status to 'live'
  IF NEW.status = 'live' AND (OLD.status IS NULL OR OLD.status <> 'live') THEN
    -- Grandfather existing listings created before this migration
    IF NEW.created_at < '2026-03-19T12:00:00Z' THEN
      RETURN NEW;
    END IF;

    -- Require display_title
    IF NEW.display_title IS NULL OR trim(NEW.display_title) = '' THEN
      RAISE EXCEPTION 'A display title is required to publish a service listing';
    END IF;

    -- Require short_description
    IF NEW.short_description IS NULL OR trim(NEW.short_description) = '' THEN
      RAISE EXCEPTION 'A short description is required to publish a service listing';
    END IF;

    -- Require at least one pricing item (checked via subquery)
    IF NOT EXISTS (
      SELECT 1 FROM public.service_pricing_items
      WHERE service_listing_id = NEW.id
        AND is_enabled = true
        AND price_amount IS NOT NULL
        AND price_amount > 0
    ) THEN
      RAISE EXCEPTION 'At least one enabled pricing item is required to publish a service listing';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_validate_service_listing_live ON public.service_listings;
CREATE TRIGGER trg_validate_service_listing_live
  BEFORE INSERT OR UPDATE ON public.service_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_service_listing_live();
