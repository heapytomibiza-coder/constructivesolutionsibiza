CREATE OR REPLACE FUNCTION public.aggregate_daily_metrics_internal(p_date date)
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
  v_day_start := p_date::timestamptz;
  v_day_end := (p_date + 1)::timestamptz;

  SELECT count(*) INTO v_jobs_created FROM jobs WHERE created_at >= v_day_start AND created_at < v_day_end;
  SELECT count(*) INTO v_jobs_posted FROM jobs WHERE created_at >= v_day_start AND created_at < v_day_end AND status = 'open' AND is_publicly_listed = true;
  SELECT count(DISTINCT job_id) INTO v_jobs_awarded FROM job_status_history WHERE created_at >= v_day_start AND created_at < v_day_end AND to_status = 'in_progress';
  SELECT count(*) INTO v_jobs_completed FROM jobs WHERE completed_at >= v_day_start AND completed_at < v_day_end;
  SELECT count(*) INTO v_jobs_disputed FROM disputes WHERE created_at >= v_day_start AND created_at < v_day_end;
  SELECT coalesce(round(avg(job_score), 1), NULL) INTO v_avg_job_score FROM jobs WHERE created_at >= v_day_start AND created_at < v_day_end AND job_score IS NOT NULL;
  SELECT count(*) INTO v_total_convos FROM conversations WHERE created_at >= v_day_start AND created_at < v_day_end;
  SELECT count(*) INTO v_total_msgs FROM messages WHERE created_at >= v_day_start AND created_at < v_day_end AND message_type = 'user';
  SELECT count(*) INTO v_new_users FROM profiles WHERE created_at >= v_day_start AND created_at < v_day_end;
  SELECT count(*) INTO v_new_pros FROM professional_profiles WHERE created_at >= v_day_start AND created_at < v_day_end;
  SELECT count(*) INTO v_jobs_zero_resp FROM jobs j WHERE j.created_at >= v_day_start AND j.created_at < v_day_end AND j.status = 'open' AND j.is_publicly_listed = true AND NOT EXISTS (SELECT 1 FROM conversations c WHERE c.job_id = j.id);

  IF v_jobs_posted > 0 THEN v_response_rate := round(((v_jobs_posted - v_jobs_zero_resp)::numeric / v_jobs_posted) * 100, 1);
  ELSE v_response_rate := NULL; END IF;

  IF (v_jobs_completed + v_jobs_disputed) > 0 THEN v_success_rate := round((v_jobs_completed::numeric / (v_jobs_completed + v_jobs_disputed)) * 100, 1);
  ELSE v_success_rate := NULL; END IF;

  IF v_jobs_posted > 0 THEN v_dispute_rate := round((v_jobs_disputed::numeric / v_jobs_posted) * 100, 1);
  ELSE v_dispute_rate := NULL; END IF;

  DECLARE v_wizard_starts int; v_wizard_completes int;
  BEGIN
    SELECT count(*) INTO v_wizard_starts FROM analytics_events WHERE event_name = 'job_wizard_started' AND created_at >= v_day_start AND created_at < v_day_end;
    SELECT count(*) INTO v_wizard_completes FROM analytics_events WHERE event_name IN ('job_posted', 'job_edited') AND created_at >= v_day_start AND created_at < v_day_end;
    IF v_wizard_starts > 0 THEN v_wizard_completion_rate := round((v_wizard_completes::numeric / v_wizard_starts) * 100, 1);
    ELSE v_wizard_completion_rate := NULL; END IF;
  END;

  SELECT coalesce(round(avg(EXTRACT(EPOCH FROM (m.created_at - c.created_at)) / 3600), 1), NULL) INTO v_avg_response_hours
  FROM conversations c JOIN LATERAL (SELECT msg.created_at FROM messages msg WHERE msg.conversation_id = c.id ORDER BY msg.created_at ASC LIMIT 1) m ON true
  WHERE c.created_at >= v_day_start AND c.created_at < v_day_end;

  INSERT INTO daily_platform_metrics (metric_date, jobs_created, jobs_posted, jobs_awarded, jobs_completed, jobs_disputed, avg_job_score, total_conversations, total_messages, new_users, new_professionals, jobs_with_zero_responses, response_rate, success_rate, dispute_rate, wizard_completion_rate, avg_response_time_hours)
  VALUES (p_date, v_jobs_created, v_jobs_posted, v_jobs_awarded, v_jobs_completed, v_jobs_disputed, v_avg_job_score, v_total_convos, v_total_msgs, v_new_users, v_new_pros, v_jobs_zero_resp, v_response_rate, v_success_rate, v_dispute_rate, v_wizard_completion_rate, v_avg_response_hours)
  ON CONFLICT (metric_date) DO UPDATE SET
    jobs_created = EXCLUDED.jobs_created, jobs_posted = EXCLUDED.jobs_posted, jobs_awarded = EXCLUDED.jobs_awarded, jobs_completed = EXCLUDED.jobs_completed, jobs_disputed = EXCLUDED.jobs_disputed, avg_job_score = EXCLUDED.avg_job_score, total_conversations = EXCLUDED.total_conversations, total_messages = EXCLUDED.total_messages, new_users = EXCLUDED.new_users, new_professionals = EXCLUDED.new_professionals, jobs_with_zero_responses = EXCLUDED.jobs_with_zero_responses, response_rate = EXCLUDED.response_rate, success_rate = EXCLUDED.success_rate, dispute_rate = EXCLUDED.dispute_rate, wizard_completion_rate = EXCLUDED.wizard_completion_rate, avg_response_time_hours = EXCLUDED.avg_response_time_hours, updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.aggregate_daily_metrics_internal(date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.aggregate_daily_metrics_internal(date) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_daily_metrics_internal(date) TO service_role;