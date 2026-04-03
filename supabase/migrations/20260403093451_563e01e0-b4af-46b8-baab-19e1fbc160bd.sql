
CREATE OR REPLACE FUNCTION public.admin_force_complete_job(p_job_id uuid, p_reason text DEFAULT '')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
BEGIN
  -- Admin gate
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT id, status INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'job_not_found';
  END IF;

  IF v_job.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'job_already_closed';
  END IF;

  UPDATE jobs
  SET status = 'completed',
      completed_at = now(),
      updated_at = now()
  WHERE id = p_job_id;

  INSERT INTO job_status_history (job_id, from_status, to_status, changed_by, change_source, metadata)
  VALUES (p_job_id, v_job.status, 'completed', auth.uid(), 'admin_override', jsonb_build_object('reason', p_reason));

  RETURN json_build_object('job_id', p_job_id, 'from_status', v_job.status, 'to_status', 'completed');
END;
$$;
