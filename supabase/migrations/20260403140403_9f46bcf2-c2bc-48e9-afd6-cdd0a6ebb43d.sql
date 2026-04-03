
-- Portfolio limit enforcement trigger
-- Same pattern as validate_service_listing_live for listing_limit
-- Checks subscription tier on INSERT and enforces portfolio_limit per tier
-- Defaults to bronze (5) when no active subscription exists

CREATE OR REPLACE FUNCTION public.validate_portfolio_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get the professional's current subscription tier
  SELECT s.tier INTO v_tier
  FROM public.subscriptions s
  WHERE s.user_id = NEW.user_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Default to bronze if no active subscription
  IF v_tier IS NULL THEN
    v_tier := 'bronze';
  END IF;

  -- Map tier to portfolio limit (must match src/domain/entitlements.ts FEATURE_MAP)
  v_limit := CASE v_tier
    WHEN 'bronze' THEN 5
    WHEN 'silver' THEN 15
    WHEN 'gold'   THEN 50
    WHEN 'elite'  THEN 100
    ELSE 5  -- safe default
  END;

  -- Count existing published portfolio projects
  SELECT COUNT(*) INTO v_current_count
  FROM public.portfolio_projects
  WHERE user_id = NEW.user_id
    AND is_published = true;

  IF v_current_count >= v_limit THEN
    RAISE EXCEPTION 'PORTFOLIO_LIMIT_REACHED: You have reached your portfolio limit of % projects for the % tier.', v_limit, v_tier;
  END IF;

  RETURN NEW;
END;
$$;

-- Fire on INSERT only (portfolio entries are created, not updated to published)
CREATE TRIGGER enforce_portfolio_limit
  BEFORE INSERT ON public.portfolio_projects
  FOR EACH ROW
  WHEN (NEW.is_published = true)
  EXECUTE FUNCTION public.validate_portfolio_limit();
