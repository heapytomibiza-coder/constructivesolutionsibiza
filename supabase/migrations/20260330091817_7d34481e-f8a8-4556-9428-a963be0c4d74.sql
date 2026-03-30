
-- Expand get_pending_nudges() with pro_no_quote and review_reminder candidates
CREATE OR REPLACE FUNCTION public.get_pending_nudges()
RETURNS TABLE(nudge_type text, user_id uuid, job_id uuid, job_title text, pro_name text, quote_count bigint, user_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- draft_stale: jobs in draft created > 2h ago
  RETURN QUERY
  SELECT
    'draft_stale'::TEXT,
    j.user_id,
    j.id,
    j.title,
    NULL::TEXT,
    0::BIGINT,
    u.email
  FROM jobs j
  JOIN auth.users u ON u.id = j.user_id
  WHERE j.status = 'draft'
    AND j.created_at < now() - interval '2 hours'
    AND NOT EXISTS (
      SELECT 1 FROM nudge_log nl
      WHERE nl.job_id = j.id AND nl.nudge_type = 'draft_stale'
        AND nl.triggered_at > now() - interval '24 hours'
    )
    AND (SELECT count(*) FROM nudge_log nl WHERE nl.job_id = j.id AND nl.nudge_type = 'draft_stale') < 3;

  -- quotes_pending: open jobs with unaccepted quotes > 24h
  RETURN QUERY
  SELECT
    'quotes_pending'::TEXT,
    j.user_id,
    j.id,
    j.title,
    NULL::TEXT,
    (SELECT count(*) FROM quotes q WHERE q.job_id = j.id AND q.status = 'submitted'),
    u.email
  FROM jobs j
  JOIN auth.users u ON u.id = j.user_id
  WHERE j.status = 'open'
    AND j.assigned_professional_id IS NULL
    AND EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.job_id = j.id AND q.status = 'submitted'
        AND q.created_at < now() - interval '24 hours'
    )
    AND NOT EXISTS (
      SELECT 1 FROM nudge_log nl
      WHERE nl.job_id = j.id AND nl.nudge_type = 'quotes_pending'
        AND nl.triggered_at > now() - interval '24 hours'
    )
    AND (SELECT count(*) FROM nudge_log nl WHERE nl.job_id = j.id AND nl.nudge_type = 'quotes_pending') < 3;

  -- conversation_stale: conversations idle > 48h
  RETURN QUERY
  SELECT
    'conversation_stale'::TEXT,
    c.client_id,
    c.job_id,
    j.title,
    pp.display_name,
    0::BIGINT,
    u.email
  FROM conversations c
  JOIN jobs j ON j.id = c.job_id
  JOIN auth.users u ON u.id = c.client_id
  LEFT JOIN professional_profiles pp ON pp.user_id = c.pro_id
  WHERE j.status = 'open'
    AND j.assigned_professional_id IS NULL
    AND c.last_message_at IS NOT NULL
    AND c.last_message_at < now() - interval '48 hours'
    AND NOT EXISTS (
      SELECT 1 FROM nudge_log nl
      WHERE nl.job_id = c.job_id AND nl.user_id = c.client_id
        AND nl.nudge_type = 'conversation_stale'
        AND nl.triggered_at > now() - interval '24 hours'
    )
    AND (SELECT count(*) FROM nudge_log nl
         WHERE nl.job_id = c.job_id AND nl.user_id = c.client_id
           AND nl.nudge_type = 'conversation_stale') < 3;

  -- pro_no_quote: pro has active conversation on open job but hasn't quoted within 12h
  RETURN QUERY
  SELECT
    'pro_no_quote'::TEXT,
    c.pro_id,
    c.job_id,
    j.title,
    NULL::TEXT,
    0::BIGINT,
    u.email
  FROM conversations c
  JOIN jobs j ON j.id = c.job_id
  JOIN auth.users u ON u.id = c.pro_id
  WHERE j.status = 'open'
    AND j.assigned_professional_id IS NULL
    AND c.created_at < now() - interval '12 hours'
    AND NOT EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.job_id = c.job_id AND q.professional_id = c.pro_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM nudge_log nl
      WHERE nl.job_id = c.job_id AND nl.user_id = c.pro_id
        AND nl.nudge_type = 'pro_no_quote'
        AND nl.triggered_at > now() - interval '24 hours'
    )
    AND (SELECT count(*) FROM nudge_log nl
         WHERE nl.job_id = c.job_id AND nl.user_id = c.pro_id
           AND nl.nudge_type = 'pro_no_quote') < 2;

  -- review_reminder: job completed > 24h ago, user hasn't left review
  -- Fires separately for client and pro (per-side targeting)
  -- Client side
  RETURN QUERY
  SELECT
    'review_reminder'::TEXT,
    j.user_id,
    j.id,
    j.title,
    NULL::TEXT,
    0::BIGINT,
    u.email
  FROM jobs j
  JOIN auth.users u ON u.id = j.user_id
  WHERE j.status = 'completed'
    AND j.completed_at IS NOT NULL
    AND j.completed_at < now() - interval '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM job_reviews jr
      WHERE jr.job_id = j.id AND jr.reviewer_user_id = j.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM nudge_log nl
      WHERE nl.job_id = j.id AND nl.user_id = j.user_id
        AND nl.nudge_type = 'review_reminder'
        AND nl.triggered_at > now() - interval '48 hours'
    )
    AND (SELECT count(*) FROM nudge_log nl
         WHERE nl.job_id = j.id AND nl.user_id = j.user_id
           AND nl.nudge_type = 'review_reminder') < 2;

  -- Pro side
  RETURN QUERY
  SELECT
    'review_reminder'::TEXT,
    j.assigned_professional_id,
    j.id,
    j.title,
    NULL::TEXT,
    0::BIGINT,
    u.email
  FROM jobs j
  JOIN auth.users u ON u.id = j.assigned_professional_id
  WHERE j.status = 'completed'
    AND j.completed_at IS NOT NULL
    AND j.completed_at < now() - interval '24 hours'
    AND j.assigned_professional_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM job_reviews jr
      WHERE jr.job_id = j.id AND jr.reviewer_user_id = j.assigned_professional_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM nudge_log nl
      WHERE nl.job_id = j.id AND nl.user_id = j.assigned_professional_id
        AND nl.nudge_type = 'review_reminder'
        AND nl.triggered_at > now() - interval '48 hours'
    )
    AND (SELECT count(*) FROM nudge_log nl
         WHERE nl.job_id = j.id AND nl.user_id = j.assigned_professional_id
           AND nl.nudge_type = 'review_reminder') < 2;
END;
$function$;
