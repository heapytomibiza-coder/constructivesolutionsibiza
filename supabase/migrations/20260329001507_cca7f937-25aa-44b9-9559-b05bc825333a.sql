
-- T3 fix: nudge_log table + dedup index using immutable expression
CREATE TABLE public.nudge_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID,
  nudge_type TEXT NOT NULL,
  nudge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  suppressed_by UUID,
  suppressed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX nudge_log_dedup
  ON public.nudge_log (user_id, job_id, nudge_type, nudge_date)
  WHERE suppressed_at IS NULL;

ALTER TABLE public.nudge_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view nudge log"
  ON public.nudge_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

CREATE POLICY "Admins can update nudge log"
  ON public.nudge_log FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

-- Get pending nudges RPC (service role usage)
CREATE OR REPLACE FUNCTION public.get_pending_nudges()
RETURNS TABLE (
  nudge_type TEXT,
  user_id UUID,
  job_id UUID,
  job_title TEXT,
  pro_name TEXT,
  quote_count BIGINT,
  user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    AND (SELECT count(*) FROM nudge_log nl WHERE nl.job_id = j.id) < 3;

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
    AND (SELECT count(*) FROM nudge_log nl WHERE nl.job_id = j.id) < 3;

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
    AND (SELECT count(*) FROM nudge_log nl WHERE nl.job_id = c.job_id AND nl.user_id = c.client_id) < 3;
END;
$$;

-- Mark nudge sent
CREATE OR REPLACE FUNCTION public.mark_nudge_sent(p_nudge_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE nudge_log SET sent_at = now() WHERE id = p_nudge_id;
$$;

-- Suppress nudge (admin)
CREATE OR REPLACE FUNCTION public.suppress_nudge(p_job_id UUID, p_nudge_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  INSERT INTO nudge_log (user_id, job_id, nudge_type, suppressed_by, suppressed_at)
  SELECT j.user_id, j.id, p_nudge_type, auth.uid(), now()
  FROM jobs j WHERE j.id = p_job_id
  ON CONFLICT DO NOTHING;
END;
$$;
