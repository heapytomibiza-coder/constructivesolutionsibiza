
-- RPC: Admin offers a resolution on a dispute
CREATE OR REPLACE FUNCTION public.rpc_offer_resolution(
  p_dispute_id uuid,
  p_resolution_type text,
  p_resolution_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Admin-only check
  IF NOT (has_role(auth.uid(), 'admin') AND is_admin_email()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Must be in assessment status
  IF NOT EXISTS (
    SELECT 1 FROM disputes WHERE id = p_dispute_id AND status = 'assessment'
  ) THEN
    RAISE EXCEPTION 'Dispute must be in assessment status to offer resolution';
  END IF;

  -- Update dispute with resolution details and advance status
  UPDATE disputes
  SET resolution_type = p_resolution_type::resolution_pathway,
      resolution_description = p_resolution_description,
      status = 'resolution_offered',
      updated_at = now()
  WHERE id = p_dispute_id;

  -- Log admin action
  INSERT INTO admin_actions_log (admin_user_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'offer_resolution', 'dispute', p_dispute_id,
    jsonb_build_object('resolution_type', p_resolution_type, 'description', p_resolution_description));
END;
$function$;

-- RPC: Party responds to a resolution offer (accept or reject)
CREATE OR REPLACE FUNCTION public.rpc_respond_to_resolution(
  p_dispute_id uuid,
  p_accept boolean,
  p_rejection_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_dispute disputes%ROWTYPE;
BEGIN
  SELECT * INTO v_dispute FROM disputes WHERE id = p_dispute_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispute not found';
  END IF;

  -- Auth: must be a party
  IF auth.uid() != v_dispute.raised_by AND auth.uid() != v_dispute.counterparty_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Must be in resolution_offered or awaiting_acceptance
  IF v_dispute.status NOT IN ('resolution_offered', 'awaiting_acceptance') THEN
    RAISE EXCEPTION 'Dispute is not awaiting a resolution response';
  END IF;

  IF p_accept THEN
    UPDATE disputes
    SET resolution_accepted_at = now(),
        status = 'resolved',
        resolved_at = now(),
        updated_at = now()
    WHERE id = p_dispute_id;
  ELSE
    -- Log rejection reason as a dispute input
    INSERT INTO dispute_inputs (dispute_id, user_id, input_type, raw_text)
    VALUES (p_dispute_id, auth.uid(), 'resolution_rejection', p_rejection_reason);

    UPDATE disputes
    SET status = 'escalated',
        updated_at = now()
    WHERE id = p_dispute_id;
  END IF;
END;
$function$;

-- RPC: Admin dispute analytics
CREATE OR REPLACE FUNCTION public.rpc_admin_dispute_analytics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_by_status jsonb;
  v_by_week jsonb;
  v_avg_hours numeric;
  v_median_hours numeric;
  v_escalation_rate numeric;
  v_top_issues jsonb;
  v_repeat_offenders jsonb;
  v_total bigint;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') AND is_admin_email()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Volume by status
  SELECT jsonb_object_agg(status, cnt) INTO v_by_status
  FROM (SELECT status::text, count(*) as cnt FROM disputes GROUP BY status) sub;

  -- Volume by week (last 12 weeks)
  SELECT jsonb_agg(jsonb_build_object('week', w, 'count', c) ORDER BY w) INTO v_by_week
  FROM (
    SELECT date_trunc('week', created_at)::date as w, count(*) as c
    FROM disputes
    WHERE created_at >= now() - interval '12 weeks'
    GROUP BY 1
  ) sub;

  -- Avg resolution time (hours)
  SELECT avg(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)
  INTO v_avg_hours
  FROM disputes WHERE resolved_at IS NOT NULL;

  -- Median resolution time
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)
  INTO v_median_hours
  FROM disputes WHERE resolved_at IS NOT NULL;

  -- Escalation rate
  SELECT count(*) INTO v_total FROM disputes WHERE status != 'draft';
  IF v_total > 0 THEN
    v_escalation_rate := (SELECT count(*)::numeric FROM disputes WHERE status = 'escalated') / v_total;
  ELSE
    v_escalation_rate := 0;
  END IF;

  -- Top issue types
  SELECT jsonb_agg(jsonb_build_object('issue', it, 'count', c) ORDER BY c DESC) INTO v_top_issues
  FROM (
    SELECT unnest(issue_types)::text as it, count(*) as c
    FROM disputes
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
  ) sub;

  -- Repeat offenders (users in 2+ disputes)
  SELECT jsonb_agg(jsonb_build_object(
    'user_id', u_id, 'name', COALESCE(p.display_name, 'Unknown'), 'count', cnt, 'last_at', last_at
  ) ORDER BY cnt DESC) INTO v_repeat_offenders
  FROM (
    SELECT u_id, count(*) as cnt, max(created_at) as last_at
    FROM (
      SELECT raised_by as u_id, created_at FROM disputes
      UNION ALL
      SELECT counterparty_id, created_at FROM disputes WHERE counterparty_id IS NOT NULL
    ) all_parties
    GROUP BY u_id
    HAVING count(*) >= 2
  ) repeats
  LEFT JOIN profiles p ON p.user_id = repeats.u_id;

  v_result := jsonb_build_object(
    'by_status', COALESCE(v_by_status, '{}'::jsonb),
    'by_week', COALESCE(v_by_week, '[]'::jsonb),
    'avg_resolution_hours', v_avg_hours,
    'median_resolution_hours', v_median_hours,
    'escalation_rate', v_escalation_rate,
    'top_issues', COALESCE(v_top_issues, '[]'::jsonb),
    'repeat_offenders', COALESCE(v_repeat_offenders, '[]'::jsonb),
    'total_disputes', v_total
  );

  RETURN v_result;
END;
$function$;

-- Notification trigger for resolution_offered status
CREATE OR REPLACE FUNCTION public.notify_resolution_offered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'resolution_offered' AND (OLD.status IS NULL OR OLD.status != 'resolution_offered') THEN
    -- Notify raiser
    INSERT INTO email_notifications_queue (event_type, recipient_user_id, payload)
    VALUES ('resolution_offered', NEW.raised_by, jsonb_build_object(
      'dispute_id', NEW.id,
      'job_id', NEW.job_id,
      'resolution_type', NEW.resolution_type,
      'resolution_description', NEW.resolution_description
    ));
    -- Notify counterparty if exists
    IF NEW.counterparty_id IS NOT NULL THEN
      INSERT INTO email_notifications_queue (event_type, recipient_user_id, payload)
      VALUES ('resolution_offered', NEW.counterparty_id, jsonb_build_object(
        'dispute_id', NEW.id,
        'job_id', NEW.job_id,
        'resolution_type', NEW.resolution_type,
        'resolution_description', NEW.resolution_description
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_notify_resolution_offered
  AFTER UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION notify_resolution_offered();
