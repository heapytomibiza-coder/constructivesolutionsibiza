
-- =============================================
-- PHASE 1: Analytics Foundation
-- =============================================

-- 1a. Analytics Events Table
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  role text NOT NULL DEFAULT 'client',
  event_name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Admin can read all events
CREATE POLICY "Admins can read analytics events"
  ON public.analytics_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- No direct inserts — use track_event() RPC
CREATE INDEX idx_analytics_events_name_created ON public.analytics_events (event_name, created_at);
CREATE INDEX idx_analytics_events_user_created ON public.analytics_events (user_id, created_at);

-- 1b. track_event() RPC — any authenticated user can track events
CREATE OR REPLACE FUNCTION public.track_event(
  p_event_name text,
  p_role text DEFAULT 'client',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.analytics_events (user_id, role, event_name, metadata)
  VALUES (auth.uid(), p_role, p_event_name, p_metadata);
END;
$$;

-- 1c. Performance indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_jobs_status_listed_created ON public.jobs (status, is_publicly_listed, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_area_category_created ON public.jobs (area, category, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON public.conversations (created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON public.messages (sender_id, created_at);
CREATE INDEX IF NOT EXISTS idx_professional_services_user_micro ON public.professional_services (user_id, micro_id);

-- 1d. admin_metric_timeseries RPC
CREATE OR REPLACE FUNCTION public.admin_metric_timeseries(
  p_metric_key text,
  p_from_ts timestamptz,
  p_to_ts timestamptz,
  p_bucket text DEFAULT 'day',
  p_area_filter text DEFAULT NULL,
  p_category_filter text DEFAULT NULL
)
RETURNS TABLE(bucket_start timestamptz, value bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_interval interval;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_bucket = 'hour' THEN v_interval := '1 hour'::interval;
  ELSE v_interval := '1 day'::interval;
  END IF;

  IF p_metric_key = 'jobs_posted' THEN
    RETURN QUERY
      SELECT date_trunc(p_bucket, j.created_at) AS bucket_start, count(*)::bigint AS value
      FROM public.jobs j
      WHERE j.created_at BETWEEN p_from_ts AND p_to_ts
        AND j.status = 'open' AND j.is_publicly_listed = true
        AND (p_area_filter IS NULL OR j.area = p_area_filter)
        AND (p_category_filter IS NULL OR j.category = p_category_filter)
      GROUP BY 1 ORDER BY 1;

  ELSIF p_metric_key = 'open_jobs' THEN
    RETURN QUERY
      SELECT date_trunc(p_bucket, j.created_at) AS bucket_start, count(*)::bigint AS value
      FROM public.jobs j
      WHERE j.created_at BETWEEN p_from_ts AND p_to_ts
        AND j.status = 'open' AND j.is_publicly_listed = true
        AND (p_area_filter IS NULL OR j.area = p_area_filter)
        AND (p_category_filter IS NULL OR j.category = p_category_filter)
      GROUP BY 1 ORDER BY 1;

  ELSIF p_metric_key = 'completed_jobs' THEN
    RETURN QUERY
      SELECT date_trunc(p_bucket, j.completed_at) AS bucket_start, count(*)::bigint AS value
      FROM public.jobs j
      WHERE j.completed_at BETWEEN p_from_ts AND p_to_ts
        AND j.status = 'completed'
        AND (p_area_filter IS NULL OR j.area = p_area_filter)
        AND (p_category_filter IS NULL OR j.category = p_category_filter)
      GROUP BY 1 ORDER BY 1;

  ELSIF p_metric_key = 'new_users' THEN
    RETURN QUERY
      SELECT date_trunc(p_bucket, p.created_at) AS bucket_start, count(*)::bigint AS value
      FROM public.profiles p
      WHERE p.created_at BETWEEN p_from_ts AND p_to_ts
      GROUP BY 1 ORDER BY 1;

  ELSIF p_metric_key = 'new_pros' THEN
    RETURN QUERY
      SELECT date_trunc(p_bucket, pp.created_at) AS bucket_start, count(*)::bigint AS value
      FROM public.professional_profiles pp
      WHERE pp.created_at BETWEEN p_from_ts AND p_to_ts
      GROUP BY 1 ORDER BY 1;

  ELSIF p_metric_key = 'conversations' THEN
    RETURN QUERY
      SELECT date_trunc(p_bucket, c.created_at) AS bucket_start, count(*)::bigint AS value
      FROM public.conversations c
      WHERE c.created_at BETWEEN p_from_ts AND p_to_ts
      GROUP BY 1 ORDER BY 1;

  ELSIF p_metric_key = 'support_tickets' THEN
    RETURN QUERY
      SELECT date_trunc(p_bucket, sr.created_at) AS bucket_start, count(*)::bigint AS value
      FROM public.support_requests sr
      WHERE sr.created_at BETWEEN p_from_ts AND p_to_ts
      GROUP BY 1 ORDER BY 1;

  ELSIF p_metric_key = 'active_jobs' THEN
    RETURN QUERY
      SELECT date_trunc(p_bucket, j.created_at) AS bucket_start, count(*)::bigint AS value
      FROM public.jobs j
      WHERE j.created_at BETWEEN p_from_ts AND p_to_ts
        AND j.status = 'active'
        AND (p_area_filter IS NULL OR j.area = p_area_filter)
        AND (p_category_filter IS NULL OR j.category = p_category_filter)
      GROUP BY 1 ORDER BY 1;

  ELSIF p_metric_key = 'messages_sent' THEN
    RETURN QUERY
      SELECT date_trunc(p_bucket, m.created_at) AS bucket_start, count(*)::bigint AS value
      FROM public.messages m
      WHERE m.created_at BETWEEN p_from_ts AND p_to_ts
        AND m.message_type = 'user'
      GROUP BY 1 ORDER BY 1;

  ELSE
    RAISE EXCEPTION 'Unknown metric_key: %', p_metric_key;
  END IF;
END;
$$;

-- 1e. admin_metric_drilldown RPC
CREATE OR REPLACE FUNCTION public.admin_metric_drilldown(
  p_metric_key text,
  p_from_ts timestamptz,
  p_to_ts timestamptz,
  p_area_filter text DEFAULT NULL,
  p_category_filter text DEFAULT NULL,
  p_limit_n int DEFAULT 50,
  p_offset_n int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_metric_key IN ('jobs_posted', 'open_jobs') THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result
    FROM (
      SELECT j.id, j.title, j.category, j.subcategory, j.area, j.status,
             j.budget_type, j.budget_value, j.budget_min, j.budget_max,
             j.start_timing, j.created_at
      FROM public.jobs j
      WHERE j.created_at BETWEEN p_from_ts AND p_to_ts
        AND j.status = 'open' AND j.is_publicly_listed = true
        AND (p_area_filter IS NULL OR j.area = p_area_filter)
        AND (p_category_filter IS NULL OR j.category = p_category_filter)
      ORDER BY j.created_at DESC
      LIMIT p_limit_n OFFSET p_offset_n
    ) r;

  ELSIF p_metric_key = 'completed_jobs' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result
    FROM (
      SELECT j.id, j.title, j.category, j.subcategory, j.area, j.status,
             j.budget_type, j.budget_value, j.completed_at, j.created_at
      FROM public.jobs j
      WHERE j.completed_at BETWEEN p_from_ts AND p_to_ts
        AND j.status = 'completed'
        AND (p_area_filter IS NULL OR j.area = p_area_filter)
        AND (p_category_filter IS NULL OR j.category = p_category_filter)
      ORDER BY j.completed_at DESC
      LIMIT p_limit_n OFFSET p_offset_n
    ) r;

  ELSIF p_metric_key = 'active_jobs' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result
    FROM (
      SELECT j.id, j.title, j.category, j.subcategory, j.area, j.status,
             j.budget_type, j.budget_value, j.created_at
      FROM public.jobs j
      WHERE j.created_at BETWEEN p_from_ts AND p_to_ts
        AND j.status = 'active'
        AND (p_area_filter IS NULL OR j.area = p_area_filter)
        AND (p_category_filter IS NULL OR j.category = p_category_filter)
      ORDER BY j.created_at DESC
      LIMIT p_limit_n OFFSET p_offset_n
    ) r;

  ELSIF p_metric_key = 'new_users' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result
    FROM (
      SELECT p.user_id AS id, p.display_name, p.phone, p.created_at,
             ur.roles, ur.active_role
      FROM public.profiles p
      LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
      WHERE p.created_at BETWEEN p_from_ts AND p_to_ts
      ORDER BY p.created_at DESC
      LIMIT p_limit_n OFFSET p_offset_n
    ) r;

  ELSIF p_metric_key = 'new_pros' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result
    FROM (
      SELECT pp.user_id AS id, pp.display_name, pp.business_name,
             pp.verification_status, pp.onboarding_phase, pp.services_count,
             pp.created_at
      FROM public.professional_profiles pp
      WHERE pp.created_at BETWEEN p_from_ts AND p_to_ts
      ORDER BY pp.created_at DESC
      LIMIT p_limit_n OFFSET p_offset_n
    ) r;

  ELSIF p_metric_key = 'conversations' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result
    FROM (
      SELECT c.id, c.job_id, c.client_id, c.pro_id,
             c.last_message_preview, c.last_message_at, c.created_at
      FROM public.conversations c
      WHERE c.created_at BETWEEN p_from_ts AND p_to_ts
      ORDER BY c.created_at DESC
      LIMIT p_limit_n OFFSET p_offset_n
    ) r;

  ELSIF p_metric_key = 'support_tickets' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result
    FROM (
      SELECT sr.id, sr.ticket_number, sr.issue_type, sr.priority,
             sr.status, sr.summary, sr.created_at
      FROM public.support_requests sr
      WHERE sr.created_at BETWEEN p_from_ts AND p_to_ts
      ORDER BY sr.created_at DESC
      LIMIT p_limit_n OFFSET p_offset_n
    ) r;

  ELSIF p_metric_key = 'messages_sent' THEN
    SELECT jsonb_agg(row_to_json(r)) INTO v_result
    FROM (
      SELECT m.id, m.conversation_id, m.sender_id, m.message_type,
             left(m.body, 140) AS body_preview, m.created_at
      FROM public.messages m
      WHERE m.created_at BETWEEN p_from_ts AND p_to_ts
        AND m.message_type = 'user'
      ORDER BY m.created_at DESC
      LIMIT p_limit_n OFFSET p_offset_n
    ) r;

  ELSE
    RAISE EXCEPTION 'Unknown metric_key: %', p_metric_key;
  END IF;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 1f. admin_market_gap RPC
CREATE OR REPLACE FUNCTION public.admin_market_gap(
  p_from_ts timestamptz DEFAULT now() - interval '30 days',
  p_to_ts timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT
      d.area,
      d.category,
      COALESCE(d.demand_count, 0) AS demand_count,
      COALESCE(d.total_budget, 0) AS total_budget,
      COALESCE(s.supply_count, 0) AS supply_count,
      CASE
        WHEN COALESCE(s.supply_count, 0) = 0 AND COALESCE(d.demand_count, 0) > 0 THEN 1.0
        WHEN COALESCE(d.demand_count, 0) = 0 THEN 0.0
        ELSE ROUND(
          GREATEST(0, LEAST(1,
            (d.demand_count::numeric / NULLIF(GREATEST(d.demand_count, s.supply_count), 0))
            - (s.supply_count::numeric / NULLIF(GREATEST(d.demand_count, s.supply_count), 0))
            + 0.5
          )), 2)
      END AS gap_score
    FROM (
      SELECT j.area, j.category, count(*) AS demand_count,
             COALESCE(sum(j.budget_value), 0) AS total_budget
      FROM public.jobs j
      WHERE j.created_at BETWEEN p_from_ts AND p_to_ts
        AND j.is_publicly_listed = true
        AND j.area IS NOT NULL AND j.category IS NOT NULL
      GROUP BY j.area, j.category
    ) d
    LEFT JOIN (
      SELECT
        UNNEST(pp.service_zones) AS area,
        sc.slug AS category,
        count(DISTINCT ps.user_id) AS supply_count
      FROM public.professional_services ps
      JOIN public.service_micro_categories smc ON smc.id = ps.micro_id
      JOIN public.service_subcategories ss ON ss.id = smc.subcategory_id
      JOIN public.service_categories sc ON sc.id = ss.category_id
      JOIN public.professional_profiles pp ON pp.user_id = ps.user_id
        AND pp.is_publicly_listed = true
      WHERE ps.status = 'offered'
      GROUP BY UNNEST(pp.service_zones), sc.slug
    ) s ON s.area = d.area AND s.category = d.category
    ORDER BY gap_score DESC, d.demand_count DESC
  ) r;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
