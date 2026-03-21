
-- Fix trigger to use valid job status and skip self-reports
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
  SELECT ur.user_id INTO v_admin_id
  FROM public.user_roles ur
  WHERE 'admin' = ANY(ur.roles)
  LIMIT 1;

  -- Skip if no admin or reporter is the admin (no self-chat)
  IF v_admin_id IS NULL OR NEW.user_id = v_admin_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.jobs (
    id, user_id, title, status, is_publicly_listed, category, description
  ) VALUES (
    gen_random_uuid(),
    NEW.user_id,
    'Bug Report: ' || left(NEW.description, 80),
    'in_progress',
    false,
    'support',
    'Auto-generated conversation for bug report ' || NEW.id::text
  )
  RETURNING id INTO v_job_id;

  INSERT INTO public.conversations (job_id, client_id, pro_id)
  VALUES (v_job_id, NEW.user_id, v_admin_id)
  RETURNING id INTO v_conv_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role_in_conversation)
  VALUES (v_conv_id, v_admin_id, 'support'),
         (v_conv_id, NEW.user_id, 'client');

  NEW.conversation_id := v_conv_id;

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
