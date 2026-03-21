
-- Trigger function: auto-create conversation when a bug report is inserted
CREATE OR REPLACE FUNCTION public.auto_create_bug_report_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id uuid;
  v_job_id uuid;
  v_conv_id uuid;
BEGIN
  -- Find admin user
  SELECT ur.user_id INTO v_admin_id
  FROM public.user_roles ur
  WHERE 'admin' = ANY(ur.roles)
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create a system job for the conversation
  INSERT INTO public.jobs (
    id, user_id, title, status, is_publicly_listed, category, description
  ) VALUES (
    gen_random_uuid(),
    NEW.user_id,
    'Bug Report: ' || left(NEW.description, 80),
    'active',
    false,
    'support',
    'Auto-generated conversation for bug report ' || NEW.id::text
  )
  RETURNING id INTO v_job_id;

  -- Create conversation
  INSERT INTO public.conversations (
    job_id, client_id, pro_id
  ) VALUES (
    v_job_id,
    NEW.user_id,
    v_admin_id
  )
  RETURNING id INTO v_conv_id;

  -- Add participants
  INSERT INTO public.conversation_participants (conversation_id, user_id, role_in_conversation)
  VALUES (v_conv_id, v_admin_id, 'support'),
         (v_conv_id, NEW.user_id, 'client');

  -- Link conversation to report
  NEW.conversation_id := v_conv_id;

  -- Send system message with bug details
  INSERT INTO public.messages (conversation_id, sender_id, body, message_type, metadata)
  VALUES (
    v_conv_id,
    NEW.user_id,
    '🐛 Bug Report: ' || left(NEW.description, 500),
    'system',
    jsonb_build_object(
      'system_sender', 'bug-report',
      'bug_report_id', NEW.id,
      'url', COALESCE(NEW.url, ''),
      'route', COALESCE(NEW.route, ''),
      'viewport', COALESCE(NEW.viewport, ''),
      'browser', COALESCE(left(NEW.browser, 100), '')
    )
  );

  RETURN NEW;
END;
$$;

-- Attach trigger (BEFORE INSERT so we can set conversation_id on NEW)
CREATE TRIGGER trg_auto_bug_report_conversation
  BEFORE INSERT ON public.tester_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_bug_report_conversation();
