CREATE OR REPLACE FUNCTION public.admin_operator_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alerts jsonb := '[]'::jsonb;
  v_count int;
  v_phase_count int;
  v_worst_phase text;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Failed emails
  SELECT count(*) INTO v_count FROM public.email_notifications_queue WHERE sent_at IS NULL AND attempts >= 3;
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','failed_emails','severity','red','title','Failed Emails','body',v_count||' email(s) failed after max retries','count',v_count,'cta_label','View Health','cta_href','/dashboard/admin?tab=health');
  END IF;

  -- High-priority tickets
  SELECT count(*) INTO v_count FROM public.support_requests WHERE priority = 'high' AND status IN ('open','triage');
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','high_priority_tickets','severity','red','title','High-Priority Tickets','body',v_count||' urgent ticket(s) need attention','count',v_count,'cta_label','View Support','cta_href','/dashboard/admin?tab=support');
  END IF;

  -- Unanswered jobs (6+ hours)
  SELECT count(*) INTO v_count FROM public.jobs j WHERE j.status='open' AND j.is_publicly_listed=true AND NOT EXISTS(SELECT 1 FROM public.conversations c WHERE c.job_id=j.id) AND EXTRACT(EPOCH FROM(now()-j.created_at))/3600>=6;
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','unanswered_jobs','severity','red','title','Unanswered Jobs','body',v_count||' job(s) with no response for 6+ hours','count',v_count,'cta_label','View Unanswered','cta_href','/dashboard/admin/insights/unanswered-jobs');
  END IF;

  -- Open tickets
  SELECT count(*) INTO v_count FROM public.support_requests WHERE status IN ('open','triage');
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','open_tickets','severity','yellow','title','Open Tickets','body',v_count||' ticket(s) awaiting resolution','count',v_count,'cta_label','View Support','cta_href','/dashboard/admin?tab=support');
  END IF;

  -- CRITICAL: Onboarding bottleneck — >5 users stuck at SAME phase (RED)
  SELECT onboarding_phase, count(*) 
  INTO v_worst_phase, v_phase_count
  FROM public.professional_profiles 
  WHERE onboarding_phase NOT IN ('complete','not_started') 
    AND updated_at < now() - interval '6 hours'
  GROUP BY onboarding_phase
  ORDER BY count(*) DESC
  LIMIT 1;

  IF v_phase_count IS NOT NULL AND v_phase_count > 5 THEN
    v_alerts := v_alerts || jsonb_build_object(
      'key','onboarding_bottleneck',
      'severity','red',
      'title','Onboarding Bottleneck',
      'body', v_phase_count||' pro(s) stuck at "'||v_worst_phase||'" — possible systemic issue',
      'count', v_phase_count,
      'cta_label','View Funnel',
      'cta_href','/dashboard/admin/insights/onboarding-funnel'
    );
  END IF;

  -- General stuck onboarding (yellow, all phases combined)
  SELECT count(*) INTO v_count FROM public.professional_profiles WHERE onboarding_phase NOT IN ('complete','not_started') AND updated_at < now()-interval '6 hours';
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','stuck_onboarding','severity','yellow','title','Stuck Onboarding','body',v_count||' pro(s) stuck in onboarding for 6+ hours','count',v_count,'cta_label','View Funnel','cta_href','/dashboard/admin/insights/onboarding-funnel');
  END IF;

  -- New signups (24h)
  SELECT count(*) INTO v_count FROM public.profiles WHERE created_at >= now()-interval '24 hours';
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','new_signups_24h','severity','blue','title','New Signups','body',v_count||' new user(s) in the last 24 hours','count',v_count,'cta_label','View Users','cta_href','/dashboard/admin/insights/new_users');
  END IF;

  -- New professionals (24h)
  SELECT count(*) INTO v_count FROM public.professional_profiles WHERE created_at >= now()-interval '24 hours';
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','new_pros_24h','severity','blue','title','New Professionals','body',v_count||' new pro(s) signed up in the last 24 hours','count',v_count,'cta_label','View Pros','cta_href','/dashboard/admin/insights/new_pros');
  END IF;

  RETURN v_alerts;
END;
$$;