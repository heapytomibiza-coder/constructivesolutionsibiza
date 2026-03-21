DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower('constructivesolutionsibiza@gmail.com')
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No auth user found for constructivesolutionsibiza@gmail.com';
    RETURN;
  END IF;

  INSERT INTO public.admin_allowlist (email)
  VALUES ('constructivesolutionsibiza@gmail.com')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.user_roles (user_id, roles, active_role)
  VALUES (
    v_user_id,
    ARRAY['client','professional','admin']::text[],
    'admin'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET roles = (
        SELECT ARRAY(
          SELECT DISTINCT role_name
          FROM unnest(coalesce(public.user_roles.roles, ARRAY[]::text[]) || ARRAY['client','professional','admin']::text[]) AS role_name
          ORDER BY role_name
        )
      ),
      active_role = CASE
        WHEN public.user_roles.active_role IS NULL OR public.user_roles.active_role = '' THEN 'admin'
        ELSE public.user_roles.active_role
      END,
      updated_at = now();

  INSERT INTO public.professional_profiles (user_id, onboarding_phase, verification_status)
  VALUES (v_user_id, 'not_started', 'unverified')
  ON CONFLICT (user_id) DO NOTHING;
END $$;