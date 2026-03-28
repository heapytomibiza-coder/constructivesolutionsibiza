
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
    pms.verification_level AS micro_verification_level
   FROM service_listings sl
     LEFT JOIN professional_profiles pp ON pp.user_id = sl.provider_id
     LEFT JOIN service_micro_categories smc ON smc.id = sl.micro_id
     LEFT JOIN service_subcategories ss ON ss.id = smc.subcategory_id
     LEFT JOIN service_categories sc ON sc.id = ss.category_id
     LEFT JOIN professional_micro_stats pms ON pms.user_id = sl.provider_id AND pms.micro_id = sl.micro_id
  WHERE sl.status = 'live'::text;
