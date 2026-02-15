
-- Replace admin_repeat_work to add repeat_rate and rehire_rate to summary
CREATE OR REPLACE FUNCTION public.admin_repeat_work(
  p_from_ts timestamptz DEFAULT now() - interval '90 days',
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
          count(*) FILTER (WHERE j.status = 'completed') AS completed,
          ROUND(
            count(*) FILTER (WHERE j.status = 'completed')::numeric
            / NULLIF(count(*), 0), 2
          ) AS completion_ratio
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
      ),
      'total_clients_in_period', (
        SELECT count(DISTINCT j.user_id) FROM public.jobs j
        WHERE j.created_at BETWEEN p_from_ts AND p_to_ts
          AND j.is_publicly_listed = true
      ),
      'total_active_pros_in_period', (
        SELECT count(DISTINCT j.assigned_professional_id) FROM public.jobs j
        WHERE j.assigned_professional_id IS NOT NULL
          AND j.created_at BETWEEN p_from_ts AND p_to_ts
      ),
      'repeat_rate', (
        SELECT ROUND(
          count(*) FILTER (WHERE cnt >= 2)::numeric / NULLIF(count(*), 0), 2
        )
        FROM (
          SELECT j.user_id, count(*) AS cnt FROM public.jobs j
          WHERE j.created_at BETWEEN p_from_ts AND p_to_ts
            AND j.is_publicly_listed = true
          GROUP BY j.user_id
        ) x
      ),
      'rehire_rate', (
        SELECT ROUND(
          count(*) FILTER (WHERE cnt >= 2)::numeric / NULLIF(count(*), 0), 2
        )
        FROM (
          SELECT j.assigned_professional_id, count(*) AS cnt FROM public.jobs j
          WHERE j.assigned_professional_id IS NOT NULL
            AND j.created_at BETWEEN p_from_ts AND p_to_ts
          GROUP BY j.assigned_professional_id
        ) x
      )
    )
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;
