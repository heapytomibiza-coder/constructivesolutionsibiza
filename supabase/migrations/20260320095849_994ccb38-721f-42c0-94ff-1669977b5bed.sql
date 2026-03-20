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
  v_updated record;
BEGIN
  SELECT * INTO v_dispute FROM disputes WHERE id = p_dispute_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispute not found';
  END IF;

  v_is_admin := has_role(v_user_id, 'admin');

  IF NOT v_is_admin AND v_user_id != v_dispute.raised_by AND v_user_id != v_dispute.counterparty_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE disputes
  SET status = p_new_status::dispute_status,
      updated_at = now()
  WHERE id = p_dispute_id
  RETURNING * INTO v_updated;

  RETURN to_jsonb(v_updated);
END;
$$