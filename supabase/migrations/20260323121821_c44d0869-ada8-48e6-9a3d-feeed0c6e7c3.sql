
-- Admin RPC: Get email queue details (pending + failed items)
CREATE OR REPLACE FUNCTION public.admin_email_queue_details()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN jsonb_build_object(
    'pending', (
      SELECT coalesce(jsonb_agg(row_to_json(q)::jsonb ORDER BY q.created_at ASC), '[]'::jsonb)
      FROM (
        SELECT id, job_id, event, attempts, created_at, last_error
        FROM public.email_notifications_queue
        WHERE sent_at IS NULL AND (failed_at IS NULL OR attempts < 3)
        ORDER BY created_at ASC
        LIMIT 50
      ) q
    ),
    'failed', (
      SELECT coalesce(jsonb_agg(row_to_json(q)::jsonb ORDER BY q.created_at DESC), '[]'::jsonb)
      FROM (
        SELECT id, job_id, event, attempts, created_at, last_error
        FROM public.email_notifications_queue
        WHERE sent_at IS NULL AND attempts >= 3
        ORDER BY created_at DESC
        LIMIT 50
      ) q
    )
  );
END;
$$;

-- Admin RPC: Get recent error events
CREATE OR REPLACE FUNCTION public.admin_recent_errors(p_limit int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN coalesce(
    (SELECT jsonb_agg(row_to_json(e)::jsonb)
     FROM (
       SELECT id, error_type, message, stack, url, route, browser, viewport, user_id, created_at
       FROM public.error_events
       ORDER BY created_at DESC
       LIMIT p_limit
     ) e),
    '[]'::jsonb
  );
END;
$$;

-- Admin RPC: Retry a failed email (reset attempts and failed_at)
CREATE OR REPLACE FUNCTION public.admin_retry_failed_email(p_email_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.email_notifications_queue
  SET attempts = 0, last_error = NULL
  WHERE id = p_email_id AND sent_at IS NULL;

  -- Log the admin action
  INSERT INTO public.admin_actions_log (admin_user_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'retry_email', 'email_notification', p_email_id, '{}'::jsonb);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Admin RPC: Retry ALL failed emails
CREATE OR REPLACE FUNCTION public.admin_retry_all_failed_emails()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.email_notifications_queue
  SET attempts = 0, last_error = NULL
  WHERE sent_at IS NULL AND attempts >= 3;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.admin_actions_log (admin_user_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'retry_all_failed_emails', 'email_notification', gen_random_uuid(), jsonb_build_object('count', v_count));

  RETURN jsonb_build_object('success', true, 'retried_count', v_count);
END;
$$;

-- Admin RPC: Get recent network failures
CREATE OR REPLACE FUNCTION public.admin_recent_network_failures(p_limit int DEFAULT 20)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN coalesce(
    (SELECT jsonb_agg(row_to_json(n)::jsonb)
     FROM (
       SELECT id, user_id, method, request_url, status_code, error_message, route, browser, created_at
       FROM public.network_failures
       ORDER BY created_at DESC
       LIMIT p_limit
     ) n),
    '[]'::jsonb
  );
END;
$$;
