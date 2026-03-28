-- RPC 1: Count distinct clients who hired this provider 2+ times
CREATE OR REPLACE FUNCTION public.get_provider_repeat_clients(p_provider_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(count(*)::integer, 0) FROM (
    SELECT user_id FROM jobs
    WHERE assigned_professional_id = p_provider_id
      AND status = 'completed'
    GROUP BY user_id
    HAVING count(*) >= 2
  ) x;
$$;

-- RPC 2: Count completed jobs in a specific area
CREATE OR REPLACE FUNCTION public.get_provider_area_jobs(p_provider_id uuid, p_area text)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(count(*)::integer, 0) FROM jobs
  WHERE assigned_professional_id = p_provider_id
    AND status = 'completed'
    AND location->>'area' = p_area;
$$;

-- RPC 3: Get per-zone job counts for a provider
CREATE OR REPLACE FUNCTION public.get_provider_zone_jobs(p_provider_id uuid)
RETURNS TABLE(area text, job_count integer)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT location->>'area' AS area, count(*)::integer AS job_count
  FROM jobs
  WHERE assigned_professional_id = p_provider_id
    AND status = 'completed'
    AND location->>'area' IS NOT NULL
  GROUP BY location->>'area'
  ORDER BY job_count DESC;
$$;

-- Extend service_listings_browse with repeat_client_count
DROP VIEW IF EXISTS service_listings_browse;

CREATE VIEW service_listings_browse AS
SELECT sl.id,
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
    ( SELECT min(spi.price_amount)
           FROM service_pricing_items spi
          WHERE spi.service_listing_id = sl.id AND spi.is_enabled = true AND spi.price_amount IS NOT NULL AND spi.price_amount > 0::numeric) AS starting_price,
    ( SELECT spi.unit
           FROM service_pricing_items spi
          WHERE spi.service_listing_id = sl.id AND spi.is_enabled = true AND spi.price_amount IS NOT NULL AND spi.price_amount > 0::numeric
          ORDER BY spi.price_amount
         LIMIT 1) AS starting_price_unit,
    pms.avg_rating AS micro_avg_rating,
    pms.rating_count AS micro_rating_count,
    pms.completed_jobs_count AS micro_completed_count,
    pms.verification_level AS micro_verification_level,
    ( SELECT count(*)::integer FROM (
        SELECT j.user_id FROM jobs j
        WHERE j.assigned_professional_id = sl.provider_id
          AND j.status = 'completed'
        GROUP BY j.user_id
        HAVING count(*) >= 2
      ) rc
    ) AS repeat_client_count
   FROM service_listings sl
     LEFT JOIN professional_profiles pp ON pp.user_id = sl.provider_id
     LEFT JOIN service_micro_categories smc ON smc.id = sl.micro_id
     LEFT JOIN service_subcategories ss ON ss.id = smc.subcategory_id
     LEFT JOIN service_categories sc ON sc.id = ss.category_id
     LEFT JOIN professional_micro_stats pms ON pms.user_id = sl.provider_id AND pms.micro_id = sl.micro_id
  WHERE sl.status = 'live'::text;