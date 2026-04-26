-- =========================================================
-- Track 5: Job Responses Layer (additive)
-- =========================================================

-- 1. Table -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id uuid NULL REFERENCES public.quotes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'interested',
  message text NULL,
  decline_reason text NULL,
  withdraw_reason text NULL,
  interested_at timestamptz NOT NULL DEFAULT now(),
  quoted_at timestamptz NULL,
  shortlisted_at timestamptz NULL,
  accepted_at timestamptz NULL,
  declined_at timestamptz NULL,
  withdrawn_at timestamptz NULL,
  expired_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_responses_job_pro_key UNIQUE (job_id, professional_id),
  CONSTRAINT job_responses_status_chk CHECK (status IN
    ('interested','quoted','shortlisted','accepted','declined','withdrawn','expired')),
  CONSTRAINT job_responses_message_len_chk CHECK (message IS NULL OR length(message) <= 2000),
  CONSTRAINT job_responses_decline_reason_len_chk CHECK (decline_reason IS NULL OR length(decline_reason) <= 500),
  CONSTRAINT job_responses_withdraw_reason_len_chk CHECK (withdraw_reason IS NULL OR length(withdraw_reason) <= 500)
);

-- One winner per job (defense vs double-accept races)
CREATE UNIQUE INDEX IF NOT EXISTS job_responses_one_accepted_per_job
  ON public.job_responses (job_id)
  WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_job_responses_job_id ON public.job_responses(job_id);
CREATE INDEX IF NOT EXISTS idx_job_responses_professional_id ON public.job_responses(professional_id);
CREATE INDEX IF NOT EXISTS idx_job_responses_status ON public.job_responses(status);
CREATE INDEX IF NOT EXISTS idx_job_responses_job_status ON public.job_responses(job_id, status);
CREATE INDEX IF NOT EXISTS idx_job_responses_pro_status ON public.job_responses(professional_id, status);
CREATE INDEX IF NOT EXISTS idx_job_responses_quote_id ON public.job_responses(quote_id) WHERE quote_id IS NOT NULL;

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_job_responses_updated_at ON public.job_responses;
CREATE TRIGGER trg_job_responses_updated_at
  BEFORE UPDATE ON public.job_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Sync trigger: job_responses -> job_matches ---------------------------
CREATE OR REPLACE FUNCTION public.sync_job_match_on_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('interested','quoted','shortlisted','accepted') THEN
    UPDATE public.job_matches
       SET status = 'responded',
           responded_at = COALESCE(responded_at, now()),
           updated_at = now()
     WHERE job_id = NEW.job_id
       AND professional_id = NEW.professional_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_job_match_on_response ON public.job_responses;
CREATE TRIGGER trg_sync_job_match_on_response
  AFTER INSERT OR UPDATE OF status ON public.job_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_job_match_on_response();

-- 3. RLS ------------------------------------------------------------------
ALTER TABLE public.job_responses ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.job_responses FROM PUBLIC;
REVOKE ALL ON public.job_responses FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.job_responses FROM authenticated;
GRANT SELECT ON public.job_responses TO authenticated;

DROP POLICY IF EXISTS "Admins manage all job_responses" ON public.job_responses;
CREATE POLICY "Admins manage all job_responses"
ON public.job_responses
FOR ALL
USING (public.has_role(auth.uid(), 'admin') AND public.is_admin_email())
WITH CHECK (public.has_role(auth.uid(), 'admin') AND public.is_admin_email());

DROP POLICY IF EXISTS "Professionals read own job_responses" ON public.job_responses;
CREATE POLICY "Professionals read own job_responses"
ON public.job_responses
FOR SELECT
USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "Clients read responses on owned jobs" ON public.job_responses;
CREATE POLICY "Clients read responses on owned jobs"
ON public.job_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_responses.job_id
      AND j.user_id = auth.uid()
  )
);

-- 4. RPCs -----------------------------------------------------------------

-- 4a. express_interest (pro)
CREATE OR REPLACE FUNCTION public.express_interest(
  p_job_id uuid,
  p_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_job public.jobs%ROWTYPE;
  v_existing public.job_responses%ROWTYPE;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_job_id IS NULL THEN RAISE EXCEPTION 'job_id_required'; END IF;
  IF p_message IS NOT NULL AND length(p_message) > 2000 THEN
    RAISE EXCEPTION 'message_too_long';
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'job_not_found'; END IF;
  IF v_job.status <> 'open' OR v_job.is_publicly_listed IS NOT TRUE THEN
    RAISE EXCEPTION 'job_not_open';
  END IF;
  IF v_job.user_id = v_uid THEN
    RAISE EXCEPTION 'cannot_respond_to_own_job';
  END IF;

  SELECT * INTO v_existing
    FROM public.job_responses
   WHERE job_id = p_job_id AND professional_id = v_uid;

  IF NOT FOUND THEN
    INSERT INTO public.job_responses (job_id, professional_id, status, message, interested_at)
    VALUES (p_job_id, v_uid, 'interested', p_message, now())
    RETURNING id INTO v_id;
    RETURN v_id;
  END IF;

  IF v_existing.status IN ('withdrawn','expired') THEN
    UPDATE public.job_responses
       SET status = 'interested',
           message = COALESCE(p_message, message),
           interested_at = now(),
           withdrawn_at = NULL,
           withdraw_reason = NULL,
           expired_at = NULL,
           decline_reason = NULL,
           updated_at = now()
     WHERE id = v_existing.id;
    RETURN v_existing.id;
  END IF;

  -- Already engaged in any active state — idempotent no-op
  RETURN v_existing.id;
END;
$$;

-- 4b. link_quote_to_response (pro)
CREATE OR REPLACE FUNCTION public.link_quote_to_response(
  p_job_id uuid,
  p_quote_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_quote public.quotes%ROWTYPE;
  v_existing public.job_responses%ROWTYPE;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_job_id IS NULL OR p_quote_id IS NULL THEN
    RAISE EXCEPTION 'job_id_and_quote_id_required';
  END IF;

  SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'quote_not_found'; END IF;
  IF v_quote.job_id <> p_job_id THEN RAISE EXCEPTION 'quote_job_mismatch'; END IF;
  IF v_quote.professional_id <> v_uid THEN RAISE EXCEPTION 'quote_not_owned_by_caller'; END IF;

  SELECT * INTO v_existing
    FROM public.job_responses
   WHERE job_id = p_job_id AND professional_id = v_uid;

  IF NOT FOUND THEN
    -- Auto-create as 'quoted' if pro never expressed interest first
    INSERT INTO public.job_responses (
      job_id, professional_id, status, quote_id, interested_at, quoted_at
    )
    VALUES (p_job_id, v_uid, 'quoted', p_quote_id, now(), now())
    RETURNING id INTO v_id;
    RETURN v_id;
  END IF;

  IF v_existing.status NOT IN ('interested','quoted') THEN
    RAISE EXCEPTION 'invalid_state_for_quote_link: %', v_existing.status;
  END IF;

  UPDATE public.job_responses
     SET status = 'quoted',
         quote_id = p_quote_id,
         quoted_at = COALESCE(quoted_at, now()),
         updated_at = now()
   WHERE id = v_existing.id;

  RETURN v_existing.id;
END;
$$;

-- 4c. withdraw_response (pro)
CREATE OR REPLACE FUNCTION public.withdraw_response(
  p_job_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing public.job_responses%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_job_id IS NULL THEN RAISE EXCEPTION 'job_id_required'; END IF;
  IF p_reason IS NOT NULL AND length(p_reason) > 500 THEN
    RAISE EXCEPTION 'reason_too_long';
  END IF;

  SELECT * INTO v_existing
    FROM public.job_responses
   WHERE job_id = p_job_id AND professional_id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'response_not_found'; END IF;

  IF v_existing.status NOT IN ('interested','quoted','shortlisted') THEN
    RAISE EXCEPTION 'invalid_state_for_withdraw: %', v_existing.status;
  END IF;

  UPDATE public.job_responses
     SET status = 'withdrawn',
         withdrawn_at = now(),
         withdraw_reason = p_reason,
         updated_at = now()
   WHERE id = v_existing.id;

  RETURN v_existing.id;
END;
$$;

-- 4d. shortlist_response (client)
CREATE OR REPLACE FUNCTION public.shortlist_response(p_response_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_resp public.job_responses%ROWTYPE;
  v_job_owner uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_response_id IS NULL THEN RAISE EXCEPTION 'response_id_required'; END IF;

  SELECT * INTO v_resp FROM public.job_responses WHERE id = p_response_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'response_not_found'; END IF;

  SELECT user_id INTO v_job_owner FROM public.jobs WHERE id = v_resp.job_id;
  IF v_job_owner <> v_uid THEN RAISE EXCEPTION 'not_job_owner'; END IF;

  IF v_resp.status <> 'quoted' THEN
    RAISE EXCEPTION 'invalid_state_for_shortlist: %', v_resp.status;
  END IF;

  UPDATE public.job_responses
     SET status = 'shortlisted',
         shortlisted_at = now(),
         updated_at = now()
   WHERE id = p_response_id;

  RETURN p_response_id;
END;
$$;

-- 4e. decline_response (client)
CREATE OR REPLACE FUNCTION public.decline_response(
  p_response_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_resp public.job_responses%ROWTYPE;
  v_job_owner uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_response_id IS NULL THEN RAISE EXCEPTION 'response_id_required'; END IF;
  IF p_reason IS NOT NULL AND length(p_reason) > 500 THEN
    RAISE EXCEPTION 'reason_too_long';
  END IF;

  SELECT * INTO v_resp FROM public.job_responses WHERE id = p_response_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'response_not_found'; END IF;

  SELECT user_id INTO v_job_owner FROM public.jobs WHERE id = v_resp.job_id;
  IF v_job_owner <> v_uid THEN RAISE EXCEPTION 'not_job_owner'; END IF;

  IF v_resp.status NOT IN ('interested','quoted','shortlisted') THEN
    RAISE EXCEPTION 'invalid_state_for_decline: %', v_resp.status;
  END IF;

  UPDATE public.job_responses
     SET status = 'declined',
         declined_at = now(),
         decline_reason = p_reason,
         updated_at = now()
   WHERE id = p_response_id;

  RETURN p_response_id;
END;
$$;

-- 4f. accept_response (client) — atomic; auto-declines other open responses
CREATE OR REPLACE FUNCTION public.accept_response(p_response_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_resp public.job_responses%ROWTYPE;
  v_job_owner uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_response_id IS NULL THEN RAISE EXCEPTION 'response_id_required'; END IF;

  SELECT * INTO v_resp FROM public.job_responses WHERE id = p_response_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'response_not_found'; END IF;

  SELECT user_id INTO v_job_owner FROM public.jobs WHERE id = v_resp.job_id;
  IF v_job_owner <> v_uid THEN RAISE EXCEPTION 'not_job_owner'; END IF;

  IF v_resp.status NOT IN ('quoted','shortlisted') THEN
    RAISE EXCEPTION 'invalid_state_for_accept: %', v_resp.status;
  END IF;

  -- Promote the chosen response
  UPDATE public.job_responses
     SET status = 'accepted',
         accepted_at = now(),
         updated_at = now()
   WHERE id = p_response_id;

  -- Auto-decline all other in-flight responses on the same job
  UPDATE public.job_responses
     SET status = 'declined',
         declined_at = now(),
         decline_reason = COALESCE(decline_reason, 'auto_declined_on_acceptance'),
         updated_at = now()
   WHERE job_id = v_resp.job_id
     AND id <> p_response_id
     AND status IN ('interested','quoted','shortlisted');

  RETURN p_response_id;
END;
$$;

-- 5. RPC privileges -------------------------------------------------------
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'express_interest(uuid, text)',
    'link_quote_to_response(uuid, uuid)',
    'withdraw_response(uuid, text)',
    'shortlist_response(uuid)',
    'decline_response(uuid, text)',
    'accept_response(uuid)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM anon', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
  END LOOP;
END $$;