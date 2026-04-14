
-- 1. Create the canonical helper that bypasses RLS safely
CREATE OR REPLACE FUNCTION public.grant_professional_access(
  p_user_id UUID,
  p_create_profile BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_display_name TEXT;
  v_prev_role TEXT;
BEGIN
  -- Already has professional role? Ensure profile exists and return.
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND 'professional' = ANY(roles)
  ) THEN
    IF p_create_profile THEN
      INSERT INTO public.professional_profiles (user_id, onboarding_phase, verification_status)
      VALUES (p_user_id, 'not_started', 'unverified')
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN;
  END IF;

  -- Save current role context, override to postgres to bypass RLS
  v_prev_role := current_setting('role', true);
  SET LOCAL ROLE postgres;

  -- Add professional role
  UPDATE public.user_roles
  SET roles = array_append(roles, 'professional'),
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Restore previous role context
  EXECUTE format('SET LOCAL ROLE %I', v_prev_role);

  -- Create professional profile if requested
  IF p_create_profile THEN
    SELECT display_name INTO v_display_name
    FROM public.profiles WHERE user_id = p_user_id;

    INSERT INTO public.professional_profiles (user_id, display_name, onboarding_phase, verification_status)
    VALUES (p_user_id, v_display_name, 'not_started', 'unverified')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;
$$;

-- 2. Revoke direct execution — only callable by other SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.grant_professional_access(UUID, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_professional_access(UUID, BOOLEAN) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_professional_access(UUID, BOOLEAN) FROM anon;

-- 3. Rewrite become_professional() to use the helper instead of direct array_append
CREATE OR REPLACE FUNCTION public.become_professional()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delegate to canonical helper (SECURITY DEFINER can call it)
  PERFORM public.grant_professional_access(v_user_id, TRUE);
END;
$$;
