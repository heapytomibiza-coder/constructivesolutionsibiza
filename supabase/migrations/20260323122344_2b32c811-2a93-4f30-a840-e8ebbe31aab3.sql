
-- Fix 1: Retry single email — clear failed_at + tighten to only truly failed rows
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
  SET attempts = 0, last_error = NULL, failed_at = NULL
  WHERE id = p_email_id
    AND sent_at IS NULL
    AND (attempts >= 3 OR failed_at IS NOT NULL);

  INSERT INTO public.admin_actions_log (admin_user_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'retry_email', 'email_notification', p_email_id, '{}'::jsonb);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Fix 2: Retry all failed — clear failed_at
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
  SET attempts = 0, last_error = NULL, failed_at = NULL
  WHERE sent_at IS NULL
    AND (attempts >= 3 OR failed_at IS NOT NULL);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.admin_actions_log (admin_user_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'retry_all_failed_emails', 'email_notification', gen_random_uuid(), jsonb_build_object('count', v_count));

  RETURN jsonb_build_object('success', true, 'retried_count', v_count);
END;
$$;

-- Fix 3: Email queue details — use correct column names for email_notifications_queue
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
        SELECT id, event_type as event, attempts, created_at, last_error, recipient_user_id
        FROM public.email_notifications_queue
        WHERE sent_at IS NULL AND (failed_at IS NULL AND attempts < 3)
        ORDER BY created_at ASC
        LIMIT 50
      ) q
    ),
    'failed', (
      SELECT coalesce(jsonb_agg(row_to_json(q)::jsonb ORDER BY q.created_at DESC), '[]'::jsonb)
      FROM (
        SELECT id, event_type as event, attempts, created_at, last_error, failed_at, recipient_user_id
        FROM public.email_notifications_queue
        WHERE sent_at IS NULL AND (attempts >= 3 OR failed_at IS NOT NULL)
        ORDER BY created_at DESC
        LIMIT 50
      ) q
    )
  );
END;
$$;
