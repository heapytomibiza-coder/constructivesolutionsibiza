-- 1. Fix handle_new_user() — client-intent gets client role only
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

  IF v_intent = 'professional' THEN
    v_roles := ARRAY['client', 'professional']::TEXT[];
    v_active_role := 'professional';
  ELSIF v_intent = 'both' THEN
    v_roles := ARRAY['client', 'professional']::TEXT[];
    v_active_role := 'client';
  ELSE
    -- Client-intent: client role only
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

  -- Only create professional profile for professional/both intent
  IF v_intent IN ('professional', 'both') THEN
    INSERT INTO public.professional_profiles (user_id, display_name, onboarding_phase, verification_status)
    VALUES (NEW.id, v_full_name, 'not_started', 'unverified')
    ON CONFLICT (user_id) DO UPDATE
      SET display_name = COALESCE(EXCLUDED.display_name, public.professional_profiles.display_name);
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create become_professional RPC — atomic role + profile creation
CREATE OR REPLACE FUNCTION public.become_professional()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_display_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Already has professional role? Nothing to do.
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id AND 'professional' = ANY(roles)
  ) THEN
    -- Ensure profile exists even if role was somehow added without it
    INSERT INTO public.professional_profiles (user_id, onboarding_phase, verification_status)
    VALUES (v_user_id, 'not_started', 'unverified')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN;
  END IF;

  -- Get display name from profiles
  SELECT display_name INTO v_display_name
  FROM public.profiles WHERE user_id = v_user_id;

  -- Add professional role
  UPDATE public.user_roles
  SET roles = array_append(roles, 'professional'),
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Create professional profile
  INSERT INTO public.professional_profiles (user_id, display_name, onboarding_phase, verification_status)
  VALUES (v_user_id, v_display_name, 'not_started', 'unverified')
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- 3. Backfill: remove professional role from users who never engaged
-- These users have onboarding_phase = 'not_started' AND active_role = 'client'
-- meaning they were auto-assigned the role but never entered the professional flow.
UPDATE public.user_roles
SET roles = array_remove(roles, 'professional'),
    updated_at = now()
WHERE 'professional' = ANY(roles)
  AND active_role = 'client'
  AND user_id IN (
    SELECT pp.user_id FROM public.professional_profiles pp
    WHERE pp.onboarding_phase = 'not_started'
  );

-- Clean up the placeholder professional_profiles rows for these users
DELETE FROM public.professional_profiles
WHERE onboarding_phase = 'not_started'
  AND user_id NOT IN (
    SELECT user_id FROM public.user_roles
    WHERE 'professional' = ANY(roles)
  );