
CREATE OR REPLACE FUNCTION public.rpc_dispute_qa_health_checks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  dup_count integer;
  orphan_count integer;
  resolved_no_accept integer;
  stale_email_count integer;
BEGIN
  -- Admin dual-gate
  IF NOT (has_role(auth.uid(), 'admin') AND is_admin_email()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check 1: No duplicate active analyses
  SELECT count(*) INTO dup_count
  FROM (
    SELECT dispute_id
    FROM dispute_analysis
    WHERE is_current = true
    GROUP BY dispute_id
    HAVING count(*) > 1
  ) x;
  result := result || jsonb_build_object('duplicate_active_analyses', jsonb_build_object(
    'pass', dup_count = 0,
    'count', dup_count
  ));

  -- Check 2: No orphaned disputes (no status history)
  SELECT count(*) INTO orphan_count
  FROM disputes d
  WHERE NOT EXISTS (
    SELECT 1 FROM dispute_status_history h WHERE h.dispute_id = d.id
  );
  result := result || jsonb_build_object('orphaned_disputes', jsonb_build_object(
    'pass', orphan_count = 0,
    'count', orphan_count
  ));

  -- Check 3: All resolved disputes have resolution_accepted_at
  SELECT count(*) INTO resolved_no_accept
  FROM disputes
  WHERE status = 'resolved' AND resolution_accepted_at IS NULL;
  result := result || jsonb_build_object('resolved_without_acceptance', jsonb_build_object(
    'pass', resolved_no_accept = 0,
    'count', resolved_no_accept
  ));

  -- Check 4: No stale pending emails (dispute-related, stuck > 1 hour)
  SELECT count(*) INTO stale_email_count
  FROM email_notifications_queue
  WHERE event_type LIKE 'dispute%'
    AND sent_at IS NULL
    AND failed_at IS NULL
    AND created_at < now() - interval '1 hour';
  result := result || jsonb_build_object('stale_dispute_emails', jsonb_build_object(
    'pass', stale_email_count = 0,
    'count', stale_email_count
  ));

  RETURN result;
END;
$$;
