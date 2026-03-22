
-- One-time backfill: aggregate daily metrics + run alert rules for all historical dates
-- Creates a temporary function without auth check, runs it, then drops it

-- Step 1: Create backfill aggregation function (no auth check)
CREATE OR REPLACE FUNCTION public._backfill_aggregate(p_date date)
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

  IF v_jobs_posted > 0 THEN v_response_rate := round(((v_jobs_posted - v_jobs_zero_resp)::numeric / v_jobs_posted) * 100, 1); ELSE v_response_rate := NULL; END IF;
  IF (v_jobs_completed + v_jobs_disputed) > 0 THEN v_success_rate := round((v_jobs_completed::numeric / (v_jobs_completed + v_jobs_disputed)) * 100, 1); ELSE v_success_rate := NULL; END IF;
  IF v_jobs_posted > 0 THEN v_dispute_rate := round((v_jobs_disputed::numeric / v_jobs_posted) * 100, 1); ELSE v_dispute_rate := NULL; END IF;

  DECLARE
    v_wizard_starts int;
    v_wizard_completes int;
  BEGIN
    SELECT count(*) INTO v_wizard_starts FROM analytics_events WHERE event_name = 'job_wizard_started' AND created_at >= v_day_start AND created_at < v_day_end;
    SELECT count(*) INTO v_wizard_completes FROM analytics_events WHERE event_name IN ('job_posted', 'job_edited') AND created_at >= v_day_start AND created_at < v_day_end;
    IF v_wizard_starts > 0 THEN v_wizard_completion_rate := round((v_wizard_completes::numeric / v_wizard_starts) * 100, 1); ELSE v_wizard_completion_rate := NULL; END IF;
  END;

  SELECT coalesce(round(avg(EXTRACT(EPOCH FROM (m.created_at - c.created_at)) / 3600), 1), NULL) INTO v_avg_response_hours
  FROM conversations c JOIN LATERAL (SELECT msg.created_at FROM messages msg WHERE msg.conversation_id = c.id ORDER BY msg.created_at ASC LIMIT 1) m ON true
  WHERE c.created_at >= v_day_start AND c.created_at < v_day_end;

  INSERT INTO daily_platform_metrics (metric_date, jobs_created, jobs_posted, jobs_awarded, jobs_completed, jobs_disputed, avg_job_score, total_conversations, total_messages, new_users, new_professionals, jobs_with_zero_responses, response_rate, success_rate, dispute_rate, wizard_completion_rate, avg_response_time_hours, updated_at)
  VALUES (p_date, v_jobs_created, v_jobs_posted, v_jobs_awarded, v_jobs_completed, v_jobs_disputed, v_avg_job_score, v_total_convos, v_total_msgs, v_new_users, v_new_pros, v_jobs_zero_resp, v_response_rate, v_success_rate, v_dispute_rate, v_wizard_completion_rate, v_avg_response_hours, now())
  ON CONFLICT (metric_date) DO UPDATE SET jobs_created=EXCLUDED.jobs_created, jobs_posted=EXCLUDED.jobs_posted, jobs_awarded=EXCLUDED.jobs_awarded, jobs_completed=EXCLUDED.jobs_completed, jobs_disputed=EXCLUDED.jobs_disputed, avg_job_score=EXCLUDED.avg_job_score, total_conversations=EXCLUDED.total_conversations, total_messages=EXCLUDED.total_messages, new_users=EXCLUDED.new_users, new_professionals=EXCLUDED.new_professionals, jobs_with_zero_responses=EXCLUDED.jobs_with_zero_responses, response_rate=EXCLUDED.response_rate, success_rate=EXCLUDED.success_rate, dispute_rate=EXCLUDED.dispute_rate, wizard_completion_rate=EXCLUDED.wizard_completion_rate, avg_response_time_hours=EXCLUDED.avg_response_time_hours, updated_at=now();

  -- Category metrics
  INSERT INTO daily_category_metrics (metric_date, category, jobs_created, jobs_posted, jobs_completed, jobs_disputed, avg_job_score, avg_responses, success_rate, dispute_rate)
  SELECT p_date, j.category,
    count(*) FILTER (WHERE j.created_at >= v_day_start AND j.created_at < v_day_end),
    count(*) FILTER (WHERE j.created_at >= v_day_start AND j.created_at < v_day_end AND j.status = 'open' AND j.is_publicly_listed = true),
    count(*) FILTER (WHERE j.completed_at >= v_day_start AND j.completed_at < v_day_end),
    0,
    round(avg(j.job_score) FILTER (WHERE j.job_score IS NOT NULL), 1),
    round(avg(conv_counts.conv_count), 1),
    CASE WHEN count(*) FILTER (WHERE j.completed_at >= v_day_start AND j.completed_at < v_day_end) > 0
      THEN round(count(*) FILTER (WHERE j.completed_at >= v_day_start AND j.completed_at < v_day_end)::numeric / NULLIF(count(*) FILTER (WHERE j.completed_at >= v_day_start AND j.completed_at < v_day_end) + count(*) FILTER (WHERE j.id IN (SELECT d.job_id FROM disputes d WHERE d.created_at >= v_day_start AND d.created_at < v_day_end)), 0) * 100, 1)
      ELSE NULL END,
    CASE WHEN count(*) FILTER (WHERE j.created_at >= v_day_start AND j.created_at < v_day_end AND j.status = 'open' AND j.is_publicly_listed = true) > 0
      THEN round(count(*) FILTER (WHERE j.id IN (SELECT d2.job_id FROM disputes d2 WHERE d2.created_at >= v_day_start AND d2.created_at < v_day_end))::numeric / NULLIF(count(*) FILTER (WHERE j.created_at >= v_day_start AND j.created_at < v_day_end AND j.status = 'open' AND j.is_publicly_listed = true), 0) * 100, 1)
      ELSE NULL END
  FROM jobs j LEFT JOIN LATERAL (SELECT count(*) as conv_count FROM conversations c WHERE c.job_id = j.id) conv_counts ON true
  WHERE j.category IS NOT NULL AND (j.created_at >= v_day_start AND j.created_at < v_day_end)
  GROUP BY j.category
  ON CONFLICT (metric_date, category) DO UPDATE SET jobs_created=EXCLUDED.jobs_created, jobs_posted=EXCLUDED.jobs_posted, jobs_completed=EXCLUDED.jobs_completed, jobs_disputed=EXCLUDED.jobs_disputed, avg_job_score=EXCLUDED.avg_job_score, avg_responses=EXCLUDED.avg_responses, success_rate=EXCLUDED.success_rate, dispute_rate=EXCLUDED.dispute_rate;

  -- Worker metrics
  INSERT INTO daily_worker_metrics (metric_date, worker_id, jobs_received, jobs_viewed, jobs_responded, jobs_completed, disputes, response_rate, completion_rate, trust_score_snapshot)
  SELECT p_date, pp.user_id,
    coalesce(inv.total_invites, 0), coalesce(viewed.view_count, 0), coalesce(inv.responded_invites, 0), coalesce(completed.comp_count, 0), coalesce(disp.disp_count, 0),
    CASE WHEN coalesce(inv.total_invites, 0) > 0 THEN round((coalesce(inv.responded_invites, 0)::numeric / inv.total_invites) * 100, 1) ELSE NULL END,
    CASE WHEN coalesce(inv.total_invites, 0) > 0 THEN round((coalesce(completed.comp_count, 0)::numeric / inv.total_invites) * 100, 1) ELSE NULL END,
    pp.trust_score
  FROM professional_profiles pp
  LEFT JOIN LATERAL (SELECT count(*) as total_invites, count(*) FILTER (WHERE ji.status != 'pending') as responded_invites FROM job_invites ji WHERE ji.professional_id = pp.user_id AND ji.created_at >= v_day_start AND ji.created_at < v_day_end) inv ON true
  LEFT JOIN LATERAL (SELECT count(*) as view_count FROM analytics_events ae WHERE ae.event_name = 'worker_viewed_job' AND ae.user_id = pp.user_id AND ae.created_at >= v_day_start AND ae.created_at < v_day_end) viewed ON true
  LEFT JOIN LATERAL (SELECT count(*) as comp_count FROM jobs j WHERE j.assigned_professional_id = pp.user_id AND j.completed_at >= v_day_start AND j.completed_at < v_day_end) completed ON true
  LEFT JOIN LATERAL (SELECT count(*) as disp_count FROM disputes d WHERE (d.raised_by = pp.user_id OR d.counterparty_id = pp.user_id) AND d.created_at >= v_day_start AND d.created_at < v_day_end) disp ON true
  WHERE (coalesce(inv.total_invites, 0) + coalesce(viewed.view_count, 0) + coalesce(completed.comp_count, 0) + coalesce(disp.disp_count, 0)) > 0
  ON CONFLICT (metric_date, worker_id) DO UPDATE SET jobs_received=EXCLUDED.jobs_received, jobs_viewed=EXCLUDED.jobs_viewed, jobs_responded=EXCLUDED.jobs_responded, jobs_completed=EXCLUDED.jobs_completed, disputes=EXCLUDED.disputes, response_rate=EXCLUDED.response_rate, completion_rate=EXCLUDED.completion_rate, trust_score_snapshot=EXCLUDED.trust_score_snapshot;
END;
$$;

-- Step 2: Create backfill alert rules function (no auth check)
CREATE OR REPLACE FUNCTION public._backfill_alerts(p_date date)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alerts_created int := 0;
  v_metrics daily_platform_metrics%ROWTYPE;
  v_prev_week_wizard numeric;
  v_zero_resp_pct numeric;
  v_worst_categories RECORD;
  v_total_active_pros int;
  v_inactive_pros int;
  v_inactive_pct numeric;
BEGIN
  SELECT * INTO v_metrics FROM daily_platform_metrics WHERE metric_date = p_date;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF v_metrics.jobs_posted > 0 THEN
    v_zero_resp_pct := round((v_metrics.jobs_with_zero_responses::numeric / v_metrics.jobs_posted) * 100, 1);
    IF v_zero_resp_pct > 20 THEN
      INSERT INTO platform_alerts (severity, title, body, category, metric_date, dedupe_key, metadata)
      VALUES (CASE WHEN v_zero_resp_pct > 40 THEN 'critical' ELSE 'high' END, 'High zero-response rate',
        format('%s%% of jobs posted on %s got zero responses (%s of %s jobs)', v_zero_resp_pct, p_date, v_metrics.jobs_with_zero_responses, v_metrics.jobs_posted),
        'response_rate', p_date, format('zero_resp_%s', p_date),
        jsonb_build_object('zero_resp_pct', v_zero_resp_pct, 'jobs_posted', v_metrics.jobs_posted, 'jobs_zero_resp', v_metrics.jobs_with_zero_responses)
      ) ON CONFLICT (dedupe_key, metric_date) WHERE metric_date IS NOT NULL DO NOTHING;
      v_alerts_created := v_alerts_created + 1;
    END IF;
  END IF;

  IF v_metrics.dispute_rate IS NOT NULL AND v_metrics.dispute_rate > 5 THEN
    INSERT INTO platform_alerts (severity, title, body, category, metric_date, dedupe_key, metadata)
    VALUES (CASE WHEN v_metrics.dispute_rate > 10 THEN 'critical' ELSE 'high' END, 'Elevated dispute rate',
      format('Dispute rate on %s was %s%% (%s disputes from %s posted jobs)', p_date, v_metrics.dispute_rate, v_metrics.jobs_disputed, v_metrics.jobs_posted),
      'dispute_rate', p_date, format('dispute_rate_%s', p_date),
      jsonb_build_object('dispute_rate', v_metrics.dispute_rate, 'jobs_disputed', v_metrics.jobs_disputed)
    ) ON CONFLICT (dedupe_key, metric_date) WHERE metric_date IS NOT NULL DO NOTHING;
    v_alerts_created := v_alerts_created + 1;
  END IF;

  SELECT avg(wizard_completion_rate) INTO v_prev_week_wizard FROM daily_platform_metrics WHERE metric_date BETWEEN (p_date - 13) AND (p_date - 7) AND wizard_completion_rate IS NOT NULL;
  IF v_prev_week_wizard IS NOT NULL AND v_prev_week_wizard > 0 AND v_metrics.wizard_completion_rate IS NOT NULL THEN
    IF ((v_prev_week_wizard - v_metrics.wizard_completion_rate) / v_prev_week_wizard) * 100 > 15 THEN
      INSERT INTO platform_alerts (severity, title, body, category, metric_date, dedupe_key, metadata)
      VALUES ('medium', 'Wizard completion rate dropped',
        format('Wizard completion on %s was %s%%, down from %s%% avg previous week (>15%% drop)', p_date, v_metrics.wizard_completion_rate, round(v_prev_week_wizard, 1)),
        'wizard_completion', p_date, format('wizard_drop_%s', p_date),
        jsonb_build_object('current', v_metrics.wizard_completion_rate, 'prev_week_avg', v_prev_week_wizard)
      ) ON CONFLICT (dedupe_key, metric_date) WHERE metric_date IS NOT NULL DO NOTHING;
      v_alerts_created := v_alerts_created + 1;
    END IF;
  END IF;

  FOR v_worst_categories IN SELECT dcm.category, dcm.jobs_posted, dcm.avg_responses FROM daily_category_metrics dcm WHERE dcm.metric_date = p_date AND dcm.jobs_posted >= 3 AND (dcm.avg_responses IS NULL OR dcm.avg_responses < 0.5)
  LOOP
    INSERT INTO platform_alerts (severity, title, body, category, metric_date, related_id, dedupe_key, metadata)
    VALUES ('medium', format('No responses in %s', v_worst_categories.category),
      format('Category "%s" had %s posted jobs with near-zero responses on %s', v_worst_categories.category, v_worst_categories.jobs_posted, p_date),
      'category_underperformance', p_date, v_worst_categories.category, format('cat_underperf_%s_%s', v_worst_categories.category, p_date),
      jsonb_build_object('category', v_worst_categories.category, 'jobs_posted', v_worst_categories.jobs_posted)
    ) ON CONFLICT (dedupe_key, metric_date) WHERE metric_date IS NOT NULL DO NOTHING;
    v_alerts_created := v_alerts_created + 1;
  END LOOP;

  SELECT count(*) INTO v_total_active_pros FROM professional_profiles WHERE is_publicly_listed = true AND verification_status = 'verified';
  IF v_total_active_pros >= 5 THEN
    SELECT count(*) INTO v_inactive_pros FROM professional_profiles pp WHERE pp.is_publicly_listed = true AND pp.verification_status = 'verified' AND NOT EXISTS (SELECT 1 FROM daily_worker_metrics dwm WHERE dwm.worker_id = pp.user_id AND dwm.metric_date = p_date);
    v_inactive_pct := round((v_inactive_pros::numeric / v_total_active_pros) * 100, 1);
    IF v_inactive_pct > 30 THEN
      INSERT INTO platform_alerts (severity, title, body, category, metric_date, dedupe_key, metadata)
      VALUES ('medium', 'Worker inactivity spike',
        format('%s%% of active pros (%s of %s) had zero activity on %s', v_inactive_pct, v_inactive_pros, v_total_active_pros, p_date),
        'worker_inactivity', p_date, format('worker_inactive_%s', p_date),
        jsonb_build_object('inactive_pct', v_inactive_pct, 'inactive_count', v_inactive_pros, 'total_active', v_total_active_pros)
      ) ON CONFLICT (dedupe_key, metric_date) WHERE metric_date IS NOT NULL DO NOTHING;
      v_alerts_created := v_alerts_created + 1;
    END IF;
  END IF;

  RETURN v_alerts_created;
END;
$$;

-- Step 3: Run the backfill loop
DO $$
DECLARE
  d date;
BEGIN
  -- Aggregate metrics for each historical day
  FOR d IN SELECT generate_series('2026-02-15'::date, CURRENT_DATE - 1, '1 day'::interval)::date
  LOOP
    PERFORM public._backfill_aggregate(d);
  END LOOP;

  -- Run alert rules for each day (needs metrics to exist first)
  FOR d IN SELECT generate_series('2026-02-15'::date, CURRENT_DATE - 1, '1 day'::interval)::date
  LOOP
    PERFORM public._backfill_alerts(d);
  END LOOP;
END;
$$;

-- Step 4: Clean up temporary functions
DROP FUNCTION IF EXISTS public._backfill_aggregate(date);
DROP FUNCTION IF EXISTS public._backfill_alerts(date);
