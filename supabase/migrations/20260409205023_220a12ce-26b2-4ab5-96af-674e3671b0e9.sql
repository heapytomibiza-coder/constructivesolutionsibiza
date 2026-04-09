
-- Create a cron-safe wrapper that bypasses the admin check
-- The original function keeps its admin guard for manual/UI calls
CREATE OR REPLACE FUNCTION public.run_platform_alert_rules_cron(p_date date)
RETURNS integer
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
  -- No auth check — this runs from pg_cron only

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
      format('Dispute rate on %s was %s%%', p_date, v_metrics.dispute_rate),
      'dispute_rate', p_date, format('dispute_rate_%s', p_date),
      jsonb_build_object('dispute_rate', v_metrics.dispute_rate)
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
        format('Wizard completion on %s was %s%%, down from %s%% avg previous week',
          p_date, v_metrics.wizard_completion_rate, round(v_prev_week_wizard, 1)),
        'wizard_completion', p_date, format('wizard_drop_%s', p_date),
        jsonb_build_object('current', v_metrics.wizard_completion_rate, 'prev_week_avg', v_prev_week_wizard)
      ) ON CONFLICT (dedupe_key, metric_date) WHERE metric_date IS NOT NULL DO NOTHING;
      v_alerts_created := v_alerts_created + 1;
    END IF;
  END IF;

  RETURN v_alerts_created;
END;
$$;
