CREATE OR REPLACE FUNCTION public.admin_get_journey_summary(
  p_window_minutes int DEFAULT 1440
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since timestamptz := now() - make_interval(mins => p_window_minutes);
  v_total_sessions int;
  v_error_sessions int;
  v_anon_sessions int;
  v_authed_sessions int;
  v_top_errors jsonb;
  v_top_drop_routes jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT COUNT(*) INTO v_total_sessions
  FROM public.user_journey_sessions
  WHERE started_at >= v_since;

  SELECT COUNT(DISTINCT s.session_id) INTO v_error_sessions
  FROM public.user_journey_sessions s
  JOIN public.user_journey_events e ON e.session_id = s.session_id
  WHERE s.started_at >= v_since
    AND e.success = false;

  SELECT COUNT(*) INTO v_anon_sessions
  FROM public.user_journey_sessions
  WHERE started_at >= v_since AND user_id IS NULL;

  v_authed_sessions := v_total_sessions - v_anon_sessions;

  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_top_errors
  FROM (
    SELECT event_type, COUNT(*)::int AS count
    FROM public.user_journey_events
    WHERE created_at >= v_since AND success = false
    GROUP BY event_type
    ORDER BY count DESC
    LIMIT 5
  ) t;

  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_top_drop_routes
  FROM (
    SELECT COALESCE(exit_route, entry_route, '/') AS route, COUNT(*)::int AS count
    FROM public.user_journey_sessions s
    WHERE s.started_at >= v_since
      AND EXISTS (
        SELECT 1 FROM public.user_journey_events e
        WHERE e.session_id = s.session_id AND e.success = false
      )
    GROUP BY 1
    ORDER BY count DESC
    LIMIT 5
  ) t;

  RETURN jsonb_build_object(
    'window_minutes', p_window_minutes,
    'total_sessions', v_total_sessions,
    'error_sessions', v_error_sessions,
    'anonymous_sessions', v_anon_sessions,
    'authenticated_sessions', v_authed_sessions,
    'top_error_events', v_top_errors,
    'top_drop_routes', v_top_drop_routes
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_journey_summary(int) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_journey_summary(int) TO authenticated;