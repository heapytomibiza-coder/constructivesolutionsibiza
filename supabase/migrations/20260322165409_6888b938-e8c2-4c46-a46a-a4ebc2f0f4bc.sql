
-- Create platform_alerts table
CREATE TABLE public.platform_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  metric_date date,
  related_id text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'snoozed')),
  dedupe_key text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  acknowledged_at timestamptz,
  acknowledged_by uuid
);

CREATE UNIQUE INDEX idx_platform_alerts_dedupe ON public.platform_alerts (dedupe_key, metric_date) WHERE metric_date IS NOT NULL;
CREATE INDEX idx_platform_alerts_status ON public.platform_alerts (status) WHERE status IN ('open', 'acknowledged');

ALTER TABLE public.platform_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read alerts"
  ON public.platform_alerts FOR SELECT TO public
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

CREATE POLICY "Admins can update alerts"
  ON public.platform_alerts FOR UPDATE TO public
  USING (has_role(auth.uid(), 'admin') AND is_admin_email())
  WITH CHECK (has_role(auth.uid(), 'admin') AND is_admin_email());

-- run_platform_alert_rules RPC
CREATE OR REPLACE FUNCTION public.run_platform_alert_rules(p_date date DEFAULT (CURRENT_DATE - 1))
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
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO v_metrics FROM daily_platform_metrics WHERE metric_date = p_date;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Rule 1: Zero-response jobs > 20%
  IF v_metrics.jobs_posted > 0 THEN
    v_zero_resp_pct := round((v_metrics.jobs_with_zero_responses::numeric / v_metrics.jobs_posted) * 100, 1);
    IF v_zero_resp_pct > 20 THEN
      INSERT INTO platform_alerts (severity, title, body, category, metric_date, dedupe_key, metadata)
      VALUES (
        CASE WHEN v_zero_resp_pct > 40 THEN 'critical' ELSE 'high' END,
        'High zero-response rate',
        format('%s%% of jobs posted on %s got zero responses (%s of %s jobs)',
          v_zero_resp_pct, p_date, v_metrics.jobs_with_zero_responses, v_metrics.jobs_posted),
        'response_rate', p_date, format('zero_resp_%s', p_date),
        jsonb_build_object('zero_resp_pct', v_zero_resp_pct, 'jobs_posted', v_metrics.jobs_posted, 'jobs_zero_resp', v_metrics.jobs_with_zero_responses)
      ) ON CONFLICT (dedupe_key, metric_date) WHERE metric_date IS NOT NULL DO NOTHING;
      v_alerts_created := v_alerts_created + 1;
    END IF;
  END IF;

  -- Rule 2: Dispute rate > 5%
  IF v_metrics.dispute_rate IS NOT NULL AND v_metrics.dispute_rate > 5 THEN
    INSERT INTO platform_alerts (severity, title, body, category, metric_date, dedupe_key, metadata)
    VALUES (
      CASE WHEN v_metrics.dispute_rate > 10 THEN 'critical' ELSE 'high' END,
      'Elevated dispute rate',
      format('Dispute rate on %s was %s%% (%s disputes from %s posted jobs)',
        p_date, v_metrics.dispute_rate, v_metrics.jobs_disputed, v_metrics.jobs_posted),
      'dispute_rate', p_date, format('dispute_rate_%s', p_date),
      jsonb_build_object('dispute_rate', v_metrics.dispute_rate, 'jobs_disputed', v_metrics.jobs_disputed)
    ) ON CONFLICT (dedupe_key, metric_date) WHERE metric_date IS NOT NULL DO NOTHING;
    v_alerts_created := v_alerts_created + 1;
  END IF;

  -- Rule 3: Wizard completion rate drop > 15% week-over-week
  SELECT avg(wizard_completion_rate) INTO v_prev_week_wizard
  FROM daily_platform_metrics
  WHERE metric_date BETWEEN (p_date - 13) AND (p_date - 7)
    AND wizard_completion_rate IS NOT NULL;

  IF v_prev_week_wizard IS NOT NULL AND v_prev_week_wizard > 0
     AND v_metrics.wizard_completion_rate IS NOT NULL THEN
    IF ((v_prev_week_wizard - v_metrics.wizard_completion_rate) / v_prev_week_wizard) * 100 > 15 THEN
      INSERT INTO platform_alerts (severity, title, body, category, metric_date, dedupe_key, metadata)
      VALUES (
        'medium', 'Wizard completion rate dropped',
        format('Wizard completion on %s was %s%%, down from %s%% avg previous week (>15%% drop)',
          p_date, v_metrics.wizard_completion_rate, round(v_prev_week_wizard, 1)),
        'wizard_completion', p_date, format('wizard_drop_%s', p_date),
        jsonb_build_object('current', v_metrics.wizard_completion_rate, 'prev_week_avg', v_prev_week_wizard)
      ) ON CONFLICT (dedupe_key, metric_date) WHERE metric_date IS NOT NULL DO NOTHING;
      v_alerts_created := v_alerts_created + 1;
    END IF;
  END IF;

  -- Rule 4: Category underperformance
  FOR v_worst_categories IN
    SELECT dcm.category, dcm.jobs_posted, dcm.avg_responses
    FROM daily_category_metrics dcm
    WHERE dcm.metric_date = p_date AND dcm.jobs_posted >= 3
      AND (dcm.avg_responses IS NULL OR dcm.avg_responses < 0.5)
  LOOP
    INSERT INTO platform_alerts (severity, title, body, category, metric_date, related_id, dedupe_key, metadata)
    VALUES (
      'medium',
      format('No responses in %s', v_worst_categories.category),
      format('Category "%s" had %s posted jobs with near-zero responses on %s',
        v_worst_categories.category, v_worst_categories.jobs_posted, p_date),
      'category_underperformance', p_date, v_worst_categories.category,
      format('cat_underperf_%s_%s', v_worst_categories.category, p_date),
      jsonb_build_object('category', v_worst_categories.category, 'jobs_posted', v_worst_categories.jobs_posted)
    ) ON CONFLICT (dedupe_key, metric_date) WHERE metric_date IS NOT NULL DO NOTHING;
    v_alerts_created := v_alerts_created + 1;
  END LOOP;

  -- Rule 5: Worker inactivity spike (>30% of verified listed pros had zero activity)
  SELECT count(*) INTO v_total_active_pros
  FROM professional_profiles
  WHERE is_publicly_listed = true AND verification_status = 'verified';

  IF v_total_active_pros >= 5 THEN
    SELECT count(*) INTO v_inactive_pros
    FROM professional_profiles pp
    WHERE pp.is_publicly_listed = true AND pp.verification_status = 'verified'
      AND NOT EXISTS (
        SELECT 1 FROM daily_worker_metrics dwm
        WHERE dwm.worker_id = pp.user_id AND dwm.metric_date = p_date
      );

    v_inactive_pct := round((v_inactive_pros::numeric / v_total_active_pros) * 100, 1);

    IF v_inactive_pct > 30 THEN
      INSERT INTO platform_alerts (severity, title, body, category, metric_date, dedupe_key, metadata)
      VALUES (
        'medium', 'Worker inactivity spike',
        format('%s%% of active pros (%s of %s) had zero activity on %s',
          v_inactive_pct, v_inactive_pros, v_total_active_pros, p_date),
        'worker_inactivity', p_date, format('worker_inactive_%s', p_date),
        jsonb_build_object('inactive_pct', v_inactive_pct, 'inactive_count', v_inactive_pros, 'total_active', v_total_active_pros)
      ) ON CONFLICT (dedupe_key, metric_date) WHERE metric_date IS NOT NULL DO NOTHING;
      v_alerts_created := v_alerts_created + 1;
    END IF;
  END IF;

  RETURN v_alerts_created;
END;
$$;
