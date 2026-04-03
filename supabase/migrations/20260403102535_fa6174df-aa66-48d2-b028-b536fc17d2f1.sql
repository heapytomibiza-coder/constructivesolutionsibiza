
CREATE OR REPLACE FUNCTION public.validate_service_listing_live()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tier text;
  v_listing_limit integer;
  v_live_count integer;
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

    -- Listing limit enforcement on transition to live
    -- (skip if already live — e.g. updating title on a live listing)
    IF OLD.status IS NULL OR OLD.status <> 'live' THEN
      -- Look up subscription tier
      SELECT s.tier INTO v_tier
      FROM subscriptions s
      WHERE s.user_id = NEW.provider_id
        AND s.status = 'active'
      LIMIT 1;

      -- Default to bronze if no active subscription
      IF v_tier IS NULL THEN
        v_tier := 'bronze';
      END IF;

      -- Map tier to listing limit (mirrors entitlements.ts listing_limit)
      v_listing_limit := CASE v_tier
        WHEN 'elite'  THEN 50
        WHEN 'gold'   THEN 25
        WHEN 'silver' THEN 10
        ELSE 3  -- bronze default
      END;

      -- Count current live listings (excluding this one in case of re-publish)
      SELECT count(*) INTO v_live_count
      FROM service_listings
      WHERE provider_id = NEW.provider_id
        AND status = 'live'
        AND id <> NEW.id;

      IF v_live_count >= v_listing_limit THEN
        RAISE EXCEPTION 'LISTING_LIMIT_REACHED: You have reached your live listing limit (% of % for % tier). Upgrade your plan to publish more.', v_live_count, v_listing_limit, v_tier;
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
