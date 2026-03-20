
-- 1a. State Machine Enforcement
CREATE OR REPLACE FUNCTION public.validate_dispute_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_allowed text[];
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Admin override: any → closed
  IF NEW.status = 'closed' THEN
    RETURN NEW;
  END IF;

  CASE OLD.status
    WHEN 'draft' THEN v_allowed := ARRAY['open'];
    WHEN 'open' THEN v_allowed := ARRAY['awaiting_counterparty'];
    WHEN 'awaiting_counterparty' THEN v_allowed := ARRAY['evidence_collection'];
    WHEN 'evidence_collection' THEN v_allowed := ARRAY['assessment'];
    WHEN 'assessment' THEN v_allowed := ARRAY['resolution_offered', 'escalated'];
    WHEN 'resolution_offered' THEN v_allowed := ARRAY['awaiting_acceptance', 'escalated'];
    WHEN 'awaiting_acceptance' THEN v_allowed := ARRAY['resolved', 'escalated'];
    WHEN 'resolved' THEN v_allowed := ARRAY['closed'];
    WHEN 'escalated' THEN v_allowed := ARRAY['closed'];
    ELSE v_allowed := ARRAY[]::text[];
  END CASE;

  IF NOT (NEW.status = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Invalid dispute status transition: % → %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_dispute_status
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_dispute_status_transition();

-- 1b. Evidence Schema Enrichment
ALTER TABLE public.dispute_evidence
  ADD COLUMN IF NOT EXISTS submitted_by_role text,
  ADD COLUMN IF NOT EXISTS evidence_category text DEFAULT 'document',
  ADD COLUMN IF NOT EXISTS related_issue_type text,
  ADD COLUMN IF NOT EXISTS is_visible_to_counterparty boolean DEFAULT true;

-- 1c. Analysis Idempotency
ALTER TABLE public.dispute_analysis
  ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT true;

CREATE OR REPLACE FUNCTION public.deactivate_previous_analyses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dispute_analysis
  SET is_current = false
  WHERE dispute_id = NEW.dispute_id
    AND id != NEW.id
    AND is_current = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deactivate_previous_analyses
  AFTER INSERT ON public.dispute_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.deactivate_previous_analyses();

-- 1d. Case Completeness Function
CREATE OR REPLACE FUNCTION public.rpc_dispute_completeness(p_dispute_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_statement boolean;
  v_has_questionnaire boolean;
  v_evidence_count int;
  v_has_counterparty_response boolean;
  v_has_scope boolean;
  v_score int := 0;
  v_level text;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM dispute_inputs WHERE dispute_id = p_dispute_id AND raw_text IS NOT NULL
  ) INTO v_has_statement;

  SELECT EXISTS(
    SELECT 1 FROM dispute_inputs WHERE dispute_id = p_dispute_id AND questionnaire_answers IS NOT NULL
  ) INTO v_has_questionnaire;

  SELECT count(*) INTO v_evidence_count
  FROM dispute_evidence WHERE dispute_id = p_dispute_id;

  SELECT EXISTS(
    SELECT 1 FROM dispute_inputs di
    JOIN disputes d ON d.id = di.dispute_id
    WHERE di.dispute_id = p_dispute_id AND di.user_id != d.raised_by
  ) INTO v_has_counterparty_response;

  SELECT EXISTS(
    SELECT 1 FROM disputes d
    JOIN jobs j ON j.id = d.job_id
    WHERE d.id = p_dispute_id AND j.description IS NOT NULL
  ) INTO v_has_scope;

  IF v_has_statement THEN v_score := v_score + 1; END IF;
  IF v_has_questionnaire THEN v_score := v_score + 1; END IF;
  IF v_evidence_count > 0 THEN v_score := v_score + 1; END IF;
  IF v_has_counterparty_response THEN v_score := v_score + 1; END IF;
  IF v_has_scope THEN v_score := v_score + 1; END IF;

  IF v_score >= 4 THEN v_level := 'high';
  ELSIF v_score >= 2 THEN v_level := 'medium';
  ELSE v_level := 'low';
  END IF;

  RETURN jsonb_build_object(
    'has_statement', v_has_statement,
    'has_questionnaire', v_has_questionnaire,
    'evidence_count', v_evidence_count,
    'has_counterparty_response', v_has_counterparty_response,
    'has_scope', v_has_scope,
    'score', v_score,
    'max_score', 5,
    'level', v_level
  );
END;
$$;

-- 1e. AI Audit Log Table
CREATE TABLE IF NOT EXISTS public.dispute_ai_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dispute_ai_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties and admins can view AI events"
  ON public.dispute_ai_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM disputes d
      WHERE d.id = dispute_ai_events.dispute_id
        AND (d.raised_by = auth.uid() OR d.counterparty_id = auth.uid())
    )
    OR has_role(auth.uid(), 'admin')
  );

-- 2b. Status Transition RPC
CREATE OR REPLACE FUNCTION public.rpc_advance_dispute_status(p_dispute_id uuid, p_new_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute record;
  v_user_id uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  SELECT * INTO v_dispute FROM disputes WHERE id = p_dispute_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispute not found';
  END IF;

  v_is_admin := has_role(v_user_id, 'admin');

  IF NOT v_is_admin AND v_user_id != v_dispute.raised_by AND v_user_id != v_dispute.counterparty_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- The trigger validates the transition
  UPDATE disputes
  SET status = p_new_status::dispute_status,
      updated_at = now()
  WHERE id = p_dispute_id;

  RETURN to_jsonb(v_dispute) || jsonb_build_object('status', p_new_status);
END;
$$;
