-- ============================================================
-- Sprint 2: Derived Metrics Tables
-- ============================================================

-- 1. daily_platform_metrics — one row per date
CREATE TABLE public.daily_platform_metrics (
  metric_date date PRIMARY KEY,
  jobs_created integer NOT NULL DEFAULT 0,
  jobs_posted integer NOT NULL DEFAULT 0,
  jobs_awarded integer NOT NULL DEFAULT 0,
  jobs_completed integer NOT NULL DEFAULT 0,
  jobs_disputed integer NOT NULL DEFAULT 0,
  avg_job_score numeric DEFAULT 0,
  avg_response_time_hours numeric DEFAULT 0,
  response_rate numeric DEFAULT 0,
  success_rate numeric DEFAULT 0,
  dispute_rate numeric DEFAULT 0,
  wizard_completion_rate numeric DEFAULT 0,
  jobs_with_zero_responses integer NOT NULL DEFAULT 0,
  total_conversations integer NOT NULL DEFAULT 0,
  total_messages integer NOT NULL DEFAULT 0,
  new_users integer NOT NULL DEFAULT 0,
  new_professionals integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_platform_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read platform metrics"
  ON public.daily_platform_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') AND public.is_admin_email());

-- 2. daily_category_metrics — one row per date + category
CREATE TABLE public.daily_category_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  category text NOT NULL,
  jobs_created integer NOT NULL DEFAULT 0,
  jobs_posted integer NOT NULL DEFAULT 0,
  jobs_completed integer NOT NULL DEFAULT 0,
  jobs_disputed integer NOT NULL DEFAULT 0,
  avg_job_score numeric DEFAULT 0,
  avg_responses numeric DEFAULT 0,
  success_rate numeric DEFAULT 0,
  dispute_rate numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (metric_date, category)
);

ALTER TABLE public.daily_category_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read category metrics"
  ON public.daily_category_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') AND public.is_admin_email());

-- 3. daily_worker_metrics — one row per date + worker
CREATE TABLE public.daily_worker_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  worker_id uuid NOT NULL,
  jobs_received integer NOT NULL DEFAULT 0,
  jobs_viewed integer NOT NULL DEFAULT 0,
  jobs_responded integer NOT NULL DEFAULT 0,
  jobs_completed integer NOT NULL DEFAULT 0,
  disputes integer NOT NULL DEFAULT 0,
  response_rate numeric DEFAULT 0,
  completion_rate numeric DEFAULT 0,
  trust_score_snapshot numeric DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (metric_date, worker_id)
);

ALTER TABLE public.daily_worker_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read worker metrics"
  ON public.daily_worker_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') AND public.is_admin_email());

-- Workers can read their own daily metrics
CREATE POLICY "Workers can read own metrics"
  ON public.daily_worker_metrics FOR SELECT
  USING (auth.uid() = worker_id);

-- Indexes for reporting queries
CREATE INDEX idx_daily_category_metrics_date ON public.daily_category_metrics(metric_date DESC);
CREATE INDEX idx_daily_worker_metrics_date ON public.daily_worker_metrics(metric_date DESC);
CREATE INDEX idx_daily_worker_metrics_worker ON public.daily_worker_metrics(worker_id, metric_date DESC);

-- ============================================================
-- aggregate_daily_metrics RPC — idempotent, upserts metrics
-- ============================================================

CREATE OR REPLACE FUNCTION public.aggregate_daily_metrics(p_date date DEFAULT (CURRENT_DATE - 1))
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  -- Only admin or service role
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  v_day_start := p_date::timestamptz;
  v_day_end := (p_date + 1)::timestamptz;

  -- Jobs created (all statuses)
  SELECT count(*) INTO v_jobs_created
  FROM jobs WHERE created_at >= v_day_start AND created_at < v_day_end;

  -- Jobs posted (became open + public)
  SELECT count(*) INTO v_jobs_posted
  FROM jobs WHERE created_at >= v_day_start AND created_at < v_day_end
    AND status = 'open' AND is_publicly_listed = true;

  -- Jobs awarded (assigned_professional_id set that day via status history)
  SELECT count(DISTINCT job_id) INTO v_jobs_awarded
  FROM job_status_history
  WHERE created_at >= v_day_start AND created_at < v_day_end
    AND to_status = 'in_progress';

  -- Jobs completed
  SELECT count(*) INTO v_jobs_completed
  FROM jobs WHERE completed_at >= v_day_start AND completed_at < v_day_end;

  -- Jobs disputed
  SELECT count(*) INTO v_jobs_disputed
  FROM disputes WHERE created_at >= v_day_start AND created_at < v_day_end;

  -- Avg job score for jobs created that day
  SELECT coalesce(round(avg(job_score), 1), 0) INTO v_avg_job_score
  FROM jobs WHERE created_at >= v_day_start AND created_at < v_day_end
    AND job_score IS NOT NULL;

  -- Total conversations started
  SELECT count(*) INTO v_total_convos
  FROM conversations WHERE created_at >= v_day_start AND created_at < v_day_end;

  -- Total messages
  SELECT count(*) INTO v_total_msgs
  FROM messages WHERE created_at >= v_day_start AND created_at < v_day_end
    AND message_type = 'user';

  -- New users
  SELECT count(*) INTO v_new_users
  FROM profiles WHERE created_at >= v_day_start AND created_at < v_day_end;

  -- New professionals
  SELECT count(*) INTO v_new_pros
  FROM professional_profiles WHERE created_at >= v_day_start AND created_at < v_day_end;

  -- Jobs with zero responses (posted that day, still no conversations)
  SELECT count(*) INTO v_jobs_zero_resp
  FROM jobs j
  WHERE j.created_at >= v_day_start AND j.created_at < v_day_end
    AND j.status = 'open' AND j.is_publicly_listed = true
    AND NOT EXISTS (SELECT 1 FROM conversations c WHERE c.job_id = j.id);

  -- Response rate: % of posted jobs that got at least one conversation
  IF v_jobs_posted > 0 THEN
    v_response_rate := round(((v_jobs_posted - v_jobs_zero_resp)::numeric / v_jobs_posted) * 100, 1);
  ELSE
    v_response_rate := 0;
  END IF;

  -- Success rate: completed / (completed + disputed) for that day's completions
  IF (v_jobs_completed + v_jobs_disputed) > 0 THEN
    v_success_rate := round((v_jobs_completed::numeric / (v_jobs_completed + v_jobs_disputed)) * 100, 1);
  ELSE
    v_success_rate := 0;
  END IF;

  -- Dispute rate: disputed / posted
  IF v_jobs_posted > 0 THEN
    v_dispute_rate := round((v_jobs_disputed::numeric / v_jobs_posted) * 100, 1);
  ELSE
    v_dispute_rate := 0;
  END IF;

  -- Wizard completion rate from analytics_events
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
      v_wizard_completion_rate := 0;
    END IF;
  END;

  -- Avg response time (first pro message in conversations started that day)
  SELECT coalesce(round(avg(EXTRACT(EPOCH FROM (m.created_at - c.created_at)) / 3600), 1), 0)
  INTO v_avg_response_hours
  FROM conversations c
  JOIN LATERAL (
    SELECT min(created_at) as created_at
    FROM messages
    WHERE conversation_id = c.id AND sender_id = c.pro_id AND message_type = 'user'
  ) m ON true
  WHERE c.created_at >= v_day_start AND c.created_at < v_day_end
    AND m.created_at IS NOT NULL;

  -- Upsert platform metrics
  INSERT INTO daily_platform_metrics (
    metric_date, jobs_created, jobs_posted, jobs_awarded, jobs_completed, jobs_disputed,
    avg_job_score, avg_response_time_hours, response_rate, success_rate, dispute_rate,
    wizard_completion_rate, jobs_with_zero_responses, total_conversations, total_messages,
    new_users, new_professionals, updated_at
  ) VALUES (
    p_date, v_jobs_created, v_jobs_posted, v_jobs_awarded, v_jobs_completed, v_jobs_disputed,
    v_avg_job_score, coalesce(v_avg_response_hours, 0), v_response_rate, v_success_rate, v_dispute_rate,
    v_wizard_completion_rate, v_jobs_zero_resp, v_total_convos, v_total_msgs,
    v_new_users, v_new_pros, now()
  )
  ON CONFLICT (metric_date) DO UPDATE SET
    jobs_created = EXCLUDED.jobs_created,
    jobs_posted = EXCLUDED.jobs_posted,
    jobs_awarded = EXCLUDED.jobs_awarded,
    jobs_completed = EXCLUDED.jobs_completed,
    jobs_disputed = EXCLUDED.jobs_disputed,
    avg_job_score = EXCLUDED.avg_job_score,
    avg_response_time_hours = EXCLUDED.avg_response_time_hours,
    response_rate = EXCLUDED.response_rate,
    success_rate = EXCLUDED.success_rate,
    dispute_rate = EXCLUDED.dispute_rate,
    wizard_completion_rate = EXCLUDED.wizard_completion_rate,
    jobs_with_zero_responses = EXCLUDED.jobs_with_zero_responses,
    total_conversations = EXCLUDED.total_conversations,
    total_messages = EXCLUDED.total_messages,
    new_users = EXCLUDED.new_users,
    new_professionals = EXCLUDED.new_professionals,
    updated_at = now();

  -- Upsert category metrics
  INSERT INTO daily_category_metrics (metric_date, category, jobs_created, jobs_posted, jobs_completed, jobs_disputed, avg_job_score, avg_responses, success_rate, dispute_rate)
  SELECT
    p_date,
    j.category,
    count(*),
    count(*) FILTER (WHERE j.status = 'open' AND j.is_publicly_listed = true),
    count(*) FILTER (WHERE j.completed_at >= v_day_start AND j.completed_at < v_day_end),
    (SELECT count(*) FROM disputes d WHERE d.job_id = ANY(array_agg(j.id)) AND d.created_at >= v_day_start AND d.created_at < v_day_end),
    coalesce(round(avg(j.job_score), 1), 0),
    coalesce(round(avg((SELECT count(*) FROM conversations c WHERE c.job_id = j.id)::numeric), 1), 0),
    CASE WHEN count(*) FILTER (WHERE j.completed_at IS NOT NULL OR EXISTS(SELECT 1 FROM disputes d2 WHERE d2.job_id = j.id)) > 0
      THEN round(count(*) FILTER (WHERE j.completed_at IS NOT NULL)::numeric /
        GREATEST(1, count(*) FILTER (WHERE j.completed_at IS NOT NULL OR EXISTS(SELECT 1 FROM disputes d2 WHERE d2.job_id = j.id))) * 100, 1)
      ELSE 0
    END,
    0
  FROM jobs j
  WHERE j.created_at >= v_day_start AND j.created_at < v_day_end
    AND j.category IS NOT NULL
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

  -- Upsert worker metrics
  INSERT INTO daily_worker_metrics (metric_date, worker_id, jobs_received, jobs_viewed, jobs_responded, jobs_completed, disputes, response_rate, completion_rate, trust_score_snapshot)
  SELECT
    p_date,
    pp.user_id,
    -- Jobs received: invites sent to this worker that day
    coalesce((SELECT count(*) FROM job_invites ji WHERE ji.professional_id = pp.user_id AND ji.created_at >= v_day_start AND ji.created_at < v_day_end), 0),
    -- Jobs viewed: worker_viewed_job events
    coalesce((SELECT count(*) FROM analytics_events ae WHERE ae.event_name = 'worker_viewed_job' AND ae.user_id = pp.user_id AND ae.created_at >= v_day_start AND ae.created_at < v_day_end), 0),
    -- Jobs responded: conversations started by this pro
    coalesce((SELECT count(*) FROM conversations c WHERE c.pro_id = pp.user_id AND c.created_at >= v_day_start AND c.created_at < v_day_end), 0),
    -- Jobs completed
    coalesce((SELECT count(*) FROM jobs j WHERE j.assigned_professional_id = pp.user_id AND j.completed_at >= v_day_start AND j.completed_at < v_day_end), 0),
    -- Disputes
    coalesce((SELECT count(*) FROM disputes d WHERE (d.raised_by = pp.user_id OR d.counterparty_id = pp.user_id) AND d.created_at >= v_day_start AND d.created_at < v_day_end), 0),
    -- Response rate (conversations / invites for that day)
    CASE WHEN coalesce((SELECT count(*) FROM job_invites ji WHERE ji.professional_id = pp.user_id AND ji.created_at >= v_day_start AND ji.created_at < v_day_end), 0) > 0
      THEN round(coalesce((SELECT count(*) FROM conversations c WHERE c.pro_id = pp.user_id AND c.created_at >= v_day_start AND c.created_at < v_day_end), 0)::numeric /
        (SELECT count(*) FROM job_invites ji WHERE ji.professional_id = pp.user_id AND ji.created_at >= v_day_start AND ji.created_at < v_day_end) * 100, 1)
      ELSE 0
    END,
    -- Completion rate (overall, not just that day)
    CASE WHEN (SELECT count(*) FROM jobs j WHERE j.assigned_professional_id = pp.user_id AND j.status IN ('completed', 'cancelled', 'in_progress')) > 0
      THEN round((SELECT count(*) FROM jobs j WHERE j.assigned_professional_id = pp.user_id AND j.status = 'completed')::numeric /
        (SELECT count(*) FROM jobs j WHERE j.assigned_professional_id = pp.user_id AND j.status IN ('completed', 'cancelled', 'in_progress')) * 100, 1)
      ELSE 0
    END,
    pp.trust_score
  FROM professional_profiles pp
  WHERE pp.onboarding_phase = 'complete'
  ON CONFLICT (metric_date, worker_id) DO UPDATE SET
    jobs_received = EXCLUDED.jobs_received,
    jobs_viewed = EXCLUDED.jobs_viewed,
    jobs_responded = EXCLUDED.jobs_responded,
    jobs_completed = EXCLUDED.jobs_completed,
    disputes = EXCLUDED.disputes,
    response_rate = EXCLUDED.response_rate,
    completion_rate = EXCLUDED.completion_rate,
    trust_score_snapshot = EXCLUDED.trust_score_snapshot;

  RETURN jsonb_build_object(
    'date', p_date,
    'jobs_created', v_jobs_created,
    'jobs_posted', v_jobs_posted,
    'jobs_completed', v_jobs_completed,
    'jobs_disputed', v_jobs_disputed,
    'response_rate', v_response_rate,
    'success_rate', v_success_rate,
    'wizard_completion_rate', v_wizard_completion_rate
  );
END;
$$;