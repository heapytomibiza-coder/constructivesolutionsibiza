-- Trigger to enqueue counterparty notification when dispute is created
CREATE OR REPLACE FUNCTION public.notify_dispute_counterparty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.counterparty_id IS NOT NULL AND NEW.status = 'open' THEN
    INSERT INTO email_notifications_queue (event_type, recipient_user_id, payload)
    VALUES (
      'dispute_opened',
      NEW.counterparty_id,
      jsonb_build_object(
        'dispute_id', NEW.id,
        'job_id', NEW.job_id,
        'issue_types', NEW.issue_types,
        'raised_by_role', NEW.raised_by_role,
        'requested_outcome', NEW.requested_outcome,
        'response_deadline', NEW.response_deadline,
        'evidence_deadline', NEW.evidence_deadline
      )
    );
    -- Also notify admin
    INSERT INTO email_notifications_queue (event_type, recipient_user_id, payload)
    VALUES (
      'admin_dispute_opened',
      NULL,
      jsonb_build_object(
        'dispute_id', NEW.id,
        'job_id', NEW.job_id,
        'issue_types', NEW.issue_types,
        'raised_by_role', NEW.raised_by_role,
        'requested_outcome', NEW.requested_outcome
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_dispute_counterparty
  AFTER INSERT ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION notify_dispute_counterparty();

-- Trigger to notify when counterparty responds (submits input)
CREATE OR REPLACE FUNCTION public.notify_dispute_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute record;
  v_notify_user_id uuid;
BEGIN
  SELECT * INTO v_dispute FROM disputes WHERE id = NEW.dispute_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Notify the other party
  IF NEW.user_id = v_dispute.raised_by THEN
    v_notify_user_id := v_dispute.counterparty_id;
  ELSE
    v_notify_user_id := v_dispute.raised_by;
  END IF;

  IF v_notify_user_id IS NOT NULL THEN
    INSERT INTO email_notifications_queue (event_type, recipient_user_id, payload)
    VALUES (
      'dispute_response_submitted',
      v_notify_user_id,
      jsonb_build_object(
        'dispute_id', NEW.dispute_id,
        'job_id', v_dispute.job_id,
        'responder_role', CASE WHEN NEW.user_id = v_dispute.raised_by THEN v_dispute.raised_by_role ELSE 'counterparty' END
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_dispute_response
  AFTER INSERT ON dispute_inputs
  FOR EACH ROW
  EXECUTE FUNCTION notify_dispute_response();

-- Trigger to notify when evidence is uploaded
CREATE OR REPLACE FUNCTION public.notify_dispute_evidence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute record;
  v_notify_user_id uuid;
BEGIN
  SELECT * INTO v_dispute FROM disputes WHERE id = NEW.dispute_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.user_id = v_dispute.raised_by THEN
    v_notify_user_id := v_dispute.counterparty_id;
  ELSE
    v_notify_user_id := v_dispute.raised_by;
  END IF;

  IF v_notify_user_id IS NOT NULL THEN
    INSERT INTO email_notifications_queue (event_type, recipient_user_id, payload)
    VALUES (
      'dispute_evidence_uploaded',
      v_notify_user_id,
      jsonb_build_object(
        'dispute_id', NEW.dispute_id,
        'job_id', v_dispute.job_id,
        'evidence_category', NEW.evidence_category,
        'file_type', NEW.file_type
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_dispute_evidence
  AFTER INSERT ON dispute_evidence
  FOR EACH ROW
  EXECUTE FUNCTION notify_dispute_evidence();

-- RLS: Allow counterparty to insert dispute_inputs
CREATE POLICY "Dispute parties can insert inputs"
  ON dispute_inputs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM disputes d
      WHERE d.id = dispute_inputs.dispute_id
      AND (d.raised_by = auth.uid() OR d.counterparty_id = auth.uid())
    )
  );

-- RLS: Allow dispute parties to view inputs
CREATE POLICY "Dispute parties can view inputs"
  ON dispute_inputs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM disputes d
      WHERE d.id = dispute_inputs.dispute_id
      AND (d.raised_by = auth.uid() OR d.counterparty_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
  );

-- RLS: Allow counterparty to insert evidence
CREATE POLICY "Dispute parties can insert evidence"
  ON dispute_evidence
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM disputes d
      WHERE d.id = dispute_evidence.dispute_id
      AND (d.raised_by = auth.uid() OR d.counterparty_id = auth.uid())
    )
  );

-- RLS: Allow dispute parties to view evidence
CREATE POLICY "Dispute parties can view evidence"
  ON dispute_evidence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM disputes d
      WHERE d.id = dispute_evidence.dispute_id
      AND (d.raised_by = auth.uid() OR d.counterparty_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
  );

-- RLS: Allow dispute parties to view disputes
CREATE POLICY "Dispute parties can view disputes"
  ON disputes
  FOR SELECT
  TO authenticated
  USING (
    raised_by = auth.uid() OR counterparty_id = auth.uid() OR has_role(auth.uid(), 'admin')
  )