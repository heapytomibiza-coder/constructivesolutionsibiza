-- Drop the older, contradicting publish gate trigger that wrongly requires hero_image_url
-- Keep only validate_service_listing_live as the single source of truth
DROP TRIGGER IF EXISTS trg_enforce_service_listing_publish_gate ON public.service_listings;
DROP FUNCTION IF EXISTS enforce_service_listing_publish_gate();