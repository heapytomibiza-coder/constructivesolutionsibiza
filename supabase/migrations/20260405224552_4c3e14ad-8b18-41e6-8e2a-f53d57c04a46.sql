
-- Remove explicit history inserts from cancel_job and post_job
-- The trg_log_job_status_change AFTER trigger already handles this

CREATE OR REPLACE FUNCTION public.cancel_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
BEGIN
  SELECT id, status, user_id
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

  IF v_job.status NOT IN ('draft', 'open') THEN
    RAISE EXCEPTION 'job_not_cancellable: use the cancellation request flow for in-progress jobs';
  END IF;

  UPDATE public.jobs
     SET status = 'cancelled',
         is_publicly_listed = false,
         updated_at = now()
   WHERE id = p_job_id;

  -- History is written automatically by trg_log_job_status_change
END;
$$;

CREATE OR REPLACE FUNCTION public.post_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
BEGIN
  SELECT id, status, user_id
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

  IF v_job.status != 'draft' THEN
    RAISE EXCEPTION 'job_not_postable: only draft jobs can be posted';
  END IF;

  UPDATE public.jobs
     SET status = 'open',
         is_publicly_listed = true,
         updated_at = now()
   WHERE id = p_job_id;

  -- History is written automatically by trg_log_job_status_change
END;
$$;
