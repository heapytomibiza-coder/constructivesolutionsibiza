
CREATE OR REPLACE FUNCTION public.get_agent_performance_metrics(
  p_since timestamptz DEFAULT (now() - interval '30 days'),
  p_until timestamptz DEFAULT now()
)
RETURNS TABLE (
  agent_name text,
  triggered bigint,
  succeeded bigint,
  failed bigint,
  accepted bigint,
  dismissed bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    agent_name,
    sum(CASE WHEN action = 'triggered' THEN 1 ELSE 0 END) AS triggered,
    sum(CASE WHEN action = 'success' THEN 1 ELSE 0 END) AS succeeded,
    sum(CASE WHEN action = 'failed' THEN 1 ELSE 0 END) AS failed,
    sum(CASE WHEN action = 'accepted' THEN 1 ELSE 0 END) AS accepted,
    sum(CASE WHEN action = 'dismissed' THEN 1 ELSE 0 END) AS dismissed
  FROM (
    SELECT
      CASE
        WHEN event_name LIKE 'agent_quote_coach_%' THEN 'quote_coach'
        WHEN event_name LIKE 'agent_budget_suggestion_%' THEN 'budget_suggestion'
        WHEN event_name LIKE 'agent_classifier_%' THEN 'classifier'
        WHEN event_name LIKE 'agent_job_content_%' THEN 'job_content'
        ELSE 'unknown'
      END AS agent_name,
      CASE
        WHEN event_name LIKE '%_triggered' THEN 'triggered'
        WHEN event_name LIKE '%_success' THEN 'success'
        WHEN event_name LIKE '%_failed' THEN 'failed'
        WHEN event_name LIKE '%_accepted' THEN 'accepted'
        WHEN event_name LIKE '%_dismissed' THEN 'dismissed'
        WHEN event_name LIKE '%_shown' THEN 'triggered'
        ELSE 'other'
      END AS action
    FROM analytics_events
    WHERE event_name LIKE 'agent_%'
      AND created_at >= p_since
      AND created_at < p_until
  ) sub
  WHERE agent_name != 'unknown'
  GROUP BY agent_name
  ORDER BY triggered DESC;
$$;
