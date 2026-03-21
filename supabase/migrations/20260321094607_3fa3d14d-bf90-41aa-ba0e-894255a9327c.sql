
-- Add conversation_id to tester_reports
ALTER TABLE public.tester_reports
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id);

-- RPC: create a support conversation for a bug report
CREATE OR REPLACE FUNCTION public.rpc_create_bug_report_conversation(p_report_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_report record;
  v_admin_id uuid := auth.uid();
  v_job_id uuid;
  v_conv_id uuid;
BEGIN
  -- Must be admin
  IF NOT (has_role(v_admin_id, 'admin') AND is_admin_email()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get report
  SELECT * INTO v_report FROM tester_reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found';
  END IF;

  -- If already has conversation, return it
  IF v_report.conversation_id IS NOT NULL THEN
    RETURN v_report.conversation_id;
  END IF;

  -- Create a system job for the conversation (required by conversations FK)
  INSERT INTO public.jobs (
    id, user_id, title, status, is_publicly_listed, category, description
  ) VALUES (
    gen_random_uuid(),
    v_report.user_id,
    'Bug Report Support: ' || left(v_report.description, 60),
    'active',
    false,
    'support',
    'System-generated conversation for bug report ' || p_report_id::text
  )
  RETURNING id INTO v_job_id;

  -- Create conversation
  INSERT INTO public.conversations (
    job_id, client_id, pro_id
  ) VALUES (
    v_job_id,
    v_report.user_id,
    v_admin_id
  )
  RETURNING id INTO v_conv_id;

  -- Add admin as participant
  INSERT INTO public.conversation_participants (
    conversation_id, user_id, role_in_conversation
  ) VALUES (v_conv_id, v_admin_id, 'support');

  -- Add reporter as participant
  INSERT INTO public.conversation_participants (
    conversation_id, user_id, role_in_conversation
  ) VALUES (v_conv_id, v_report.user_id, 'client');

  -- Link conversation to report
  UPDATE tester_reports SET conversation_id = v_conv_id WHERE id = p_report_id;

  -- Update report status
  UPDATE tester_reports SET status = 'in_progress' WHERE id = p_report_id AND status = 'open';

  -- Send system message
  INSERT INTO public.messages (conversation_id, sender_id, body, message_type, metadata)
  VALUES (v_conv_id, v_admin_id, 'CSI Support is reaching out regarding your bug report.', 'system',
    jsonb_build_object('bug_report_id', p_report_id, 'description', left(v_report.description, 200)));

  RETURN v_conv_id;
END;
$$;
