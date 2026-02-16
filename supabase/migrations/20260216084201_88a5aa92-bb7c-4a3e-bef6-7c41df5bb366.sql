
-- Admin-gated RPC for Top Sources reporting
CREATE OR REPLACE FUNCTION public.admin_top_sources(
  p_from_ts timestamptz DEFAULT (now() - interval '30 days'),
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

  SELECT jsonb_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT
      COALESCE(a.ref, a.utm_source, 'Direct') AS source,
      a.utm_medium,
      a.utm_campaign,
      count(*) AS sessions,
      count(DISTINCT a.user_id) FILTER (WHERE a.user_id IS NOT NULL) AS signups,
      count(DISTINCT j.id) AS jobs_posted,
      CASE
        WHEN count(*) > 0 THEN ROUND(count(DISTINCT j.id)::numeric / count(*) * 100, 1)
        ELSE 0
      END AS conversion_rate
    FROM public.attribution_sessions a
    LEFT JOIN public.jobs j
      ON j.attribution->>'session_id' = a.session_id
      AND j.created_at BETWEEN p_from_ts AND p_to_ts
    WHERE a.first_seen_at BETWEEN p_from_ts AND p_to_ts
    GROUP BY COALESCE(a.ref, a.utm_source, 'Direct'), a.utm_medium, a.utm_campaign
    ORDER BY count(*) DESC
    LIMIT 100
  ) r;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
