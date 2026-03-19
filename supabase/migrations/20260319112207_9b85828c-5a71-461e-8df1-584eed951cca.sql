
-- Fix search_path on validation function to resolve linter warning
CREATE OR REPLACE FUNCTION public.validate_service_listing_live()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'live' AND (OLD.status IS NULL OR OLD.status <> 'live') THEN
    IF NEW.created_at < '2026-03-19T12:00:00Z' THEN
      RETURN NEW;
    END IF;

    IF NEW.display_title IS NULL OR trim(NEW.display_title) = '' THEN
      RAISE EXCEPTION 'A display title is required to publish a service listing';
    END IF;

    IF NEW.short_description IS NULL OR trim(NEW.short_description) = '' THEN
      RAISE EXCEPTION 'A short description is required to publish a service listing';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM service_pricing_items
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
