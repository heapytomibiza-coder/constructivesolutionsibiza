
CREATE OR REPLACE FUNCTION public.admin_onboarding_funnel(
  p_from_ts timestamptz DEFAULT now() - interval '30 days',
  p_to_ts timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  WITH entered AS (
    SELECT
      user_id,
      metadata->>'step' AS step,
      created_at AS entered_at
    FROM public.analytics_events
    WHERE event_name = 'pro_onboarding_step_entered'
      AND created_at BETWEEN p_from_ts AND p_to_ts
  ),
  completed AS (
    SELECT
      user_id,
      metadata->>'step' AS step,
      created_at AS completed_at
    FROM public.analytics_events
    WHERE event_name = 'pro_onboarding_step_completed'
      AND created_at BETWEEN p_from_ts AND p_to_ts
  ),
  step_times AS (
    SELECT
      e.step,
      ROUND(AVG(EXTRACT(EPOCH FROM (c.completed_at - e.entered_at)))::numeric, 1) AS avg_seconds,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (c.completed_at - e.entered_at)))::numeric, 1) AS median_seconds,
      MIN(EXTRACT(EPOCH FROM (c.completed_at - e.entered_at)))::numeric AS min_seconds,
      MAX(EXTRACT(EPOCH FROM (c.completed_at - e.entered_at)))::numeric AS max_seconds,
      COUNT(*) AS paired_count
    FROM entered e
    JOIN completed c
      ON e.user_id = c.user_id
      AND e.step = c.step
      AND c.completed_at > e.entered_at
      AND c.completed_at < e.entered_at + interval '1 hour'
    GROUP BY e.step
  ),
  drop_off AS (
    SELECT
      metadata->>'step' AS step,
      COUNT(*) FILTER (WHERE event_name = 'pro_onboarding_step_entered') AS entered,
      COUNT(*) FILTER (WHERE event_name = 'pro_onboarding_step_completed') AS completed
    FROM public.analytics_events
    WHERE event_name IN ('pro_onboarding_step_entered', 'pro_onboarding_step_completed')
      AND created_at BETWEEN p_from_ts AND p_to_ts
    GROUP BY metadata->>'step'
  ),
  failures AS (
    SELECT
      metadata->>'step' AS step,
      COUNT(*) AS failure_count
    FROM public.analytics_events
    WHERE event_name = 'onboarding_step_failed'
      AND created_at BETWEEN p_from_ts AND p_to_ts
    GROUP BY metadata->>'step'
  )
  SELECT jsonb_build_object(
    'steps', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'step', d.step,
        'entered', d.entered,
        'completed', d.completed,
        'drop_off_count', d.entered - d.completed,
        'drop_off_rate', CASE WHEN d.entered > 0 THEN ROUND((1 - d.completed::numeric / d.entered) * 100, 1) ELSE 0 END,
        'avg_seconds', COALESCE(st.avg_seconds, 0),
        'median_seconds', COALESCE(st.median_seconds, 0),
        'min_seconds', COALESCE(st.min_seconds, 0),
        'max_seconds', COALESCE(st.max_seconds, 0),
        'failure_count', COALESCE(f.failure_count, 0)
      ) ORDER BY d.entered DESC)
      FROM drop_off d
      LEFT JOIN step_times st ON st.step = d.step
      LEFT JOIN failures f ON f.step = d.step
    ), '[]'::jsonb),
    'total_started', COALESCE((
      SELECT COUNT(DISTINCT user_id)
      FROM public.analytics_events
      WHERE event_name = 'pro_onboarding_step_entered'
        AND created_at BETWEEN p_from_ts AND p_to_ts
    ), 0),
    'total_completed_all', COALESCE((
      SELECT COUNT(DISTINCT user_id)
      FROM public.analytics_events
      WHERE event_name = 'pro_onboarding_step_completed'
        AND metadata->>'step' = 'review'
        AND created_at BETWEEN p_from_ts AND p_to_ts
    ), 0)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
