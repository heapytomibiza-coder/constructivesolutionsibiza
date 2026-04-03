
-- Shared tier-limit resolution function
-- Single source of truth for subscription tier → numeric limit mapping
-- Must stay in sync with src/domain/entitlements.ts FEATURE_MAP
CREATE OR REPLACE FUNCTION public.get_tier_limit(
  _user_id UUID,
  _feature TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
BEGIN
  SELECT s.tier INTO v_tier
  FROM public.subscriptions s
  WHERE s.user_id = _user_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_tier IS NULL THEN
    v_tier := 'bronze';
  END IF;

  RETURN CASE _feature
    WHEN 'listing_limit' THEN
      CASE v_tier
        WHEN 'elite'  THEN 50
        WHEN 'gold'   THEN 25
        WHEN 'silver' THEN 10
        ELSE 3
      END
    WHEN 'portfolio_limit' THEN
      CASE v_tier
        WHEN 'elite'  THEN 100
        WHEN 'gold'   THEN 50
        WHEN 'silver' THEN 15
        ELSE 5
      END
    WHEN 'quote_daily_limit' THEN
      CASE v_tier
        WHEN 'elite'  THEN 50
        WHEN 'gold'   THEN 30
        WHEN 'silver' THEN 15
        ELSE 5
      END
    ELSE 0
  END;
END;
$$;

-- Refactor listing trigger to use shared function
CREATE OR REPLACE FUNCTION public.validate_service_listing_live()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_listing_limit integer;
  v_live_count integer;
BEGIN
  IF NEW.status = 'live' THEN
    -- Grandfather clause for old listings
    IF NEW.created_at < '2026-03-19T12:00:00Z'
       AND (OLD.status IS NULL OR OLD.status <> 'live') THEN
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

    -- Listing limit on transition to live only
    IF OLD.status IS NULL OR OLD.status <> 'live' THEN
      v_listing_limit := public.get_tier_limit(NEW.provider_id, 'listing_limit');

      SELECT count(*) INTO v_live_count
      FROM service_listings
      WHERE provider_id = NEW.provider_id
        AND status = 'live'
        AND id <> NEW.id;

      IF v_live_count >= v_listing_limit THEN
        RAISE EXCEPTION 'LISTING_LIMIT_REACHED: You have reached your live listing limit (% of % for your tier). Upgrade your plan to publish more.', v_live_count, v_listing_limit;
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

-- Refactor portfolio trigger to use shared function
CREATE OR REPLACE FUNCTION public.validate_portfolio_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  v_limit := public.get_tier_limit(NEW.user_id, 'portfolio_limit');

  SELECT COUNT(*) INTO v_current_count
  FROM public.portfolio_projects
  WHERE user_id = NEW.user_id
    AND is_published = true;

  IF v_current_count >= v_limit THEN
    RAISE EXCEPTION 'PORTFOLIO_LIMIT_REACHED: You have reached your portfolio limit of % projects for your tier.', v_limit;
  END IF;

  RETURN NEW;
END;
$$;
