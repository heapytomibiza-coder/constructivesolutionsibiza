DROP FUNCTION IF EXISTS public.accept_response(uuid);

CREATE FUNCTION public.accept_response(_response_id uuid)
RETURNS public.job_responses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _resp public.job_responses;
  _job_owner uuid;
  _job_id uuid;
BEGIN
  SELECT * INTO _resp FROM public.job_responses WHERE id = _response_id;
  IF _resp IS NULL THEN
    RAISE EXCEPTION 'Response not found';
  END IF;

  SELECT user_id, id INTO _job_owner, _job_id
  FROM public.jobs WHERE id = _resp.job_id;

  IF _job_owner IS NULL OR _job_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Only the job owner can accept a response';
  END IF;

  IF _resp.status NOT IN ('interested','quoted','shortlisted') THEN
    RAISE EXCEPTION 'Cannot accept a response in status %', _resp.status;
  END IF;

  UPDATE public.job_responses
  SET status = 'accepted',
      accepted_at = now(),
      updated_at = now()
  WHERE id = _response_id
  RETURNING * INTO _resp;

  -- Auto-decline only still-active competing responses on the same job.
  -- Preserve terminal states (accepted/declined/withdrawn/expired) for historical accuracy.
  UPDATE public.job_responses
  SET status = 'declined',
      declined_at = now(),
      updated_at = now()
  WHERE job_id = _job_id
    AND id <> _response_id
    AND status IN ('interested','quoted','shortlisted');

  RETURN _resp;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_response(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_response(uuid) TO authenticated;