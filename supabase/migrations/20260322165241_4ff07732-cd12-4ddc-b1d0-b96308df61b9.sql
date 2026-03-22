
-- Drop and recreate aggregate_daily_metrics with fixed null-rate logic
DROP FUNCTION IF EXISTS public.aggregate_daily_metrics(date);

CREATE OR REPLACE FUNCTION public.aggregate_daily_metrics(p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jobs_created int;
  v_jobs_posted int;
  v_jobs_awarded int;
  v_jobs_completed int;
  v_jobs_disputed int;
  v_avg_job_score numeric;
  v_total_convos int;
  v_total_msgs int;
  v_new_users int;
  v_new_pros int;
  v_jobs_zero_resp int;
  v_response_rate numeric;
  v_success_rate numeric;
  v_dispute_rate numeric;
  v_wizard_completion_rate numeric;
  v_avg_response_hours numeric;
  v_day_start timestamptz;
  v_day_end timestamptz;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  v_day_start := p_date::timestamptz;
  v_day_end := (p_date + 1)::timestamptz;

  SELECT count(*) INTO v_jobs_created
  FROM jobs WHERE created_at >= v_day_start AND created_at < v_day_end;

  SELECT count(*) INTO v_jobs_posted
  FROM jobs WHERE created_at >= v_day_start AND created_at < v_day_end
    AND status = 'open' AND is_publicly_listed = true;

  SELECT count(DISTINCT job_id) INTO v_jobs_awarded
  FROM job_status_history
  WHERE created_at >= v_day_start AND created_at < v_day_end
    AND to_status = 'in_progress';

  SELECT count(*) INTO v_jobs_completed
  FROM jobs WHERE completed_at >= v_day_start AND completed_at < v_day_end;

  SELECT count(*) INTO v_jobs_disputed
  FROM disputes WHERE created_at >= v_day_start AND created_at < v_day_end;

  SELECT coalesce(round(avg(job_score), 1), NULL) INTO v_avg_job_score
  FROM jobs WHERE created_at >= v_day_start AND created_at < v_day_end
    AND job_score IS NOT NULL;

  SELECT count(*) INTO v_total_convos
  FROM conversations WHERE created_at >= v_day_start AND created_at < v_day_end;

  SELECT count(*) INTO v_total_msgs
  FROM messages WHERE created_at >= v_day_start AND created_at < v_day_end
    AND message_type = 'user';

  SELECT count(*) INTO v_new_users
  FROM profiles WHERE created_at >= v_day_start AND created_at < v_day_end;

  SELECT count(*) INTO v_new_pros
  FROM professional_profiles WHERE created_at >= v_day_start AND created_at < v_day_end;

  SELECT count(*) INTO v_jobs_zero_resp
  FROM jobs j
  WHERE j.created_at >= v_day_start AND j.created_at < v_day_end
    AND j.status = 'open' AND j.is_publicly_listed = true
    AND NOT EXISTS (SELECT 1 FROM conversations c WHERE c.job_id = j.id);

  -- Response rate: NULL when no posted jobs
  IF v_jobs_posted > 0 THEN
    v_response_rate := round(((v_jobs_posted - v_jobs_zero_resp)::numeric / v_jobs_posted) * 100, 1);
  ELSE
    v_response_rate := NULL;
  END IF;

  -- Resolved-outcome success rate: NULL when no resolved outcomes
  IF (v_jobs_completed + v_jobs_disputed) > 0 THEN
    v_success_rate := round((v_jobs_completed::numeric / (v_jobs_completed + v_jobs_disputed)) * 100, 1);
  ELSE
    v_success_rate := NULL;
  END IF;

  -- Dispute rate: NULL when no posted jobs
  IF v_jobs_posted > 0 THEN
    v_dispute_rate := round((v_jobs_disputed::numeric / v_jobs_posted) * 100, 1);
  ELSE
    v_dispute_rate := NULL;
  END IF;

  -- Wizard completion rate
  DECLARE
    v_wizard_starts int;
    v_wizard_completes int;
  BEGIN
    SELECT count(*) INTO v_wizard_starts
    FROM analytics_events
    WHERE event_name = 'job_wizard_started'
      AND created_at >= v_day_start AND created_at < v_day_end;

    SELECT count(*) INTO v_wizard_completes
    FROM analytics_events
    WHERE event_name IN ('job_posted', 'job_edited')
      AND created_at >= v_day_start AND created_at < v_day_end;

    IF v_wizard_starts > 0 THEN
      v_wizard_completion_rate := round((v_wizard_completes::numeric / v_wizard_starts) * 100, 1);
    ELSE
      v_wizard_completion_rate := NULL;
    END IF;
  END;

  -- Avg response time
  SELECT coalesce(round(avg(EXTRACT(EPOCH FROM (m.created_at - c.created_at)) / 3600), 1), NULL)
  INTO v_avg_response_hours
  FROM conversations c
  JOIN LATERAL (
    SELECT msg.created_at FROM messages msg
    WHERE msg.conversation_id = c.id
    ORDER BY msg.created_at ASC LIMIT 1
  ) m ON true
  WHERE c.created_at >= v_day_start AND c.created_at < v_day_end;

  -- Upsert platform metrics
  INSERT INTO daily_platform_metrics (
    metric_date, jobs_created, jobs_posted, jobs_awarded, jobs_completed,
    jobs_disputed, avg_job_score, total_conversations, total_messages,
    new_users, new_professionals, jobs_with_zero_responses,
    response_rate, success_rate, dispute_rate,
    wizard_completion_rate, avg_response_time_hours, updated_at
  ) VALUES (
    p_date, v_jobs_created, v_jobs_posted, v_jobs_awarded, v_jobs_completed,
    v_jobs_disputed, v_avg_job_score, v_total_convos, v_total_msgs,
    v_new_users, v_new_pros, v_jobs_zero_resp,
    v_response_rate, v_success_rate, v_dispute_rate,
    v_wizard_completion_rate, v_avg_response_hours, now()
  )
  ON CONFLICT (metric_date) DO UPDATE SET
    jobs_created = EXCLUDED.jobs_created,
    jobs_posted = EXCLUDED.jobs_posted,
    jobs_awarded = EXCLUDED.jobs_awarded,
    jobs_completed = EXCLUDED.jobs_completed,
    jobs_disputed = EXCLUDED.jobs_disputed,
    avg_job_score = EXCLUDED.avg_job_score,
    total_conversations = EXCLUDED.total_conversations,
    total_messages = EXCLUDED.total_messages,
    new_users = EXCLUDED.new_users,
    new_professionals = EXCLUDED.new_professionals,
    jobs_with_zero_responses = EXCLUDED.jobs_with_zero_responses,
    response_rate = EXCLUDED.response_rate,
    success_rate = EXCLUDED.success_rate,
    dispute_rate = EXCLUDED.dispute_rate,
    wizard_completion_rate = EXCLUDED.wizard_completion_rate,
    avg_response_time_hours = EXCLUDED.avg_response_time_hours,
    updated_at = now();

  -- Category metrics
  INSERT INTO daily_category_metrics (metric_date, category, jobs_created, jobs_posted, jobs_completed, jobs_disputed, avg_job_score, avg_responses, success_rate, dispute_rate)
  SELECT
    p_date,
    j.category,
    count(*) FILTER (WHERE j.created_at >= v_day_start AND j.created_at < v_day_end),
    count(*) FILTER (WHERE j.created_at >= v_day_start AND j.created_at < v_day_end AND j.status = 'open' AND j.is_publicly_listed = true),
    count(*) FILTER (WHERE j.completed_at >= v_day_start AND j.completed_at < v_day_end),
    0,
    round(avg(j.job_score) FILTER (WHERE j.job_score IS NOT NULL), 1),
    round(avg(conv_counts.conv_count), 1),
    CASE
      WHEN count(*) FILTER (WHERE j.completed_at >= v_day_start AND j.completed_at < v_day_end) > 0
      THEN round(count(*) FILTER (WHERE j.completed_at >= v_day_start AND j.completed_at < v_day_end)::numeric /
           NULLIF(count(*) FILTER (WHERE j.completed_at >= v_day_start AND j.completed_at < v_day_end) +
           count(*) FILTER (WHERE j.id IN (SELECT d.job_id FROM disputes d WHERE d.created_at >= v_day_start AND d.created_at < v_day_end)), 0) * 100, 1)
      ELSE NULL
    END,
    CASE
      WHEN count(*) FILTER (WHERE j.created_at >= v_day_start AND j.created_at < v_day_end AND j.status = 'open' AND j.is_publicly_listed = true) > 0
      THEN round(count(*) FILTER (WHERE j.id IN (SELECT d2.job_id FROM disputes d2 WHERE d2.created_at >= v_day_start AND d2.created_at < v_day_end))::numeric /
           NULLIF(count(*) FILTER (WHERE j.created_at >= v_day_start AND j.created_at < v_day_end AND j.status = 'open' AND j.is_publicly_listed = true), 0) * 100, 1)
      ELSE NULL
    END
  FROM jobs j
  LEFT JOIN LATERAL (
    SELECT count(*) as conv_count FROM conversations c WHERE c.job_id = j.id
  ) conv_counts ON true
  WHERE j.category IS NOT NULL
    AND (j.created_at >= v_day_start AND j.created_at < v_day_end)
  GROUP BY j.category
  ON CONFLICT (metric_date, category) DO UPDATE SET
    jobs_created = EXCLUDED.jobs_created,
    jobs_posted = EXCLUDED.jobs_posted,
    jobs_completed = EXCLUDED.jobs_completed,
    jobs_disputed = EXCLUDED.jobs_disputed,
    avg_job_score = EXCLUDED.avg_job_score,
    avg_responses = EXCLUDED.avg_responses,
    success_rate = EXCLUDED.success_rate,
    dispute_rate = EXCLUDED.dispute_rate;

  -- Worker metrics
  INSERT INTO daily_worker_metrics (metric_date, worker_id, jobs_received, jobs_viewed, jobs_responded, jobs_completed, disputes, response_rate, completion_rate, trust_score_snapshot)
  SELECT
    p_date,
    pp.user_id,
    coalesce(inv.total_invites, 0),
    coalesce(viewed.view_count, 0),
    coalesce(inv.responded_invites, 0),
    coalesce(completed.comp_count, 0),
    coalesce(disp.disp_count, 0),
    CASE WHEN coalesce(inv.total_invites, 0) > 0
      THEN round((coalesce(inv.responded_invites, 0)::numeric / inv.total_invites) * 100, 1)
      ELSE NULL
    END,
    CASE WHEN coalesce(inv.total_invites, 0) > 0
      THEN round((coalesce(completed.comp_count, 0)::numeric / inv.total_invites) * 100, 1)
      ELSE NULL
    END,
    pp.trust_score
  FROM professional_profiles pp
  LEFT JOIN LATERAL (
    SELECT count(*) as total_invites,
           count(*) FILTER (WHERE ji.status != 'pending') as responded_invites
    FROM job_invites ji
    WHERE ji.professional_id = pp.user_id
      AND ji.created_at >= v_day_start AND ji.created_at < v_day_end
  ) inv ON true
  LEFT JOIN LATERAL (
    SELECT count(*) as view_count
    FROM analytics_events ae
    WHERE ae.event_name = 'worker_viewed_job'
      AND ae.user_id = pp.user_id
      AND ae.created_at >= v_day_start AND ae.created_at < v_day_end
  ) viewed ON true
  LEFT JOIN LATERAL (
    SELECT count(*) as comp_count
    FROM jobs j
    WHERE j.assigned_professional_id = pp.user_id
      AND j.completed_at >= v_day_start AND j.completed_at < v_day_end
  ) completed ON true
  LEFT JOIN LATERAL (
    SELECT count(*) as disp_count
    FROM disputes d
    WHERE (d.raised_by = pp.user_id OR d.counterparty_id = pp.user_id)
      AND d.created_at >= v_day_start AND d.created_at < v_day_end
  ) disp ON true
  WHERE (coalesce(inv.total_invites, 0) + coalesce(viewed.view_count, 0) + coalesce(completed.comp_count, 0) + coalesce(disp.disp_count, 0)) > 0
  ON CONFLICT (metric_date, worker_id) DO UPDATE SET
    jobs_received = EXCLUDED.jobs_received,
    jobs_viewed = EXCLUDED.jobs_viewed,
    jobs_responded = EXCLUDED.jobs_responded,
    jobs_completed = EXCLUDED.jobs_completed,
    disputes = EXCLUDED.disputes,
    response_rate = EXCLUDED.response_rate,
    completion_rate = EXCLUDED.completion_rate,
    trust_score_snapshot = EXCLUDED.trust_score_snapshot;
END;
$$;

-- Add column comments for clarity
COMMENT ON COLUMN daily_platform_metrics.success_rate IS 'Resolved-outcome success rate: completed / (completed + disputed). NULL when no resolved outcomes.';
COMMENT ON COLUMN daily_platform_metrics.response_rate IS 'Pct of posted jobs with at least one pro response. NULL when no jobs posted.';
