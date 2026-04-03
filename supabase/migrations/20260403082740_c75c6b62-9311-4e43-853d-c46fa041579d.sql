
CREATE OR REPLACE FUNCTION public.get_quote_funnel_metrics()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH funnel AS (
    SELECT
      c.id AS conversation_id,
      c.pro_id,
      c.job_id,
      min(m.created_at) FILTER (WHERE m.message_type != 'system') AS first_msg_at,
      min(q.created_at) AS quote_at,
      (j.assigned_professional_id = c.pro_id) AS hired
    FROM conversations c
    JOIN jobs j ON j.id = c.job_id
    LEFT JOIN messages m ON m.conversation_id = c.id
    LEFT JOIN quotes q ON q.job_id = c.job_id
      AND q.professional_id = c.pro_id
      AND q.status IN ('submitted', 'revised', 'accepted')
    WHERE j.status NOT IN ('draft', 'cancelled')
      AND has_role(auth.uid(), 'admin') AND is_admin_email()
    GROUP BY c.id, c.pro_id, c.job_id, j.assigned_professional_id
  )
  SELECT jsonb_build_object(
    'no_quote_yet', count(*) FILTER (WHERE quote_at IS NULL AND first_msg_at IS NOT NULL),
    'quote_after_messaging', count(*) FILTER (WHERE quote_at IS NOT NULL AND first_msg_at IS NOT NULL),
    'avg_hours_to_quote', round(
      avg(EXTRACT(EPOCH FROM (quote_at - first_msg_at)) / 3600.0)
      FILTER (WHERE quote_at IS NOT NULL AND first_msg_at IS NOT NULL AND quote_at > first_msg_at),
      1
    ),
    'quote_no_hire', count(*) FILTER (WHERE quote_at IS NOT NULL AND NOT hired),
    'total_active_conversations', count(*) FILTER (WHERE first_msg_at IS NOT NULL)
  ) FROM funnel;
$$;
