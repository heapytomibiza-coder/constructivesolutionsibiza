-- Restore secure invoker behavior and make public services browse resilient to non-public provider profiles.
-- Live listings must remain visible to everyone, while provider profile data stays optional.

-- Remove the overly-broad public profile policy added for the previous attempt.
DROP POLICY IF EXISTS "Public can view providers with live listings" ON public.professional_profiles;

-- Rebuild the public browse view so listing visibility depends only on the listing itself.
CREATE OR REPLACE VIEW public.service_listings_browse
WITH (security_invoker = true) AS
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
  ss.slug AS subcategory_slug,
  sc.name AS category_name,
  sc.slug AS category_slug,
  (
    SELECT min(spi.price_amount)
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
    ORDER BY spi.price_amount
    LIMIT 1
  ) AS starting_price_unit
FROM public.service_listings sl
LEFT JOIN public.professional_profiles pp ON pp.user_id = sl.provider_id
LEFT JOIN public.service_micro_categories smc ON smc.id = sl.micro_id
LEFT JOIN public.service_subcategories ss ON ss.id = smc.subcategory_id
LEFT JOIN public.service_categories sc ON sc.id = ss.category_id
WHERE sl.status = 'live';