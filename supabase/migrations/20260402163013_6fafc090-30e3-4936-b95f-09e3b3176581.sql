-- 1. Update handle_new_user to always assign both roles for all intents
-- This matches the UI promise "you can switch anytime"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intent TEXT;
  v_active_role TEXT;
  v_phone TEXT;
  v_full_name TEXT;
BEGIN
  v_intent := COALESCE(NEW.raw_user_meta_data->>'intent', 'client');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_full_name := NEW.raw_user_meta_data->>'full_name';

  -- All users get both roles so they can switch anytime (as UI promises)
  -- Active role reflects their signup intent
  IF v_intent = 'professional' THEN
    v_active_role := 'professional';
  ELSE
    v_active_role := 'client';
  END IF;

  INSERT INTO public.user_roles (user_id, roles, active_role)
  VALUES (NEW.id, ARRAY['client', 'professional']::TEXT[], v_active_role)
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

  -- Only create professional profile for users who explicitly chose professional/both
  IF v_intent IN ('professional', 'both') THEN
    INSERT INTO public.professional_profiles (user_id, display_name, onboarding_phase, verification_status)
    VALUES (NEW.id, v_full_name, 'not_started', 'unverified')
    ON CONFLICT (user_id) DO UPDATE
      SET display_name = COALESCE(EXCLUDED.display_name, public.professional_profiles.display_name);
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Backfill: add 'professional' role to existing client-only users
UPDATE public.user_roles
SET roles = ARRAY['client', 'professional']::TEXT[]
WHERE roles = ARRAY['client']::TEXT[];