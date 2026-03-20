
-- Add auth check to rpc_dispute_completeness: only parties or admin can call
CREATE OR REPLACE FUNCTION public.rpc_dispute_completeness(p_dispute_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_has_statement boolean;
  v_has_questionnaire boolean;
  v_evidence_count int;
  v_has_counterparty_response boolean;
  v_has_scope boolean;
  v_score int := 0;
  v_level text;
  v_is_authorized boolean;
BEGIN
  -- Auth check: must be a dispute party or admin
  SELECT EXISTS(
    SELECT 1 FROM disputes d
    WHERE d.id = p_dispute_id
      AND (d.raised_by = auth.uid() OR d.counterparty_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to view this dispute';
  END IF;

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
$function$;
