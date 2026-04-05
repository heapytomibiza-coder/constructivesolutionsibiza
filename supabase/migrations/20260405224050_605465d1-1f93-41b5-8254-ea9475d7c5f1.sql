
-- ============================================================
-- TICKET 2: validate_job_status_transition() trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_job_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow non-status updates
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Validate transition
  CASE OLD.status
    WHEN 'draft' THEN
      IF NEW.status NOT IN ('open', 'cancelled') THEN
        RAISE EXCEPTION 'invalid_status_transition: % → % is not allowed', OLD.status, NEW.status;
      END IF;
    WHEN 'open' THEN
      IF NEW.status NOT IN ('in_progress', 'cancelled') THEN
        RAISE EXCEPTION 'invalid_status_transition: % → % is not allowed', OLD.status, NEW.status;
      END IF;
    WHEN 'in_progress' THEN
      -- 'open' is allowed for cancellation-accept re-listing via respond_to_cancellation RPC
      IF NEW.status NOT IN ('completed', 'cancelled', 'open') THEN
        RAISE EXCEPTION 'invalid_status_transition: % → % is not allowed', OLD.status, NEW.status;
      END IF;
    WHEN 'completed' THEN
      RAISE EXCEPTION 'invalid_status_transition: completed is a terminal status';
    WHEN 'cancelled' THEN
      RAISE EXCEPTION 'invalid_status_transition: cancelled is a terminal status';
    ELSE
      RAISE EXCEPTION 'invalid_status_transition: unknown status %', OLD.status;
  END CASE;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_job_status_transition
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_job_status_transition();


-- ============================================================
-- TICKET 3: cancel_job(p_job_id) RPC
-- ============================================================

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

  INSERT INTO public.job_status_history (job_id, from_status, to_status, changed_by, change_source, metadata)
  VALUES (p_job_id, v_job.status, 'cancelled', auth.uid(), 'app', jsonb_build_object('action', 'client_cancel'));
END;
$$;


-- ============================================================
-- TICKET 4: post_job(p_job_id) RPC
-- ============================================================

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

  INSERT INTO public.job_status_history (job_id, from_status, to_status, changed_by, change_source, metadata)
  VALUES (p_job_id, 'draft', 'open', auth.uid(), 'app', jsonb_build_object('action', 'job_posted'));
END;
$$;


-- ============================================================
-- TICKET 6: validate_quote_status_transition() trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_quote_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow non-status updates
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Terminal statuses cannot change
  IF OLD.status IN ('accepted', 'rejected', 'withdrawn', 'superseded', 'expired') THEN
    RAISE EXCEPTION 'invalid_quote_transition: % is a terminal status', OLD.status;
  END IF;

  -- Valid transitions from non-terminal statuses
  CASE OLD.status
    WHEN 'submitted' THEN
      IF NEW.status NOT IN ('accepted', 'rejected', 'revised', 'withdrawn', 'superseded', 'expired') THEN
        RAISE EXCEPTION 'invalid_quote_transition: % → % is not allowed', OLD.status, NEW.status;
      END IF;
    WHEN 'revised' THEN
      IF NEW.status NOT IN ('accepted', 'rejected', 'withdrawn', 'superseded', 'expired') THEN
        RAISE EXCEPTION 'invalid_quote_transition: % → % is not allowed', OLD.status, NEW.status;
      END IF;
    ELSE
      RAISE EXCEPTION 'invalid_quote_transition: unknown status %', OLD.status;
  END CASE;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_quote_status_transition
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_quote_status_transition();


-- ============================================================
-- TICKET 7: Fix withdraw_from_job ghost 'assigned' status
-- ============================================================

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

  -- Only allow withdrawal from open jobs (removed ghost 'assigned' status)
  IF v_job.status != 'open' THEN
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
