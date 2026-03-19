
-- 1. Drop the old noisy trigger on professional_services
DROP TRIGGER IF EXISTS trg_professional_service_notify ON professional_services;

-- 2. Create a new function that notifies admin only when a listing becomes "ready for review"
CREATE OR REPLACE FUNCTION notify_listing_ready_for_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name text;
  v_micro_name text;
  v_category_name text;
  v_has_pricing boolean;
  v_old_ready boolean := false;
  v_new_ready boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM service_pricing_items
    WHERE service_listing_id = NEW.id
      AND is_enabled = true
      AND price_amount IS NOT NULL
      AND price_amount > 0
  ) INTO v_has_pricing;

  v_new_ready := (
    NEW.display_title IS NOT NULL AND trim(NEW.display_title) != '' AND
    NEW.short_description IS NOT NULL AND trim(NEW.short_description) != '' AND
    v_has_pricing AND
    NEW.status = 'draft'
  );

  IF TG_OP = 'UPDATE' THEN
    v_old_ready := (
      OLD.display_title IS NOT NULL AND trim(OLD.display_title) != '' AND
      OLD.short_description IS NOT NULL AND trim(OLD.short_description) != ''
    );
  END IF;

  IF v_new_ready AND NOT v_old_ready THEN
    SELECT COALESCE(pp.display_name, p.display_name, 'Unknown')
      INTO v_display_name
      FROM professional_profiles pp
      LEFT JOIN profiles p ON p.user_id = pp.user_id
     WHERE pp.user_id = NEW.provider_id
     LIMIT 1;

    SELECT mc.name, sc2.name
      INTO v_micro_name, v_category_name
      FROM service_micro_categories mc
      JOIN service_subcategories ss ON ss.id = mc.subcategory_id
      JOIN service_categories sc2 ON sc2.id = ss.category_id
     WHERE mc.id = NEW.micro_id;

    INSERT INTO email_notifications_queue (event_type, recipient_user_id, payload)
    VALUES (
      'listing_ready_for_review',
      NULL,
      jsonb_build_object(
        'user_id', NEW.provider_id,
        'display_name', COALESCE(v_display_name, 'Unknown'),
        'listing_id', NEW.id,
        'display_title', NEW.display_title,
        'micro_name', COALESCE(v_micro_name, 'Unknown'),
        'category_name', COALESCE(v_category_name, 'Unknown')
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Create the trigger on service_listings
CREATE TRIGGER trg_notify_listing_ready
  AFTER INSERT OR UPDATE ON service_listings
  FOR EACH ROW
  EXECUTE FUNCTION notify_listing_ready_for_review();
