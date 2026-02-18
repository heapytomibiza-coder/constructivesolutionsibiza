CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intent TEXT;
  v_roles TEXT[];
  v_active_role TEXT;
  v_phone TEXT;
  v_full_name TEXT;
BEGIN
  v_intent := COALESCE(NEW.raw_user_meta_data->>'intent', 'client');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_full_name := NEW.raw_user_meta_data->>'full_name';

  IF v_intent = 'client' THEN
    v_roles := ARRAY['client']::TEXT[];
    v_active_role := 'client';
  ELSIF v_intent = 'professional' THEN
    v_roles := ARRAY['client', 'professional']::TEXT[];
    v_active_role := 'professional';
  ELSIF v_intent = 'both' THEN
    v_roles := ARRAY['client', 'professional']::TEXT[];
    v_active_role := 'client';
  ELSE
    v_roles := ARRAY['client']::TEXT[];
    v_active_role := 'client';
  END IF;

  INSERT INTO public.user_roles (user_id, roles, active_role)
  VALUES (NEW.id, v_roles, v_active_role)
  ON CONFLICT (user_id) DO UPDATE
    SET roles = EXCLUDED.roles,
        active_role = EXCLUDED.active_role;

  INSERT INTO public.profiles (user_id, display_name, phone)
  VALUES (NEW.id, v_full_name, v_phone)
  ON CONFLICT (user_id) DO UPDATE
    SET display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  IF v_intent IN ('professional', 'both') THEN
    INSERT INTO public.professional_profiles (user_id, display_name, onboarding_phase, verification_status)
    VALUES (NEW.id, v_full_name, 'not_started', 'unverified')
    ON CONFLICT (user_id) DO UPDATE
      SET display_name = COALESCE(EXCLUDED.display_name, public.professional_profiles.display_name);
  END IF;

  RETURN NEW;
END;
$$;