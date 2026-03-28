
-- Add identifier column for key-based rate limiting
ALTER TABLE public.rate_limit_events ADD COLUMN IF NOT EXISTS identifier TEXT;
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_identifier ON public.rate_limit_events (identifier, action, created_at);

-- Fix check_rate_limit_by_key to use the new column
CREATE OR REPLACE FUNCTION public.check_rate_limit_by_key(
  p_key TEXT,
  p_action TEXT,
  p_max_count INTEGER,
  p_window_interval INTERVAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.rate_limit_events
  WHERE action = p_action
    AND identifier = p_key
    AND created_at > (now() - p_window_interval);

  IF v_count >= p_max_count THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.rate_limit_events (user_id, action, identifier, created_at)
  VALUES ('00000000-0000-0000-0000-000000000000'::uuid, p_action, p_key, now());

  RETURN TRUE;
END;
$$;
