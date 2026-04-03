-- Add accepted_at column to quotes
ALTER TABLE public.quotes ADD COLUMN accepted_at TIMESTAMPTZ;

-- Recreate accept_quote_and_assign with accepted_at support
CREATE OR REPLACE FUNCTION public.accept_quote_and_assign(p_quote_id UUID, p_job_id UUID)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_job RECORD;
  v_quote RECORD;
BEGIN
  -- Lock and verify job
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

  -- Lock and verify quote; derive professional_id from quote
  SELECT id, job_id, status, professional_id
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

  -- Accept the chosen quote (now includes accepted_at)
  UPDATE public.quotes
  SET status = 'accepted', updated_at = now(), accepted_at = now()
  WHERE id = p_quote_id;

  -- Reject all other active quotes on this job
  UPDATE public.quotes
  SET status = 'rejected', updated_at = now()
  WHERE job_id = p_job_id
    AND id != p_quote_id
    AND status IN ('submitted', 'revised');

  -- Assign the quote's professional and move job to in_progress
  UPDATE public.jobs
  SET assigned_professional_id = v_quote.professional_id,
      status = 'in_progress',
      updated_at = now()
  WHERE id = p_job_id;
END;
$function$;