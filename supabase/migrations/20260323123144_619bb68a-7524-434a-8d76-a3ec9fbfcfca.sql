
-- RPC: Notify matching pros for an unanswered job
-- Enqueues email notifications to professionals who offer services in the job's category
CREATE OR REPLACE FUNCTION public.admin_notify_matching_pros(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job record;
  v_pro_count int := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Get job details
  SELECT id, title, category, area, micro_slug INTO v_job
  FROM public.jobs
  WHERE id = p_job_id AND status = 'open' AND is_publicly_listed = true;

  IF v_job.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found or not open');
  END IF;

  -- Find matching pros and enqueue notifications
  INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
  SELECT
    'admin_job_nudge',
    ps.user_id,
    jsonb_build_object(
      'job_id', v_job.id,
      'job_title', v_job.title,
      'category', v_job.category,
      'area', v_job.area,
      'triggered_by', 'admin_action'
    )
  FROM public.professional_services ps
  JOIN public.service_micro_categories smc ON smc.id = ps.micro_id
  WHERE smc.slug = v_job.micro_slug
    AND ps.status = 'offered'
    AND ps.notify = true
    -- Don't notify pros who already have a conversation for this job
    AND NOT EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.job_id = v_job.id AND c.pro_id = ps.user_id
    );

  GET DIAGNOSTICS v_pro_count = ROW_COUNT;

  -- Log admin action
  INSERT INTO public.admin_actions_log (admin_user_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'notify_matching_pros', 'job', p_job_id,
    jsonb_build_object('pros_notified', v_pro_count, 'category', v_job.category, 'area', v_job.area));

  RETURN jsonb_build_object('success', true, 'pros_notified', v_pro_count);
END;
$$;

-- RPC: Nudge client about a stale conversation
-- Enqueues a reminder email to the job owner
CREATE OR REPLACE FUNCTION public.admin_nudge_client(p_conversation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv record;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT c.id, c.client_id, c.job_id, j.title as job_title
  INTO v_conv
  FROM public.conversations c
  JOIN public.jobs j ON j.id = c.job_id
  WHERE c.id = p_conversation_id;

  IF v_conv.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
  END IF;

  -- Enqueue nudge email
  INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
  VALUES (
    'admin_client_nudge',
    v_conv.client_id,
    jsonb_build_object(
      'conversation_id', v_conv.id,
      'job_id', v_conv.job_id,
      'job_title', v_conv.job_title,
      'triggered_by', 'admin_action'
    )
  );

  -- Log admin action
  INSERT INTO public.admin_actions_log (admin_user_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'nudge_client', 'conversation', p_conversation_id,
    jsonb_build_object('client_id', v_conv.client_id, 'job_title', v_conv.job_title));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: Log a market gap boost action (records admin intent to prioritize a category+area)
CREATE OR REPLACE FUNCTION public.admin_boost_category(p_category text, p_area text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Log the boost action
  INSERT INTO public.admin_actions_log (admin_user_id, action_type, target_type, target_id, metadata)
  VALUES (auth.uid(), 'boost_category', 'category', gen_random_uuid(),
    jsonb_build_object('category', p_category, 'area', p_area, 'boosted_at', now()));

  RETURN jsonb_build_object('success', true, 'category', p_category, 'area', p_area);
END;
$$;
