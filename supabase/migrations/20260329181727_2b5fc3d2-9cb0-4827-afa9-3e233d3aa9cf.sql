
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
