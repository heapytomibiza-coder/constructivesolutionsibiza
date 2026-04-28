-- =====================================================================
-- USER JOURNEY TRACE SYSTEM (diagnostic-only, additive)
-- =====================================================================

-- ---------- TABLES ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_journey_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_id uuid NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NULL,
  entry_route text NULL,
  exit_route text NULL,
  user_agent text NULL,
  viewport text NULL,
  status text NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_journey_sessions_started_at
  ON public.user_journey_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_journey_sessions_user_id
  ON public.user_journey_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_journey_sessions_status
  ON public.user_journey_sessions (status);

CREATE TABLE IF NOT EXISTS public.user_journey_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid NULL,
  event_type text NOT NULL,
  route text NULL,
  action text NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  success boolean NOT NULL DEFAULT true,
  error_message text NULL,
  error_code text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_events_session_created
  ON public.user_journey_events (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_journey_events_type_created
  ON public.user_journey_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journey_events_failure
  ON public.user_journey_events (created_at DESC) WHERE success = false;

-- ---------- RLS -------------------------------------------------------

ALTER TABLE public.user_journey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_events ENABLE ROW LEVEL SECURITY;

-- Admin-only read
CREATE POLICY "Admins can read journey sessions"
  ON public.user_journey_sessions
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

CREATE POLICY "Admins can read journey events"
  ON public.user_journey_events
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

-- No direct INSERT/UPDATE/DELETE policies — all writes go through SECURITY DEFINER RPCs.

-- ---------- WRITE RPCs ------------------------------------------------

CREATE OR REPLACE FUNCTION public.journey_touch_session(
  p_session_id text,
  p_route text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_viewport text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) < 8 OR length(p_session_id) > 80 THEN
    RETURN;
  END IF;

  INSERT INTO public.user_journey_sessions (
    session_id, user_id, entry_route, user_agent, viewport, last_active_at
  ) VALUES (
    p_session_id,
    v_uid,
    LEFT(COALESCE(p_route, ''), 200),
    LEFT(COALESCE(p_user_agent, ''), 400),
    LEFT(COALESCE(p_viewport, ''), 40),
    now()
  )
  ON CONFLICT (session_id) DO UPDATE SET
    last_active_at = now(),
    user_id = COALESCE(public.user_journey_sessions.user_id, EXCLUDED.user_id),
    exit_route = COALESCE(EXCLUDED.entry_route, public.user_journey_sessions.exit_route),
    user_agent = COALESCE(public.user_journey_sessions.user_agent, EXCLUDED.user_agent),
    viewport = COALESCE(public.user_journey_sessions.viewport, EXCLUDED.viewport);
END;
$$;

CREATE OR REPLACE FUNCTION public.journey_log_event(
  p_session_id text,
  p_event_type text,
  p_route text DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL,
  p_error_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_payload jsonb := COALESCE(p_payload, '{}'::jsonb);
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) < 8 OR length(p_session_id) > 80 THEN
    RETURN;
  END IF;
  IF p_event_type IS NULL OR length(p_event_type) > 80 THEN
    RETURN;
  END IF;

  -- Cap payload size defensively (~8 KB)
  IF length(v_payload::text) > 8192 THEN
    v_payload := jsonb_build_object('truncated', true);
  END IF;

  -- Ensure session row exists
  INSERT INTO public.user_journey_sessions (session_id, user_id, last_active_at)
  VALUES (p_session_id, v_uid, now())
  ON CONFLICT (session_id) DO UPDATE SET
    last_active_at = now(),
    user_id = COALESCE(public.user_journey_sessions.user_id, EXCLUDED.user_id),
    exit_route = COALESCE(LEFT(p_route, 200), public.user_journey_sessions.exit_route),
    status = CASE
      WHEN p_success = false AND public.user_journey_sessions.status = 'active' THEN 'error'
      ELSE public.user_journey_sessions.status
    END;

  INSERT INTO public.user_journey_events (
    session_id, user_id, event_type, route, action,
    payload, success, error_message, error_code
  ) VALUES (
    p_session_id,
    v_uid,
    LEFT(p_event_type, 80),
    LEFT(p_route, 200),
    LEFT(p_action, 120),
    v_payload,
    COALESCE(p_success, true),
    LEFT(p_error_message, 1000),
    LEFT(p_error_code, 60)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.journey_touch_session(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.journey_log_event(text, text, text, text, jsonb, boolean, text, text) TO anon, authenticated;

-- ---------- ADMIN READ RPCs ------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_get_recent_journey_sessions(
  p_limit integer DEFAULT 25,
  p_only_errors boolean DEFAULT false
)
RETURNS TABLE (
  session_id text,
  user_id uuid,
  started_at timestamptz,
  last_active_at timestamptz,
  ended_at timestamptz,
  entry_route text,
  exit_route text,
  user_agent text,
  viewport text,
  status text,
  event_count bigint,
  error_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') AND is_admin_email()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    s.session_id,
    s.user_id,
    s.started_at,
    s.last_active_at,
    s.ended_at,
    s.entry_route,
    s.exit_route,
    s.user_agent,
    s.viewport,
    s.status,
    COALESCE(c.event_count, 0) AS event_count,
    COALESCE(c.error_count, 0) AS error_count
  FROM public.user_journey_sessions s
  LEFT JOIN LATERAL (
    SELECT
      count(*) AS event_count,
      count(*) FILTER (WHERE e.success = false) AS error_count
    FROM public.user_journey_events e
    WHERE e.session_id = s.session_id
  ) c ON true
  WHERE (NOT p_only_errors) OR COALESCE(c.error_count, 0) > 0
  ORDER BY s.last_active_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 200));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_journey_session_detail(
  p_session_id text
)
RETURNS TABLE (
  id uuid,
  session_id text,
  user_id uuid,
  event_type text,
  route text,
  action text,
  payload jsonb,
  success boolean,
  error_message text,
  error_code text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') AND is_admin_email()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    e.id, e.session_id, e.user_id, e.event_type, e.route, e.action,
    e.payload, e.success, e.error_message, e.error_code, e.created_at
  FROM public.user_journey_events e
  WHERE e.session_id = p_session_id
  ORDER BY e.created_at ASC
  LIMIT 2000;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_recent_journey_sessions(integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_journey_session_detail(text) TO authenticated;