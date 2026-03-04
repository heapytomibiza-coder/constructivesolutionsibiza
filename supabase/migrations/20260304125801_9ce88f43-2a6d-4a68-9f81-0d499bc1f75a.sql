
CREATE OR REPLACE FUNCTION public.admin_messaging_pulse(
  p_from_ts timestamptz DEFAULT now() - interval '30 days',
  p_to_ts timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  WITH
  -- Messages in period
  period_messages AS (
    SELECT m.id, m.conversation_id, m.sender_id, m.created_at, m.message_type,
           c.client_id, c.pro_id, c.job_id
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE m.created_at BETWEEN p_from_ts AND p_to_ts
      AND m.message_type = 'user'
  ),
  -- Daily message volume
  daily_volume AS (
    SELECT date_trunc('day', created_at)::date AS day,
           count(*) AS total,
           count(*) FILTER (WHERE sender_id = client_id) AS from_clients,
           count(*) FILTER (WHERE sender_id = pro_id) AS from_pros
    FROM period_messages
    GROUP BY 1
    ORDER BY 1
  ),
  -- First pro reply per conversation (response time)
  first_pro_reply AS (
    SELECT c.id AS conversation_id,
           c.created_at AS convo_created,
           c.job_id,
           min(m.created_at) FILTER (WHERE m.sender_id = c.pro_id) AS first_pro_msg,
           min(m.created_at) FILTER (WHERE m.sender_id = c.client_id) AS first_client_msg
    FROM public.conversations c
    LEFT JOIN public.messages m ON m.conversation_id = c.id AND m.message_type = 'user'
    WHERE c.created_at BETWEEN p_from_ts AND p_to_ts
    GROUP BY c.id, c.created_at, c.job_id
  ),
  response_stats AS (
    SELECT
      count(*) AS total_convos,
      count(first_pro_msg) AS convos_with_pro_reply,
      count(*) FILTER (WHERE first_pro_msg IS NULL) AS convos_no_pro_reply,
      ROUND(AVG(EXTRACT(EPOCH FROM (first_pro_msg - convo_created)) / 60)::numeric, 1) AS avg_response_minutes,
      ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_pro_msg - convo_created)) / 60))::numeric, 1) AS median_response_minutes,
      ROUND(MIN(EXTRACT(EPOCH FROM (first_pro_msg - convo_created)) / 60)::numeric, 1) AS min_response_minutes,
      ROUND(MAX(EXTRACT(EPOCH FROM (first_pro_msg - convo_created)) / 60)::numeric, 1) AS max_response_minutes,
      count(*) FILTER (WHERE first_pro_msg IS NOT NULL AND EXTRACT(EPOCH FROM (first_pro_msg - convo_created)) / 60 <= 30) AS replied_within_30m,
      count(*) FILTER (WHERE first_pro_msg IS NOT NULL AND EXTRACT(EPOCH FROM (first_pro_msg - convo_created)) / 60 <= 60) AS replied_within_1h,
      count(*) FILTER (WHERE first_pro_msg IS NOT NULL AND EXTRACT(EPOCH FROM (first_pro_msg - convo_created)) / 60 <= 240) AS replied_within_4h
    FROM first_pro_reply
    WHERE first_pro_msg IS NOT NULL OR first_client_msg IS NOT NULL
  ),
  -- Stale conversations: last message > 48h ago, not completed
  stale_convos AS (
    SELECT c.id, c.job_id, c.last_message_at, c.last_message_preview,
           j.title AS job_title, j.category, j.area, j.status AS job_status,
           pp.display_name AS pro_name,
           ROUND(EXTRACT(EPOCH FROM (now() - c.last_message_at)) / 3600, 1) AS hours_silent
    FROM public.conversations c
    JOIN public.jobs j ON j.id = c.job_id
    LEFT JOIN public.professional_profiles pp ON pp.user_id = c.pro_id
    WHERE c.last_message_at IS NOT NULL
      AND c.last_message_at < now() - interval '48 hours'
      AND j.status IN ('open', 'active')
    ORDER BY c.last_message_at ASC
    LIMIT 20
  ),
  -- Top active conversations (most messages in period)
  active_convos AS (
    SELECT pm.conversation_id, count(*) AS msg_count,
           max(pm.created_at) AS last_msg_at,
           j.title AS job_title, j.category,
           pp.display_name AS pro_name,
           prof.display_name AS client_name
    FROM period_messages pm
    JOIN public.conversations c ON c.id = pm.conversation_id
    JOIN public.jobs j ON j.id = c.job_id
    LEFT JOIN public.professional_profiles pp ON pp.user_id = c.pro_id
    LEFT JOIN public.profiles prof ON prof.user_id = c.client_id
    GROUP BY pm.conversation_id, j.title, j.category, pp.display_name, prof.display_name
    ORDER BY count(*) DESC
    LIMIT 10
  ),
  -- Summary stats
  summary AS (
    SELECT
      (SELECT count(*) FROM period_messages) AS total_messages,
      (SELECT count(DISTINCT conversation_id) FROM period_messages) AS active_conversations,
      (SELECT count(DISTINCT sender_id) FROM period_messages) AS unique_senders,
      (SELECT count(DISTINCT sender_id) FROM period_messages WHERE sender_id = pro_id) AS unique_pros_messaging,
      (SELECT count(DISTINCT sender_id) FROM period_messages WHERE sender_id = client_id) AS unique_clients_messaging
  )
  SELECT jsonb_build_object(
    'summary', (SELECT row_to_json(s) FROM summary s),
    'response_times', (SELECT row_to_json(rs) FROM response_stats rs),
    'daily_volume', COALESCE((SELECT jsonb_agg(row_to_json(dv)) FROM daily_volume dv), '[]'::jsonb),
    'stale_conversations', COALESCE((SELECT jsonb_agg(row_to_json(sc)) FROM stale_convos sc), '[]'::jsonb),
    'most_active', COALESCE((SELECT jsonb_agg(row_to_json(ac)) FROM active_convos ac), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
