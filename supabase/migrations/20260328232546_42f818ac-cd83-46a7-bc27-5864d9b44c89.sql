
-- =============================================
-- P1: Rate limit by key (for unauthenticated contexts like auth emails)
-- =============================================
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
  -- Count events within the window for this key
  SELECT COUNT(*) INTO v_count
  FROM public.rate_limit_events
  WHERE action = p_action
    AND identifier = p_key
    AND created_at > (now() - p_window_interval);

  -- If over limit, deny
  IF v_count >= p_max_count THEN
    RETURN FALSE;
  END IF;

  -- Record this event
  INSERT INTO public.rate_limit_events (user_id, action, identifier, created_at)
  VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), p_action, p_key, now());

  RETURN TRUE;
END;
$$;

-- =============================================
-- P1: Atomic accept-quote-and-assign RPC
-- =============================================
CREATE OR REPLACE FUNCTION public.accept_quote_and_assign(
  p_quote_id UUID,
  p_job_id UUID,
  p_professional_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
  v_quote RECORD;
BEGIN
  -- Verify job ownership and status (lock the row)
  SELECT id, user_id, status, assigned_professional_id
  INTO v_job
  FROM public.jobs
  WHERE id = p_job_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'job_not_found';
  END IF;

  IF v_job.user_id != auth.uid() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_job.assigned_professional_id IS NOT NULL THEN
    RAISE EXCEPTION 'job_already_assigned';
  END IF;

  IF v_job.status NOT IN ('open', 'posted') THEN
    RAISE EXCEPTION 'job_not_assignable';
  END IF;

  -- Verify quote belongs to this job and is in an acceptable status
  SELECT id, job_id, status
  INTO v_quote
  FROM public.quotes
  WHERE id = p_quote_id
  FOR UPDATE;

  IF NOT FOUND OR v_quote.job_id != p_job_id THEN
    RAISE EXCEPTION 'quote_not_found';
  END IF;

  IF v_quote.status NOT IN ('submitted', 'revised') THEN
    RAISE EXCEPTION 'quote_not_acceptable';
  END IF;

  -- Accept the chosen quote
  UPDATE public.quotes
  SET status = 'accepted', updated_at = now()
  WHERE id = p_quote_id;

  -- Reject all other active quotes on this job
  UPDATE public.quotes
  SET status = 'rejected', updated_at = now()
  WHERE job_id = p_job_id
    AND id != p_quote_id
    AND status IN ('submitted', 'revised');

  -- Assign professional and move job to in_progress
  UPDATE public.jobs
  SET assigned_professional_id = p_professional_id,
      status = 'in_progress',
      updated_at = now()
  WHERE id = p_job_id;
END;
$$;

-- =============================================
-- P1: Batch increment professional micro stats
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_professional_micro_stats_batch(
  p_user_id UUID,
  p_micro_ids UUID[],
  p_rating INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_micro_id UUID;
BEGIN
  FOREACH v_micro_id IN ARRAY p_micro_ids LOOP
    PERFORM public.increment_professional_micro_stats(p_user_id, v_micro_id, p_rating);
  END LOOP;
END;
$$;

-- =============================================
-- P1: Restrict get_user_tier to self + admin
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id UUID)
RETURNS TABLE(tier TEXT, commission_rate NUMERIC, status TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow self-lookup or admin
  IF p_user_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(s.tier, 'bronze')::TEXT AS tier,
    COALESCE(s.commission_rate, 18)::NUMERIC AS commission_rate,
    COALESCE(s.status, 'active')::TEXT AS status
  FROM (SELECT 1) AS dummy
  LEFT JOIN public.subscriptions s ON s.user_id = p_user_id;
END;
$$;
