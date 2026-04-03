
-- ============================================================
-- Task 1: Recalibrate listing limits
-- Task 4: listing_addons table
-- Combined into get_tier_limit() update
-- ============================================================

-- Create listing_addons table
CREATE TABLE public.listing_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  extra_listings INTEGER NOT NULL DEFAULT 10,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  stripe_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger instead of CHECK for status
CREATE OR REPLACE FUNCTION public.validate_listing_addon_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'expired', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid listing addon status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_listing_addon_status
BEFORE INSERT OR UPDATE ON public.listing_addons
FOR EACH ROW
EXECUTE FUNCTION public.validate_listing_addon_status();

-- Timestamp trigger
CREATE TRIGGER update_listing_addons_updated_at
BEFORE UPDATE ON public.listing_addons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.listing_addons ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own add-ons
CREATE POLICY "Users can view own listing addons"
ON public.listing_addons
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS: Admins can manage all add-ons
CREATE POLICY "Admins can manage listing addons"
ON public.listing_addons
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text) AND is_admin_email())
WITH CHECK (has_role(auth.uid(), 'admin'::text) AND is_admin_email());

-- Create index for efficient lookups
CREATE INDEX idx_listing_addons_user_active
ON public.listing_addons (user_id)
WHERE status = 'active';

-- ============================================================
-- Recalibrated get_tier_limit with new caps + add-on support
-- ============================================================
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
  v_base INTEGER;
  v_addon INTEGER;
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

  v_base := CASE _feature
    WHEN 'listing_limit' THEN
      CASE v_tier
        WHEN 'elite'  THEN 9999
        WHEN 'gold'   THEN 9999
        WHEN 'silver' THEN 30
        ELSE 15
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

  -- Add active listing add-ons for listing_limit only
  IF _feature = 'listing_limit' THEN
    SELECT COALESCE(SUM(extra_listings), 0) INTO v_addon
    FROM public.listing_addons
    WHERE user_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now());

    v_base := v_base + v_addon;
  END IF;

  RETURN v_base;
END;
$$;

-- ============================================================
-- Tasks 2+3: Rebuild professional_matching_scores with
-- has_live_listing awareness and 25-point bonus
-- ============================================================
DROP VIEW IF EXISTS public.professional_matching_scores;

CREATE VIEW public.professional_matching_scores
WITH (security_invoker = true)
AS
SELECT
  ps.user_id,
  ps.micro_id,
  ps.status,
  ps.notify,
  ps.searchable,
  COALESCE(pmp.preference, 'neutral') AS preference,
  COALESCE(pms.completed_jobs_count, 0) AS completed_jobs_count,
  pms.avg_rating,
  COALESCE(pms.verification_level, 'unverified') AS verification_level,
  -- Whether this pro has a live service listing for this micro
  (sl.id IS NOT NULL) AS has_live_listing,
  -- Scoring formula (higher = better match)
  (
    CASE COALESCE(pmp.preference, 'neutral')
      WHEN 'love' THEN 30
      WHEN 'like' THEN 20
      WHEN 'neutral' THEN 10
      WHEN 'avoid' THEN -50
      ELSE 10
    END
    + COALESCE(pms.completed_jobs_count, 0) * 2
    + COALESCE(pms.avg_rating, 0) * 5
    + CASE COALESCE(pms.verification_level, 'unverified')
        WHEN 'expert' THEN 50
        WHEN 'verified' THEN 30
        WHEN 'progressing' THEN 10
        ELSE 0
      END
    -- Live listing bonus: 25 points for having a published service page
    + CASE WHEN sl.id IS NOT NULL THEN 25 ELSE 0 END
  ) AS match_score
FROM public.professional_services ps
LEFT JOIN public.professional_micro_preferences pmp
  ON ps.user_id = pmp.user_id AND ps.micro_id = pmp.micro_id
LEFT JOIN public.professional_micro_stats pms
  ON ps.user_id = pms.user_id AND ps.micro_id = pms.micro_id
LEFT JOIN LATERAL (
  SELECT sl2.id
  FROM public.service_listings sl2
  WHERE sl2.provider_id = ps.user_id
    AND sl2.micro_id = ps.micro_id
    AND sl2.status = 'live'
  LIMIT 1
) sl ON true
WHERE ps.searchable = true;
