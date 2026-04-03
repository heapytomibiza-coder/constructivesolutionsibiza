
CREATE OR REPLACE FUNCTION public.get_stalled_quote_journeys()
RETURNS TABLE (
  conversation_id uuid,
  job_id uuid,
  job_title text,
  pro_id uuid,
  pro_display_name text,
  stall_type text,
  hours_since_activity numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Conversations with 3+ non-system messages and no quote from this pro
  SELECT
    c.id AS conversation_id,
    c.job_id,
    j.title AS job_title,
    c.pro_id,
    pp.display_name AS pro_display_name,
    'no_quote'::text AS stall_type,
    ROUND(EXTRACT(EPOCH FROM (now() - COALESCE(c.last_message_at, c.created_at))) / 3600, 1) AS hours_since_activity
  FROM conversations c
  JOIN jobs j ON j.id = c.job_id
  LEFT JOIN professional_profiles pp ON pp.user_id = c.pro_id
  WHERE j.status IN ('open', 'in_progress')
    AND NOT EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.job_id = c.job_id
        AND q.professional_id = c.pro_id
    )
    AND (
      SELECT count(*) FROM messages m
      WHERE m.conversation_id = c.id
        AND m.message_type != 'system'
    ) >= 3

  UNION ALL

  -- Conversations with a submitted/revised quote but no hire after 48h
  SELECT
    c.id AS conversation_id,
    c.job_id,
    j.title AS job_title,
    c.pro_id,
    pp.display_name AS pro_display_name,
    'no_hire'::text AS stall_type,
    ROUND(EXTRACT(EPOCH FROM (now() - q_latest.created_at)) / 3600, 1) AS hours_since_activity
  FROM conversations c
  JOIN jobs j ON j.id = c.job_id
  LEFT JOIN professional_profiles pp ON pp.user_id = c.pro_id
  JOIN LATERAL (
    SELECT q.created_at
    FROM quotes q
    WHERE q.job_id = c.job_id
      AND q.professional_id = c.pro_id
      AND q.status IN ('submitted', 'revised')
    ORDER BY q.created_at DESC
    LIMIT 1
  ) q_latest ON true
  WHERE j.status = 'open'
    AND j.assigned_professional_id IS NULL
    AND q_latest.created_at < now() - interval '48 hours'

  ORDER BY hours_since_activity DESC
  LIMIT 50;
$$;
