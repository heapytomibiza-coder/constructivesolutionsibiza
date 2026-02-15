
-- 1) Replace admin_metric_timeseries with zero-filled version using generate_series
CREATE OR REPLACE FUNCTION public.admin_metric_timeseries(
  p_metric_key text,
  p_from_ts timestamptz,
  p_to_ts timestamptz,
  p_bucket text DEFAULT 'day',
  p_area_filter text DEFAULT NULL,
  p_category_filter text DEFAULT NULL
)
RETURNS TABLE(bucket_start timestamptz, value bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_interval interval;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_bucket = 'hour' THEN v_interval := '1 hour'::interval;
  ELSE v_interval := '1 day'::interval;
  END IF;

  -- Generate zero-filled series then left join actual counts
  RETURN QUERY
  WITH buckets AS (
    SELECT generate_series(
      date_trunc(p_bucket, p_from_ts),
      date_trunc(p_bucket, p_to_ts),
      v_interval
    ) AS bucket_start
  ),
  raw_counts AS (
    SELECT * FROM (
      SELECT date_trunc(p_bucket, j.created_at) AS bs, count(*)::bigint AS cnt
      FROM public.jobs j
      WHERE p_metric_key IN ('jobs_posted','open_jobs')
        AND j.created_at BETWEEN p_from_ts AND p_to_ts
        AND j.status = 'open' AND j.is_publicly_listed = true
        AND (p_area_filter IS NULL OR j.area = p_area_filter)
        AND (p_category_filter IS NULL OR j.category = p_category_filter)
      GROUP BY 1

      UNION ALL

      SELECT date_trunc(p_bucket, j.completed_at) AS bs, count(*)::bigint AS cnt
      FROM public.jobs j
      WHERE p_metric_key = 'completed_jobs'
        AND j.completed_at BETWEEN p_from_ts AND p_to_ts
        AND j.status = 'completed'
        AND (p_area_filter IS NULL OR j.area = p_area_filter)
        AND (p_category_filter IS NULL OR j.category = p_category_filter)
      GROUP BY 1

      UNION ALL

      SELECT date_trunc(p_bucket, j.created_at) AS bs, count(*)::bigint AS cnt
      FROM public.jobs j
      WHERE p_metric_key = 'active_jobs'
        AND j.created_at BETWEEN p_from_ts AND p_to_ts
        AND j.status = 'active'
        AND (p_area_filter IS NULL OR j.area = p_area_filter)
        AND (p_category_filter IS NULL OR j.category = p_category_filter)
      GROUP BY 1

      UNION ALL

      SELECT date_trunc(p_bucket, p.created_at) AS bs, count(*)::bigint AS cnt
      FROM public.profiles p
      WHERE p_metric_key = 'new_users'
        AND p.created_at BETWEEN p_from_ts AND p_to_ts
      GROUP BY 1

      UNION ALL

      SELECT date_trunc(p_bucket, pp.created_at) AS bs, count(*)::bigint AS cnt
      FROM public.professional_profiles pp
      WHERE p_metric_key = 'new_pros'
        AND pp.created_at BETWEEN p_from_ts AND p_to_ts
      GROUP BY 1

      UNION ALL

      SELECT date_trunc(p_bucket, c.created_at) AS bs, count(*)::bigint AS cnt
      FROM public.conversations c
      WHERE p_metric_key = 'conversations'
        AND c.created_at BETWEEN p_from_ts AND p_to_ts
      GROUP BY 1

      UNION ALL

      SELECT date_trunc(p_bucket, sr.created_at) AS bs, count(*)::bigint AS cnt
      FROM public.support_requests sr
      WHERE p_metric_key = 'support_tickets'
        AND sr.created_at BETWEEN p_from_ts AND p_to_ts
      GROUP BY 1

      UNION ALL

      SELECT date_trunc(p_bucket, m.created_at) AS bs, count(*)::bigint AS cnt
      FROM public.messages m
      WHERE p_metric_key = 'messages_sent'
        AND m.created_at BETWEEN p_from_ts AND p_to_ts
        AND m.message_type = 'user'
      GROUP BY 1
    ) sub
  )
  SELECT b.bucket_start, COALESCE(rc.cnt, 0)::bigint AS value
  FROM buckets b
  LEFT JOIN raw_counts rc ON rc.bs = b.bucket_start
  ORDER BY b.bucket_start;
END;
$$;

-- 2) RPC: admin_unanswered_jobs — jobs with no conversation within N hours
CREATE OR REPLACE FUNCTION public.admin_unanswered_jobs(
  p_from_ts timestamptz DEFAULT (now() - interval '30 days'),
  p_to_ts timestamptz DEFAULT now(),
  p_hours_threshold int DEFAULT 6
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
      j.id,
      j.title,
      j.category,
      j.area,
      j.budget_type,
      j.budget_value,
      j.created_at,
      ROUND(EXTRACT(EPOCH FROM (now() - j.created_at)) / 3600, 1) AS hours_waiting,
      (SELECT count(*) FROM public.conversations c WHERE c.job_id = j.id) AS conversation_count
    FROM public.jobs j
    WHERE j.created_at BETWEEN p_from_ts AND p_to_ts
      AND j.status = 'open'
      AND j.is_publicly_listed = true
      AND NOT EXISTS (
        SELECT 1 FROM public.conversations c WHERE c.job_id = j.id
      )
      AND EXTRACT(EPOCH FROM (now() - j.created_at)) / 3600 >= p_hours_threshold
    ORDER BY j.created_at ASC
  ) r;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 3) RPC: admin_repeat_work — clients who post again + pros who get rehired
CREATE OR REPLACE FUNCTION public.admin_repeat_work(
  p_from_ts timestamptz DEFAULT (now() - interval '90 days'),
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

  SELECT jsonb_build_object(
    'repeat_clients', (
      SELECT jsonb_agg(row_to_json(rc))
      FROM (
        SELECT
          j.user_id AS client_id,
          p.display_name,
          count(*) AS total_jobs,
          count(*) FILTER (WHERE j.status = 'completed') AS completed_jobs,
          min(j.created_at) AS first_job_at,
          max(j.created_at) AS latest_job_at
        FROM public.jobs j
        LEFT JOIN public.profiles p ON p.user_id = j.user_id
        WHERE j.created_at BETWEEN p_from_ts AND p_to_ts
          AND j.is_publicly_listed = true
        GROUP BY j.user_id, p.display_name
        HAVING count(*) >= 2
        ORDER BY count(*) DESC
        LIMIT 50
      ) rc
    ),
    'rehired_pros', (
      SELECT jsonb_agg(row_to_json(rp))
      FROM (
        SELECT
          j.assigned_professional_id AS pro_id,
          pp.display_name,
          pp.business_name,
          count(*) AS total_hired,
          count(DISTINCT j.user_id) AS unique_clients,
          count(*) FILTER (WHERE j.status = 'completed') AS completed
        FROM public.jobs j
        JOIN public.professional_profiles pp ON pp.user_id = j.assigned_professional_id
        WHERE j.assigned_professional_id IS NOT NULL
          AND j.created_at BETWEEN p_from_ts AND p_to_ts
        GROUP BY j.assigned_professional_id, pp.display_name, pp.business_name
        HAVING count(*) >= 2
        ORDER BY count(*) DESC
        LIMIT 50
      ) rp
    ),
    'summary', jsonb_build_object(
      'total_repeat_clients', (
        SELECT count(*) FROM (
          SELECT j.user_id FROM public.jobs j
          WHERE j.created_at BETWEEN p_from_ts AND p_to_ts
            AND j.is_publicly_listed = true
          GROUP BY j.user_id HAVING count(*) >= 2
        ) x
      ),
      'total_rehired_pros', (
        SELECT count(*) FROM (
          SELECT j.assigned_professional_id FROM public.jobs j
          WHERE j.assigned_professional_id IS NOT NULL
            AND j.created_at BETWEEN p_from_ts AND p_to_ts
          GROUP BY j.assigned_professional_id HAVING count(*) >= 2
        ) x
      )
    )
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;
