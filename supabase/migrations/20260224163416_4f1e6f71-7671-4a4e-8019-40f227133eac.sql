
CREATE OR REPLACE FUNCTION public.get_conversation_counts_for_jobs(p_job_ids uuid[])
RETURNS TABLE(job_id uuid, conversation_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.job_id, count(*)::bigint AS conversation_count
  FROM public.conversations c
  JOIN public.jobs j ON j.id = c.job_id
  WHERE c.job_id = ANY(p_job_ids)
    AND j.user_id = auth.uid()
  GROUP BY c.job_id;
$$;
