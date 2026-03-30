CREATE OR REPLACE FUNCTION public.complete_job(p_job_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
BEGIN
  SELECT id, user_id, status, assigned_professional_id
  INTO v_job FROM jobs WHERE id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'job_not_found';
  END IF;

  IF v_job.user_id != auth.uid() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_job.status != 'in_progress' THEN
    RAISE EXCEPTION 'job_not_in_progress';
  END IF;

  IF v_job.assigned_professional_id IS NULL THEN
    RAISE EXCEPTION 'no_professional_assigned';
  END IF;

  UPDATE jobs
  SET status = 'completed', completed_at = now()
  WHERE id = p_job_id;

  RETURN json_build_object('job_id', p_job_id, 'status', 'completed');
END;
$$;