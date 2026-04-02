
-- Add completion request tracking to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS completion_requested_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS completion_requested_by uuid DEFAULT NULL;

-- RPC for professional to request completion
CREATE OR REPLACE FUNCTION public.request_job_completion(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
BEGIN
  SELECT id, status, assigned_professional_id, completion_requested_at
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

  IF v_job.status != 'in_progress' THEN
    RAISE EXCEPTION 'job_not_in_progress';
  END IF;

  IF v_job.completion_requested_at IS NOT NULL THEN
    RAISE EXCEPTION 'already_requested';
  END IF;

  UPDATE public.jobs
     SET completion_requested_at = now(),
         completion_requested_by = auth.uid(),
         updated_at = now()
   WHERE id = p_job_id;
END;
$$;
