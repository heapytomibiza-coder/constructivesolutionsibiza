
-- Trigger function: enqueue admin notification when a professional adds a service
CREATE OR REPLACE FUNCTION public.on_professional_service_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name text;
  v_micro_name text;
  v_micro_slug text;
  v_category_name text;
BEGIN
  -- Get professional display name
  SELECT COALESCE(pp.display_name, p.display_name, 'Unknown')
    INTO v_display_name
    FROM professional_profiles pp
    LEFT JOIN profiles p ON p.user_id = pp.user_id
   WHERE pp.user_id = NEW.user_id
   LIMIT 1;

  -- Get micro category details
  SELECT mc.name, mc.slug, sc2.name
    INTO v_micro_name, v_micro_slug, v_category_name
    FROM service_micro_categories mc
    JOIN service_subcategories ss ON ss.id = mc.subcategory_id
    JOIN service_categories sc2 ON sc2.id = ss.category_id
   WHERE mc.id = NEW.micro_id;

  INSERT INTO email_notifications_queue (event_type, recipient_user_id, payload)
  VALUES (
    'new_service',
    NULL,
    jsonb_build_object(
      'user_id', NEW.user_id,
      'display_name', COALESCE(v_display_name, 'Unknown'),
      'micro_name', COALESCE(v_micro_name, NEW.micro_id::text),
      'micro_slug', COALESCE(v_micro_slug, ''),
      'category_name', COALESCE(v_category_name, 'Unknown'),
      'service_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$;

-- Attach the trigger
DROP TRIGGER IF EXISTS trg_professional_service_notify ON professional_services;
CREATE TRIGGER trg_professional_service_notify
  AFTER INSERT ON professional_services
  FOR EACH ROW
  EXECUTE FUNCTION on_professional_service_insert();
