
-- Fix 1: Change service_listings_browse view to SECURITY INVOKER (default, but explicit)
DROP VIEW IF EXISTS public.service_listings_browse;

CREATE VIEW public.service_listings_browse
WITH (security_invoker = true)
AS
SELECT
  sl.id,
  sl.provider_id,
  sl.micro_id,
  sl.display_title,
  sl.short_description,
  sl.hero_image_url,
  sl.location_base,
  sl.pricing_summary,
  sl.view_count,
  sl.published_at,
  sl.created_at,
  pp.display_name AS provider_name,
  pp.avatar_url AS provider_avatar,
  pp.verification_status AS provider_verification,
  smc.name AS micro_name,
  smc.slug AS micro_slug,
  ss.name AS subcategory_name,
  sc.name AS category_name,
  (
    SELECT MIN(spi.price_amount)
    FROM public.service_pricing_items spi
    WHERE spi.service_listing_id = sl.id
    AND spi.is_enabled = true
    AND spi.price_amount IS NOT NULL
    AND spi.price_amount > 0
  ) AS starting_price,
  (
    SELECT spi.unit
    FROM public.service_pricing_items spi
    WHERE spi.service_listing_id = sl.id
    AND spi.is_enabled = true
    AND spi.price_amount IS NOT NULL
    AND spi.price_amount > 0
    ORDER BY spi.price_amount ASC
    LIMIT 1
  ) AS starting_price_unit
FROM public.service_listings sl
JOIN public.professional_profiles pp ON pp.user_id = sl.provider_id
JOIN public.service_micro_categories smc ON smc.id = sl.micro_id
JOIN public.service_subcategories ss ON ss.id = smc.subcategory_id
JOIN public.service_categories sc ON sc.id = ss.category_id
WHERE sl.status = 'live';

-- Fix 2: Replace overly permissive INSERT on service_views with a scoped policy
-- (allow authenticated users + require listing to be live)
DROP POLICY IF EXISTS "Anyone can record a view" ON public.service_views;

CREATE POLICY "Users can record views on live listings"
  ON public.service_views FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_listings sl
      WHERE sl.id = service_views.service_listing_id
      AND sl.status = 'live'
    )
  );
