
-- Add image variant columns to service_listings
ALTER TABLE public.service_listings
  ADD COLUMN IF NOT EXISTS hero_thumb_url text,
  ADD COLUMN IF NOT EXISTS hero_card_url text,
  ADD COLUMN IF NOT EXISTS hero_large_url text;

-- Add avatar variant columns to professional_profiles  
ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS avatar_thumb_url text,
  ADD COLUMN IF NOT EXISTS avatar_card_url text;

-- Must drop + recreate to add new columns to the view
DROP VIEW IF EXISTS public.service_listings_browse;

CREATE VIEW public.service_listings_browse
WITH (security_invoker = false) AS
SELECT
  sl.id,
  sl.provider_id,
  sl.micro_id,
  sl.display_title,
  sl.short_description,
  sl.hero_image_url,
  sl.hero_card_url,
  sl.hero_thumb_url,
  sl.location_base,
  sl.pricing_summary,
  sl.view_count,
  sl.published_at,
  sl.created_at,
  pp.display_name AS provider_name,
  pp.avatar_url AS provider_avatar,
  pp.avatar_thumb_url AS provider_avatar_thumb,
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
