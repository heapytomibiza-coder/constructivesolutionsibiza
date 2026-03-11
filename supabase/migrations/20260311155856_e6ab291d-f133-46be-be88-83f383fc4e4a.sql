
-- Rate limiting infrastructure
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast window lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_lookup 
  ON public.rate_limit_events (user_id, action, created_at DESC);

-- Auto-purge old entries (older than 24h are irrelevant)
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

-- No direct client access — only via RPC
CREATE POLICY "No direct access" ON public.rate_limit_events
  FOR ALL TO authenticated USING (false);

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_count int,
  p_window_interval interval
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  -- Count events in window
  SELECT count(*) INTO v_count
  FROM public.rate_limit_events
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > now() - p_window_interval;

  -- If under limit, record the event and allow
  IF v_count < p_max_count THEN
    INSERT INTO public.rate_limit_events (user_id, action)
    VALUES (p_user_id, p_action);
    RETURN true;
  END IF;

  -- Over limit
  RETURN false;
END;
$$;
