
-- ============================================================
-- ADMIN EMAIL ALLOWLIST - Two-Layer Security Hardening
-- ============================================================

-- 1. Create admin_allowlist table
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read allowlist"
ON public.admin_allowlist FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- No INSERT/UPDATE/DELETE policies = no one can modify via API

-- 2. Seed allowed emails
INSERT INTO public.admin_allowlist (email) VALUES
  ('heapytomibiza@gmail.com'),
  ('constructivesolutionsibiza@gmail.com'),
  ('heapymagic@googlemail.com')
ON CONFLICT (email) DO NOTHING;

-- 3. Create is_admin_email() function
CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_allowlist
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ============================================================
-- 4. Update ALL admin RLS policies to require is_admin_email()
-- ============================================================

-- admin_actions_log
DROP POLICY IF EXISTS "Admins can read action logs" ON public.admin_actions_log;
CREATE POLICY "Admins can read action logs" ON public.admin_actions_log
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

DROP POLICY IF EXISTS "Admins can insert action logs" ON public.admin_actions_log;
CREATE POLICY "Admins can insert action logs" ON public.admin_actions_log
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email() AND admin_user_id = auth.uid());

-- analytics_events
DROP POLICY IF EXISTS "Admins can read analytics events" ON public.analytics_events;
CREATE POLICY "Admins can read analytics events" ON public.analytics_events
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- attribution_sessions
DROP POLICY IF EXISTS "Admins can read attribution sessions" ON public.attribution_sessions;
CREATE POLICY "Admins can read attribution sessions" ON public.attribution_sessions
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- conversation_participants
DROP POLICY IF EXISTS "Admins can insert participants" ON public.conversation_participants;
CREATE POLICY "Admins can insert participants" ON public.conversation_participants
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

DROP POLICY IF EXISTS "Admins can update participants" ON public.conversation_participants;
CREATE POLICY "Admins can update participants" ON public.conversation_participants
FOR UPDATE USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email())
WITH CHECK (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

DROP POLICY IF EXISTS "Admins can view all participants" ON public.conversation_participants;
CREATE POLICY "Admins can view all participants" ON public.conversation_participants
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- conversations
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
CREATE POLICY "Admins can view all conversations" ON public.conversations
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- email_notifications_queue
DROP POLICY IF EXISTS "Admins can view email notification queue" ON public.email_notifications_queue;
CREATE POLICY "Admins can view email notification queue" ON public.email_notifications_queue
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- forum_posts
DROP POLICY IF EXISTS "Admins can delete any forum post" ON public.forum_posts;
CREATE POLICY "Admins can delete any forum post" ON public.forum_posts
FOR DELETE USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

DROP POLICY IF EXISTS "Admins can read all forum posts" ON public.forum_posts;
CREATE POLICY "Admins can read all forum posts" ON public.forum_posts
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- forum_replies
DROP POLICY IF EXISTS "Admins can delete any forum reply" ON public.forum_replies;
CREATE POLICY "Admins can delete any forum reply" ON public.forum_replies
FOR DELETE USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

DROP POLICY IF EXISTS "Admins can read all forum replies" ON public.forum_replies;
CREATE POLICY "Admins can read all forum replies" ON public.forum_replies
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- job_notifications_queue
DROP POLICY IF EXISTS "Admins can view notification queue" ON public.job_notifications_queue;
CREATE POLICY "Admins can view notification queue" ON public.job_notifications_queue
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- job_status_history
DROP POLICY IF EXISTS "job_history_admin_select" ON public.job_status_history;
CREATE POLICY "job_history_admin_select" ON public.job_status_history
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- jobs
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
CREATE POLICY "Admins can view all jobs" ON public.jobs
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- messages (complex policy with multiple OR branches)
DROP POLICY IF EXISTS "Support can read messages for escalated conversations" ON public.messages;
CREATE POLICY "Support can read messages for escalated conversations" ON public.messages
FOR SELECT USING (
  (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email())
  OR (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email() AND EXISTS (
    SELECT 1 FROM support_requests sr
    WHERE sr.conversation_id = messages.conversation_id
      AND sr.assigned_to = auth.uid()
      AND sr.status <> 'closed'
  ))
  OR (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email() AND EXISTS (
    SELECT 1 FROM support_requests sr
    WHERE sr.conversation_id = messages.conversation_id
      AND sr.assigned_to IS NULL
      AND sr.status IN ('open', 'triage')
  ))
  OR EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
  )
);

-- professional_documents
DROP POLICY IF EXISTS "Admins can read all professional documents" ON public.professional_documents;
CREATE POLICY "Admins can read all professional documents" ON public.professional_documents
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

DROP POLICY IF EXISTS "Admins can update document verification" ON public.professional_documents;
CREATE POLICY "Admins can update document verification" ON public.professional_documents
FOR UPDATE USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email())
WITH CHECK (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- professional_profiles
DROP POLICY IF EXISTS "Admins can read all professional profiles" ON public.professional_profiles;
CREATE POLICY "Admins can read all professional profiles" ON public.professional_profiles
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

DROP POLICY IF EXISTS "Admins can update professional verification" ON public.professional_profiles;
CREATE POLICY "Admins can update professional verification" ON public.professional_profiles
FOR UPDATE USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email())
WITH CHECK (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- service_listings
DROP POLICY IF EXISTS "Admins can view all listings" ON public.service_listings;
CREATE POLICY "Admins can view all listings" ON public.service_listings
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- service_views
DROP POLICY IF EXISTS "Admins can view all service views" ON public.service_views;
CREATE POLICY "Admins can view all service views" ON public.service_views
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- support_request_events
DROP POLICY IF EXISTS "Admins can insert support request events" ON public.support_request_events;
CREATE POLICY "Admins can insert support request events" ON public.support_request_events
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

DROP POLICY IF EXISTS "Admins can view all support request events" ON public.support_request_events;
CREATE POLICY "Admins can view all support request events" ON public.support_request_events
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- support_requests
DROP POLICY IF EXISTS "Admins can update support requests" ON public.support_requests;
CREATE POLICY "Admins can update support requests" ON public.support_requests
FOR UPDATE USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email())
WITH CHECK (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

DROP POLICY IF EXISTS "Admins can view all support requests" ON public.support_requests;
CREATE POLICY "Admins can view all support requests" ON public.support_requests
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- user_roles
DROP POLICY IF EXISTS "Admins can read all user roles" ON public.user_roles;
CREATE POLICY "Admins can read all user roles" ON public.user_roles
FOR SELECT USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

DROP POLICY IF EXISTS "Admins can update user suspension" ON public.user_roles;
CREATE POLICY "Admins can update user suspension" ON public.user_roles
FOR UPDATE USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email())
WITH CHECK (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- storage.objects (professional-documents bucket)
DROP POLICY IF EXISTS "Admins can view professional documents" ON storage.objects;
CREATE POLICY "Admins can view professional documents" ON storage.objects
FOR SELECT USING (bucket_id = 'professional-documents' AND has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());

-- ============================================================
-- 5. Update ALL admin RPC functions to require is_admin_email()
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_health_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending_emails int;
  v_failed_emails int;
  v_oldest_pending_min numeric;
  v_jobs_posted_today int;
  v_active_users_24h int;
  v_active_users_7d int;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT count(*) INTO v_pending_emails FROM public.email_notifications_queue WHERE sent_at IS NULL AND attempts < 3;
  SELECT count(*) INTO v_failed_emails FROM public.email_notifications_queue WHERE sent_at IS NULL AND attempts >= 3;
  SELECT coalesce(floor(extract(epoch FROM (now() - min(created_at)))/60), 0) INTO v_oldest_pending_min FROM public.email_notifications_queue WHERE sent_at IS NULL AND attempts < 3;
  SELECT count(*) INTO v_jobs_posted_today FROM public.jobs WHERE status = 'open' AND is_publicly_listed = true AND created_at >= date_trunc('day', now());
  SELECT count(DISTINCT sender_id) INTO v_active_users_24h FROM public.messages WHERE created_at >= now() - interval '24 hours';
  SELECT count(DISTINCT sender_id) INTO v_active_users_7d FROM public.messages WHERE created_at >= now() - interval '7 days';

  RETURN jsonb_build_object(
    'emails', jsonb_build_object('pending', v_pending_emails, 'failed', v_failed_emails, 'oldest_pending_minutes', v_oldest_pending_min),
    'jobs', jsonb_build_object('posted_today', v_jobs_posted_today),
    'users', jsonb_build_object('active_24h', v_active_users_24h, 'active_7d', v_active_users_7d)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_operator_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alerts jsonb := '[]'::jsonb;
  v_count int;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT count(*) INTO v_count FROM public.email_notifications_queue WHERE sent_at IS NULL AND attempts >= 3;
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','failed_emails','severity','red','title','Failed Emails','body',v_count||' email(s) failed after max retries','count',v_count,'cta_label','View Health','cta_href','/dashboard/admin?tab=health');
  END IF;

  SELECT count(*) INTO v_count FROM public.support_requests WHERE priority = 'high' AND status IN ('open','triage');
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','high_priority_tickets','severity','red','title','High-Priority Tickets','body',v_count||' urgent ticket(s) need attention','count',v_count,'cta_label','View Support','cta_href','/dashboard/admin?tab=support');
  END IF;

  SELECT count(*) INTO v_count FROM public.jobs j WHERE j.status='open' AND j.is_publicly_listed=true AND NOT EXISTS(SELECT 1 FROM public.conversations c WHERE c.job_id=j.id) AND EXTRACT(EPOCH FROM(now()-j.created_at))/3600>=6;
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','unanswered_jobs','severity','red','title','Unanswered Jobs','body',v_count||' job(s) with no response for 6+ hours','count',v_count,'cta_label','View Unanswered','cta_href','/dashboard/admin/insights/unanswered-jobs');
  END IF;

  SELECT count(*) INTO v_count FROM public.support_requests WHERE status IN ('open','triage');
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','open_tickets','severity','yellow','title','Open Tickets','body',v_count||' ticket(s) awaiting resolution','count',v_count,'cta_label','View Support','cta_href','/dashboard/admin?tab=support');
  END IF;

  SELECT count(*) INTO v_count FROM public.professional_profiles WHERE onboarding_phase NOT IN ('complete','not_started') AND updated_at < now()-interval '6 hours';
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','stuck_onboarding','severity','yellow','title','Stuck Onboarding','body',v_count||' pro(s) stuck in onboarding for 6+ hours','count',v_count,'cta_label','View Users','cta_href','/dashboard/admin?tab=users');
  END IF;

  SELECT count(*) INTO v_count FROM public.profiles WHERE created_at >= now()-interval '24 hours';
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','new_signups_24h','severity','blue','title','New Signups','body',v_count||' new user(s) in the last 24 hours','count',v_count,'cta_label','View Users','cta_href','/dashboard/admin/insights/new_users');
  END IF;

  SELECT count(*) INTO v_count FROM public.professional_profiles WHERE created_at >= now()-interval '24 hours';
  IF v_count > 0 THEN
    v_alerts := v_alerts || jsonb_build_object('key','new_pros_24h','severity','blue','title','New Professionals','body',v_count||' new pro(s) signed up in the last 24 hours','count',v_count,'cta_label','View Pros','cta_href','/dashboard/admin/insights/new_pros');
  END IF;

  RETURN v_alerts;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_metric_drilldown(p_metric_key text, p_from_ts timestamptz, p_to_ts timestamptz, p_area_filter text DEFAULT NULL, p_category_filter text DEFAULT NULL, p_limit_n int DEFAULT 50, p_offset_n int DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_metric_key IN ('jobs_posted','open_jobs') THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (SELECT j.id,j.title,j.category,j.subcategory,j.area,j.status,j.budget_type,j.budget_value,j.budget_min,j.budget_max,j.start_timing,j.created_at FROM public.jobs j WHERE j.created_at BETWEEN p_from_ts AND p_to_ts AND j.status='open' AND j.is_publicly_listed=true AND (p_area_filter IS NULL OR j.area=p_area_filter) AND (p_category_filter IS NULL OR j.category=p_category_filter) ORDER BY j.created_at DESC LIMIT p_limit_n OFFSET p_offset_n) r;
  ELSIF p_metric_key = 'completed_jobs' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (SELECT j.id,j.title,j.category,j.subcategory,j.area,j.status,j.budget_type,j.budget_value,j.completed_at,j.created_at FROM public.jobs j WHERE j.completed_at BETWEEN p_from_ts AND p_to_ts AND j.status='completed' AND (p_area_filter IS NULL OR j.area=p_area_filter) AND (p_category_filter IS NULL OR j.category=p_category_filter) ORDER BY j.completed_at DESC LIMIT p_limit_n OFFSET p_offset_n) r;
  ELSIF p_metric_key = 'active_jobs' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (SELECT j.id,j.title,j.category,j.subcategory,j.area,j.status,j.budget_type,j.budget_value,j.created_at FROM public.jobs j WHERE j.created_at BETWEEN p_from_ts AND p_to_ts AND j.status='active' AND (p_area_filter IS NULL OR j.area=p_area_filter) AND (p_category_filter IS NULL OR j.category=p_category_filter) ORDER BY j.created_at DESC LIMIT p_limit_n OFFSET p_offset_n) r;
  ELSIF p_metric_key = 'new_users' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (SELECT p.user_id AS id,p.display_name,p.phone,p.created_at,ur.roles,ur.active_role FROM public.profiles p LEFT JOIN public.user_roles ur ON ur.user_id=p.user_id WHERE p.created_at BETWEEN p_from_ts AND p_to_ts ORDER BY p.created_at DESC LIMIT p_limit_n OFFSET p_offset_n) r;
  ELSIF p_metric_key = 'new_pros' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (SELECT pp.user_id AS id,pp.display_name,pp.business_name,pp.verification_status,pp.onboarding_phase,pp.services_count,pp.created_at FROM public.professional_profiles pp WHERE pp.created_at BETWEEN p_from_ts AND p_to_ts ORDER BY pp.created_at DESC LIMIT p_limit_n OFFSET p_offset_n) r;
  ELSIF p_metric_key = 'conversations' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (SELECT c.id,c.job_id,c.client_id,c.pro_id,c.last_message_preview,c.last_message_at,c.created_at FROM public.conversations c WHERE c.created_at BETWEEN p_from_ts AND p_to_ts ORDER BY c.created_at DESC LIMIT p_limit_n OFFSET p_offset_n) r;
  ELSIF p_metric_key = 'support_tickets' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (SELECT sr.id,sr.ticket_number,sr.issue_type,sr.priority,sr.status,sr.summary,sr.created_at FROM public.support_requests sr WHERE sr.created_at BETWEEN p_from_ts AND p_to_ts ORDER BY sr.created_at DESC LIMIT p_limit_n OFFSET p_offset_n) r;
  ELSIF p_metric_key = 'messages_sent' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result FROM (SELECT m.id,m.conversation_id,m.sender_id,m.message_type,left(m.body,140) AS body_preview,m.created_at FROM public.messages m WHERE m.created_at BETWEEN p_from_ts AND p_to_ts AND m.message_type='user' ORDER BY m.created_at DESC LIMIT p_limit_n OFFSET p_offset_n) r;
  ELSE
    RAISE EXCEPTION 'Unknown metric_key: %', p_metric_key;
  END IF;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_metric_timeseries(p_metric_key text, p_from_ts timestamptz, p_to_ts timestamptz, p_bucket text DEFAULT 'day', p_area_filter text DEFAULT NULL, p_category_filter text DEFAULT NULL)
RETURNS TABLE(bucket_start timestamptz, value bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_interval interval;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_bucket = 'hour' THEN v_interval := '1 hour'::interval;
  ELSE v_interval := '1 day'::interval;
  END IF;

  RETURN QUERY
  WITH buckets AS (SELECT generate_series(date_trunc(p_bucket,p_from_ts),date_trunc(p_bucket,p_to_ts),v_interval) AS bucket_start),
  raw_counts AS (
    SELECT * FROM (
      SELECT date_trunc(p_bucket,j.created_at) AS bs,count(*)::bigint AS cnt FROM public.jobs j WHERE p_metric_key IN ('jobs_posted','open_jobs') AND j.created_at BETWEEN p_from_ts AND p_to_ts AND j.status='open' AND j.is_publicly_listed=true AND (p_area_filter IS NULL OR j.area=p_area_filter) AND (p_category_filter IS NULL OR j.category=p_category_filter) GROUP BY 1
      UNION ALL
      SELECT date_trunc(p_bucket,j.completed_at) AS bs,count(*)::bigint AS cnt FROM public.jobs j WHERE p_metric_key='completed_jobs' AND j.completed_at BETWEEN p_from_ts AND p_to_ts AND j.status='completed' AND (p_area_filter IS NULL OR j.area=p_area_filter) AND (p_category_filter IS NULL OR j.category=p_category_filter) GROUP BY 1
      UNION ALL
      SELECT date_trunc(p_bucket,j.created_at) AS bs,count(*)::bigint AS cnt FROM public.jobs j WHERE p_metric_key='active_jobs' AND j.created_at BETWEEN p_from_ts AND p_to_ts AND j.status='active' AND (p_area_filter IS NULL OR j.area=p_area_filter) AND (p_category_filter IS NULL OR j.category=p_category_filter) GROUP BY 1
      UNION ALL
      SELECT date_trunc(p_bucket,p.created_at) AS bs,count(*)::bigint AS cnt FROM public.profiles p WHERE p_metric_key='new_users' AND p.created_at BETWEEN p_from_ts AND p_to_ts GROUP BY 1
      UNION ALL
      SELECT date_trunc(p_bucket,pp.created_at) AS bs,count(*)::bigint AS cnt FROM public.professional_profiles pp WHERE p_metric_key='new_pros' AND pp.created_at BETWEEN p_from_ts AND p_to_ts GROUP BY 1
      UNION ALL
      SELECT date_trunc(p_bucket,c.created_at) AS bs,count(*)::bigint AS cnt FROM public.conversations c WHERE p_metric_key='conversations' AND c.created_at BETWEEN p_from_ts AND p_to_ts GROUP BY 1
      UNION ALL
      SELECT date_trunc(p_bucket,sr.created_at) AS bs,count(*)::bigint AS cnt FROM public.support_requests sr WHERE p_metric_key='support_tickets' AND sr.created_at BETWEEN p_from_ts AND p_to_ts GROUP BY 1
      UNION ALL
      SELECT date_trunc(p_bucket,m.created_at) AS bs,count(*)::bigint AS cnt FROM public.messages m WHERE p_metric_key='messages_sent' AND m.created_at BETWEEN p_from_ts AND p_to_ts AND m.message_type='user' GROUP BY 1
    ) sub
  )
  SELECT b.bucket_start, COALESCE(rc.cnt,0)::bigint AS value
  FROM buckets b LEFT JOIN raw_counts rc ON rc.bs=b.bucket_start
  ORDER BY b.bucket_start;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_market_gap(p_from_ts timestamptz DEFAULT now()-interval '30 days', p_to_ts timestamptz DEFAULT now())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT d.area,d.category,COALESCE(d.demand_count,0) AS demand_count,COALESCE(d.total_budget,0) AS total_budget,COALESCE(s.supply_count,0) AS supply_count,
      CASE WHEN COALESCE(s.supply_count,0)=0 AND COALESCE(d.demand_count,0)>0 THEN 1.0
           WHEN COALESCE(d.demand_count,0)=0 THEN 0.0
           ELSE ROUND(GREATEST(0,LEAST(1,(d.demand_count::numeric/NULLIF(GREATEST(d.demand_count,s.supply_count),0))-(s.supply_count::numeric/NULLIF(GREATEST(d.demand_count,s.supply_count),0))+0.5)),2)
      END AS gap_score
    FROM (SELECT j.area,j.category,count(*) AS demand_count,COALESCE(sum(j.budget_value),0) AS total_budget FROM public.jobs j WHERE j.created_at BETWEEN p_from_ts AND p_to_ts AND j.is_publicly_listed=true AND j.area IS NOT NULL AND j.category IS NOT NULL GROUP BY j.area,j.category) d
    LEFT JOIN (SELECT UNNEST(pp.service_zones) AS area,sc.slug AS category,count(DISTINCT ps.user_id) AS supply_count FROM public.professional_services ps JOIN public.service_micro_categories smc ON smc.id=ps.micro_id JOIN public.service_subcategories ss ON ss.id=smc.subcategory_id JOIN public.service_categories sc ON sc.id=ss.category_id JOIN public.professional_profiles pp ON pp.user_id=ps.user_id AND pp.is_publicly_listed=true WHERE ps.status='offered' GROUP BY UNNEST(pp.service_zones),sc.slug) s ON s.area=d.area AND s.category=d.category
    ORDER BY gap_score DESC, d.demand_count DESC
  ) r;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_top_sources(p_from_ts timestamptz DEFAULT now()-interval '30 days', p_to_ts timestamptz DEFAULT now())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT COALESCE(a.ref,a.utm_source,'Direct') AS source,a.utm_medium,a.utm_campaign,count(*) AS sessions,count(DISTINCT a.user_id) FILTER (WHERE a.user_id IS NOT NULL) AS signups,count(DISTINCT j.id) AS jobs_posted,
      CASE WHEN count(*)>0 THEN ROUND(count(DISTINCT j.id)::numeric/count(*)*100,1) ELSE 0 END AS conversion_rate
    FROM public.attribution_sessions a LEFT JOIN public.jobs j ON j.attribution->>'session_id'=a.session_id AND j.created_at BETWEEN p_from_ts AND p_to_ts
    WHERE a.first_seen_at BETWEEN p_from_ts AND p_to_ts
    GROUP BY COALESCE(a.ref,a.utm_source,'Direct'),a.utm_medium,a.utm_campaign
    ORDER BY count(*) DESC LIMIT 100
  ) r;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_onboarding_funnel(p_from_ts timestamptz DEFAULT now()-interval '30 days', p_to_ts timestamptz DEFAULT now())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  WITH entered AS (SELECT user_id,metadata->>'step' AS step,created_at AS entered_at FROM public.analytics_events WHERE event_name='pro_onboarding_step_entered' AND created_at BETWEEN p_from_ts AND p_to_ts),
  completed AS (SELECT user_id,metadata->>'step' AS step,created_at AS completed_at FROM public.analytics_events WHERE event_name='pro_onboarding_step_completed' AND created_at BETWEEN p_from_ts AND p_to_ts),
  step_times AS (SELECT e.step,ROUND(AVG(EXTRACT(EPOCH FROM(c.completed_at-e.entered_at)))::numeric,1) AS avg_seconds,ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP(ORDER BY EXTRACT(EPOCH FROM(c.completed_at-e.entered_at)))::numeric,1) AS median_seconds,MIN(EXTRACT(EPOCH FROM(c.completed_at-e.entered_at)))::numeric AS min_seconds,MAX(EXTRACT(EPOCH FROM(c.completed_at-e.entered_at)))::numeric AS max_seconds,COUNT(*) AS paired_count FROM entered e JOIN completed c ON e.user_id=c.user_id AND e.step=c.step AND c.completed_at>e.entered_at AND c.completed_at<e.entered_at+interval '1 hour' GROUP BY e.step),
  drop_off AS (SELECT metadata->>'step' AS step,COUNT(*) FILTER(WHERE event_name='pro_onboarding_step_entered') AS entered,COUNT(*) FILTER(WHERE event_name='pro_onboarding_step_completed') AS completed FROM public.analytics_events WHERE event_name IN ('pro_onboarding_step_entered','pro_onboarding_step_completed') AND created_at BETWEEN p_from_ts AND p_to_ts GROUP BY metadata->>'step'),
  failures AS (SELECT metadata->>'step' AS step,COUNT(*) AS failure_count FROM public.analytics_events WHERE event_name='onboarding_step_failed' AND created_at BETWEEN p_from_ts AND p_to_ts GROUP BY metadata->>'step')
  SELECT jsonb_build_object(
    'steps',COALESCE((SELECT jsonb_agg(jsonb_build_object('step',d.step,'entered',d.entered,'completed',d.completed,'drop_off_count',d.entered-d.completed,'drop_off_rate',CASE WHEN d.entered>0 THEN ROUND((1-d.completed::numeric/d.entered)*100,1) ELSE 0 END,'avg_seconds',COALESCE(st.avg_seconds,0),'median_seconds',COALESCE(st.median_seconds,0),'min_seconds',COALESCE(st.min_seconds,0),'max_seconds',COALESCE(st.max_seconds,0),'failure_count',COALESCE(f.failure_count,0)) ORDER BY d.entered DESC) FROM drop_off d LEFT JOIN step_times st ON st.step=d.step LEFT JOIN failures f ON f.step=d.step),'[]'::jsonb),
    'total_started',COALESCE((SELECT COUNT(DISTINCT user_id) FROM public.analytics_events WHERE event_name='pro_onboarding_step_entered' AND created_at BETWEEN p_from_ts AND p_to_ts),0),
    'total_completed_all',COALESCE((SELECT COUNT(DISTINCT user_id) FROM public.analytics_events WHERE event_name='pro_onboarding_step_completed' AND metadata->>'step'='review' AND created_at BETWEEN p_from_ts AND p_to_ts),0)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unanswered_jobs(p_from_ts timestamptz DEFAULT now()-interval '30 days', p_to_ts timestamptz DEFAULT now(), p_hours_threshold int DEFAULT 6)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT j.id,j.title,j.category,j.area,j.budget_type,j.budget_value,j.created_at,ROUND(EXTRACT(EPOCH FROM(now()-j.created_at))/3600,1) AS hours_waiting,(SELECT count(*) FROM public.conversations c WHERE c.job_id=j.id) AS conversation_count
    FROM public.jobs j
    WHERE j.created_at BETWEEN p_from_ts AND p_to_ts AND j.status='open' AND j.is_publicly_listed=true AND NOT EXISTS(SELECT 1 FROM public.conversations c WHERE c.job_id=j.id) AND EXTRACT(EPOCH FROM(now()-j.created_at))/3600>=p_hours_threshold
    ORDER BY j.created_at ASC
  ) r;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_repeat_work(p_from_ts timestamptz DEFAULT now()-interval '90 days', p_to_ts timestamptz DEFAULT now())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'repeat_clients',(SELECT jsonb_agg(row_to_json(rc)) FROM (SELECT j.user_id AS client_id,p.display_name,count(*) AS total_jobs,count(*) FILTER(WHERE j.status='completed') AS completed_jobs,min(j.created_at) AS first_job_at,max(j.created_at) AS latest_job_at FROM public.jobs j LEFT JOIN public.profiles p ON p.user_id=j.user_id WHERE j.created_at BETWEEN p_from_ts AND p_to_ts AND j.is_publicly_listed=true GROUP BY j.user_id,p.display_name HAVING count(*)>=2 ORDER BY count(*) DESC LIMIT 50) rc),
    'rehired_pros',(SELECT jsonb_agg(row_to_json(rp)) FROM (SELECT j.assigned_professional_id AS pro_id,pp.display_name,pp.business_name,count(*) AS total_hired,count(DISTINCT j.user_id) AS unique_clients,count(*) FILTER(WHERE j.status='completed') AS completed,ROUND(count(*) FILTER(WHERE j.status='completed')::numeric/NULLIF(count(*),0),2) AS completion_ratio FROM public.jobs j JOIN public.professional_profiles pp ON pp.user_id=j.assigned_professional_id WHERE j.assigned_professional_id IS NOT NULL AND j.created_at BETWEEN p_from_ts AND p_to_ts GROUP BY j.assigned_professional_id,pp.display_name,pp.business_name HAVING count(*)>=2 ORDER BY count(*) DESC LIMIT 50) rp),
    'summary',jsonb_build_object(
      'total_repeat_clients',(SELECT count(*) FROM (SELECT j.user_id FROM public.jobs j WHERE j.created_at BETWEEN p_from_ts AND p_to_ts AND j.is_publicly_listed=true GROUP BY j.user_id HAVING count(*)>=2) x),
      'total_rehired_pros',(SELECT count(*) FROM (SELECT j.assigned_professional_id FROM public.jobs j WHERE j.assigned_professional_id IS NOT NULL AND j.created_at BETWEEN p_from_ts AND p_to_ts GROUP BY j.assigned_professional_id HAVING count(*)>=2) x),
      'total_clients_in_period',(SELECT count(DISTINCT j.user_id) FROM public.jobs j WHERE j.created_at BETWEEN p_from_ts AND p_to_ts AND j.is_publicly_listed=true),
      'total_active_pros_in_period',(SELECT count(DISTINCT j.assigned_professional_id) FROM public.jobs j WHERE j.assigned_professional_id IS NOT NULL AND j.created_at BETWEEN p_from_ts AND p_to_ts),
      'repeat_rate',(SELECT ROUND(count(*) FILTER(WHERE cnt>=2)::numeric/NULLIF(count(*),0),2) FROM (SELECT j.user_id,count(*) AS cnt FROM public.jobs j WHERE j.created_at BETWEEN p_from_ts AND p_to_ts AND j.is_publicly_listed=true GROUP BY j.user_id) x),
      'rehire_rate',(SELECT ROUND(count(*) FILTER(WHERE cnt>=2)::numeric/NULLIF(count(*),0),2) FROM (SELECT j.assigned_professional_id,count(*) AS cnt FROM public.jobs j WHERE j.assigned_professional_id IS NOT NULL AND j.created_at BETWEEN p_from_ts AND p_to_ts GROUP BY j.assigned_professional_id) x)
    )
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_no_pro_reply_jobs(p_from_ts timestamptz DEFAULT now()-interval '30 days', p_to_ts timestamptz DEFAULT now(), p_hours_threshold int DEFAULT 6)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT j.id,j.title,j.category,j.area,j.budget_type,j.budget_value,j.created_at,ROUND(EXTRACT(EPOCH FROM(now()-j.created_at))/3600,1) AS hours_waiting,(SELECT count(*) FROM public.conversations c WHERE c.job_id=j.id) AS conversation_count,0::bigint AS pro_message_count
    FROM public.jobs j
    WHERE j.created_at BETWEEN p_from_ts AND p_to_ts AND j.status='open' AND j.is_publicly_listed=true AND EXISTS(SELECT 1 FROM public.conversations c WHERE c.job_id=j.id) AND NOT EXISTS(SELECT 1 FROM public.conversations c JOIN public.messages m ON m.conversation_id=c.id AND m.sender_id=c.pro_id WHERE c.job_id=j.id) AND EXTRACT(EPOCH FROM(now()-j.created_at))/3600>=p_hours_threshold
    ORDER BY j.created_at ASC
  ) r;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
