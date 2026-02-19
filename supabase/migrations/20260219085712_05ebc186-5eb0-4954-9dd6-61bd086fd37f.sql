
CREATE OR REPLACE FUNCTION public.increment_job_edit_version(p_job_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.jobs
  SET edit_version = edit_version + 1
  WHERE id = p_job_id;
$$;

REVOKE ALL ON FUNCTION public.increment_job_edit_version(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_job_edit_version(uuid) TO authenticated;
