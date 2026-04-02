
-- Update withdraw_from_job to re-list job publicly
CREATE OR REPLACE FUNCTION public.withdraw_from_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
BEGIN
  SELECT id, status, assigned_professional_id, user_id
    INTO v_job
    FROM public.jobs
   WHERE id = p_job_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'job_not_found';
  END IF;

  IF v_job.assigned_professional_id IS NULL OR v_job.assigned_professional_id != auth.uid() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_job.status NOT IN ('open', 'assigned') THEN
    RAISE EXCEPTION 'cannot_withdraw_in_progress';
  END IF;

  UPDATE public.jobs
     SET assigned_professional_id = NULL,
         status = 'open',
         is_publicly_listed = true,
         completion_requested_at = NULL,
         completion_requested_by = NULL,
         cancellation_requested_at = NULL,
         cancellation_requested_by = NULL,
         cancellation_reason = NULL,
         updated_at = now()
   WHERE id = p_job_id;

  INSERT INTO public.job_status_history (job_id, from_status, to_status, changed_by, change_source, metadata)
  VALUES (p_job_id, v_job.status, 'open', auth.uid(), 'app', jsonb_build_object('action', 'professional_withdrawal'));
END;
$$;

-- Update respond_to_cancellation to re-list job publicly on accept
CREATE OR REPLACE FUNCTION public.respond_to_cancellation(p_job_id uuid, p_accept boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
BEGIN
  SELECT id, status, user_id, assigned_professional_id, cancellation_requested_at
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

  IF v_job.cancellation_requested_at IS NULL THEN
    RAISE EXCEPTION 'no_cancellation_request';
  END IF;

  IF p_accept THEN
    UPDATE public.jobs
       SET assigned_professional_id = NULL,
           status = 'open',
           is_publicly_listed = true,
           cancellation_requested_at = NULL,
           cancellation_requested_by = NULL,
           cancellation_reason = NULL,
           completion_requested_at = NULL,
           completion_requested_by = NULL,
           updated_at = now()
     WHERE id = p_job_id;

    INSERT INTO public.job_status_history (job_id, from_status, to_status, changed_by, change_source, metadata)
    VALUES (p_job_id, v_job.status, 'open', auth.uid(), 'app', jsonb_build_object('action', 'cancellation_accepted'));
  ELSE
    UPDATE public.jobs
       SET cancellation_requested_at = NULL,
           cancellation_requested_by = NULL,
           cancellation_reason = NULL,
           updated_at = now()
     WHERE id = p_job_id;

    INSERT INTO public.job_status_history (job_id, from_status, to_status, changed_by, change_source, metadata)
    VALUES (p_job_id, v_job.status, v_job.status, auth.uid(), 'app', jsonb_build_object('action', 'cancellation_declined'));
  END IF;
END;
$$;
