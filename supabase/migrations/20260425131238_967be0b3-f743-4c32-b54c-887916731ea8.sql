-- ============================================================
-- Track 1 — Security Hardening Patch
-- Scope: check_rate_limit, increment_job_edit_version,
--        admin_force_complete_job. translate-content is patched
--        in the edge function code (separate file).
-- ============================================================

-- 1) check_rate_limit: require caller identity match
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_count integer,
  p_window_interval interval
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count int;
BEGIN
  -- Identity gate: caller may only check their own quota
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.rate_limit_events
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > now() - p_window_interval;

  IF v_count < p_max_count THEN
    INSERT INTO public.rate_limit_events (user_id, action)
    VALUES (p_user_id, p_action);
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;

-- 2) increment_job_edit_version: no triggers, no TS callers → revoke
--    Function body is left unchanged so any future internal/trigger
--    use still works under the function-owner role.
REVOKE EXECUTE ON FUNCTION public.increment_job_edit_version(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_job_edit_version(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_job_edit_version(uuid) FROM authenticated;

-- 3) admin_force_complete_job: add is_admin_email() dual-gate
CREATE OR REPLACE FUNCTION public.admin_force_complete_job(
  p_job_id uuid,
  p_reason text DEFAULT ''::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job RECORD;
BEGIN
  -- Dual-gated admin check (role + allow-listed email)
  IF NOT has_role(auth.uid(), 'admin') OR NOT is_admin_email() THEN
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
$function$;