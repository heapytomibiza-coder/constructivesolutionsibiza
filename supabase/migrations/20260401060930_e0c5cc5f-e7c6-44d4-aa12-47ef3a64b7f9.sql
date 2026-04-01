
CREATE OR REPLACE FUNCTION public.admin_onboarding_health()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'stuck_not_started', COUNT(*) FILTER (WHERE pp.onboarding_phase = 'not_started'),
    'stuck_basic_info',  COUNT(*) FILTER (WHERE pp.onboarding_phase = 'basic_info'),
    'stuck_service_setup', COUNT(*) FILTER (WHERE pp.onboarding_phase = 'service_setup'),
    'no_zones', COUNT(*) FILTER (WHERE pp.onboarding_phase = 'service_setup' AND pp.service_zones IS NULL),
    'no_phone', COUNT(*) FILTER (WHERE pp.onboarding_phase != 'complete' AND p.phone IS NULL),
    'zero_offered_services', COUNT(*) FILTER (
      WHERE pp.onboarding_phase != 'complete'
        AND NOT EXISTS (
          SELECT 1 FROM professional_services ps
          WHERE ps.user_id = pp.user_id AND ps.status = 'offered'
        )
    ),
    'completed_24h', COUNT(*) FILTER (WHERE pp.onboarding_phase = 'complete' AND pp.updated_at > now() - interval '24 hours')
  )
  FROM professional_profiles pp
  LEFT JOIN profiles p ON p.user_id = pp.user_id
  WHERE has_role(auth.uid(), 'admin') AND is_admin_email();
$$;
