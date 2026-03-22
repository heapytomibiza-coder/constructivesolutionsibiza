
-- weekly_ai_reports table
CREATE TABLE public.weekly_ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_week date NOT NULL,
  summary_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  comparison_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_analysis text,
  issues jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  open_alerts_snapshot jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_weekly_ai_reports_week ON public.weekly_ai_reports (report_week);

ALTER TABLE public.weekly_ai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read weekly reports"
  ON public.weekly_ai_reports FOR SELECT TO public
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

-- get_platform_assistant_summary RPC
CREATE OR REPLACE FUNCTION public.get_platform_assistant_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_this_week jsonb;
  v_prev_week jsonb;
  v_trends jsonb;
  v_alerts jsonb;
  v_latest_report jsonb;
  v_week_start date;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  v_week_start := date_trunc('week', CURRENT_DATE)::date;

  -- This week summary (7 days ending yesterday)
  SELECT jsonb_build_object(
    'period_start', min(metric_date),
    'period_end', max(metric_date),
    'days', count(*),
    'jobs_created', sum(jobs_created),
    'jobs_posted', sum(jobs_posted),
    'jobs_awarded', sum(jobs_awarded),
    'jobs_completed', sum(jobs_completed),
    'jobs_disputed', sum(jobs_disputed),
    'total_conversations', sum(total_conversations),
    'total_messages', sum(total_messages),
    'new_users', sum(new_users),
    'new_professionals', sum(new_professionals),
    'jobs_with_zero_responses', sum(jobs_with_zero_responses),
    'avg_job_score', round(avg(avg_job_score), 1),
    'avg_response_rate', round(avg(response_rate) FILTER (WHERE response_rate IS NOT NULL), 1),
    'avg_success_rate', round(avg(success_rate) FILTER (WHERE success_rate IS NOT NULL), 1),
    'avg_dispute_rate', round(avg(dispute_rate) FILTER (WHERE dispute_rate IS NOT NULL), 1),
    'avg_wizard_completion', round(avg(wizard_completion_rate) FILTER (WHERE wizard_completion_rate IS NOT NULL), 1),
    'avg_response_time_hours', round(avg(avg_response_time_hours) FILTER (WHERE avg_response_time_hours IS NOT NULL), 1)
  ) INTO v_this_week
  FROM daily_platform_metrics
  WHERE metric_date >= (CURRENT_DATE - 7) AND metric_date < CURRENT_DATE;

  -- Previous week for comparison
  SELECT jsonb_build_object(
    'period_start', min(metric_date),
    'period_end', max(metric_date),
    'days', count(*),
    'jobs_created', sum(jobs_created),
    'jobs_posted', sum(jobs_posted),
    'jobs_completed', sum(jobs_completed),
    'jobs_disputed', sum(jobs_disputed),
    'new_users', sum(new_users),
    'new_professionals', sum(new_professionals),
    'avg_response_rate', round(avg(response_rate) FILTER (WHERE response_rate IS NOT NULL), 1),
    'avg_success_rate', round(avg(success_rate) FILTER (WHERE success_rate IS NOT NULL), 1),
    'avg_dispute_rate', round(avg(dispute_rate) FILTER (WHERE dispute_rate IS NOT NULL), 1)
  ) INTO v_prev_week
  FROM daily_platform_metrics
  WHERE metric_date >= (CURRENT_DATE - 14) AND metric_date < (CURRENT_DATE - 7);

  -- 4-week daily trends
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'date', metric_date,
      'success_rate', success_rate,
      'response_rate', response_rate,
      'dispute_rate', dispute_rate,
      'avg_job_score', avg_job_score,
      'jobs_posted', jobs_posted,
      'jobs_completed', jobs_completed
    ) ORDER BY metric_date
  ), '[]'::jsonb) INTO v_trends
  FROM daily_platform_metrics
  WHERE metric_date >= (CURRENT_DATE - 28);

  -- Active alerts (open/acknowledged, last 14 days)
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'severity', severity,
      'title', title,
      'body', body,
      'category', category,
      'metric_date', metric_date,
      'status', status,
      'created_at', created_at,
      'metadata', metadata
    ) ORDER BY
      CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      created_at DESC
  ), '[]'::jsonb) INTO v_alerts
  FROM platform_alerts
  WHERE status IN ('open', 'acknowledged')
    AND created_at >= (now() - interval '14 days');

  -- Latest AI report
  SELECT jsonb_build_object(
    'report_week', report_week,
    'ai_analysis', ai_analysis,
    'issues', issues,
    'recommendations', recommendations,
    'created_at', created_at
  ) INTO v_latest_report
  FROM weekly_ai_reports
  ORDER BY report_week DESC LIMIT 1;

  v_result := jsonb_build_object(
    'this_week', coalesce(v_this_week, '{}'::jsonb),
    'prev_week', coalesce(v_prev_week, '{}'::jsonb),
    'trends', v_trends,
    'alerts', v_alerts,
    'latest_report', coalesce(v_latest_report, null),
    'generated_at', now()
  );

  RETURN v_result;
END;
$$;
