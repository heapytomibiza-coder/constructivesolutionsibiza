-- Update handle_new_user to read intent from user metadata and set proper roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intent TEXT;
  v_roles TEXT[];
  v_active_role TEXT;
BEGIN
  -- Read intent from user metadata (set during signup)
  v_intent := COALESCE(NEW.raw_user_meta_data->>'intent', 'client');
  
  -- Determine roles based on intent
  IF v_intent = 'client' THEN
    v_roles := ARRAY['client']::TEXT[];
    v_active_role := 'client';
  ELSIF v_intent = 'professional' THEN
    v_roles := ARRAY['client', 'professional']::TEXT[];
    v_active_role := 'professional';
  ELSIF v_intent = 'both' THEN
    v_roles := ARRAY['client', 'professional']::TEXT[];
    v_active_role := 'client';  -- Default to client for 'both', user can switch
  ELSE
    -- Fallback: default to client
    v_roles := ARRAY['client']::TEXT[];
    v_active_role := 'client';
  END IF;
  
  -- Insert user roles
  INSERT INTO public.user_roles (user_id, roles, active_role)
  VALUES (NEW.id, v_roles, v_active_role);
  
  -- If professional intent, also create a professional_profiles stub
  IF v_intent IN ('professional', 'both') THEN
    INSERT INTO public.professional_profiles (user_id, onboarding_phase, verification_status)
    VALUES (NEW.id, 'not_started', 'unverified');
  END IF;
  
  RETURN NEW;
END;
$$;