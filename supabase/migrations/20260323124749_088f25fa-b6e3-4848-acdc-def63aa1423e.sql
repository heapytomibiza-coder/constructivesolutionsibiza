
-- RPC: Compute outcomes for recent admin actions
-- Option A approach: derives status from live data, no new tables
CREATE OR REPLACE FUNCTION public.admin_compute_action_outcomes(
  p_action_types text[] DEFAULT ARRAY['nudge_client', 'notify_matching_pros', 'boost_category'],
  p_limit int DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results jsonb := '[]'::jsonb;
  v_row record;
  v_outcome jsonb;
  v_status text;
  v_details jsonb;
  v_hours_since numeric;
  v_observation_window_hours numeric := 72; -- 3 days
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  FOR v_row IN
    SELECT id, admin_user_id, action_type, target_type, target_id, metadata, created_at
    FROM public.admin_actions_log
    WHERE action_type = ANY(p_action_types)
    ORDER BY created_at DESC
    LIMIT p_limit
  LOOP
    v_hours_since := EXTRACT(EPOCH FROM (now() - v_row.created_at)) / 3600;
    v_status := 'pending';
    v_details := '{}'::jsonb;

    -- Nudge Client: check if conversation got new messages after the action
    IF v_row.action_type = 'nudge_client' THEN
      SELECT jsonb_build_object(
        'new_messages', count(*),
        'client_replied', bool_or(m.sender_id = c.client_id),
        'latest_message_at', max(m.created_at)
      ) INTO v_details
      FROM public.conversations c
      LEFT JOIN public.messages m ON m.conversation_id = c.id
        AND m.created_at > v_row.created_at
      WHERE c.id = v_row.target_id;

      IF (v_details->>'client_replied')::boolean = true THEN
        v_status := 'observed';
      ELSIF v_hours_since > v_observation_window_hours THEN
        v_status := 'expired';
      ELSIF (v_details->>'new_messages')::int > 0 THEN
        v_status := 'observed';
      ELSE
        v_status := 'no_effect';
      END IF;

    -- Notify Pros: check if new conversations were created for the job after the action
    ELSIF v_row.action_type = 'notify_matching_pros' THEN
      SELECT jsonb_build_object(
        'new_conversations', count(*),
        'latest_conversation_at', max(c.created_at),
        'pros_notified', COALESCE((v_row.metadata->>'pros_notified')::int, 0)
      ) INTO v_details
      FROM public.conversations c
      WHERE c.job_id = v_row.target_id
        AND c.created_at > v_row.created_at;

      IF (v_details->>'new_conversations')::int > 0 THEN
        v_status := 'observed';
      ELSIF v_hours_since > v_observation_window_hours THEN
        v_status := 'expired';
      ELSE
        v_status := 'no_effect';
      END IF;

    -- Boost Category: check if supply increased (new professional_services) after the action
    ELSIF v_row.action_type = 'boost_category' THEN
      DECLARE
        v_cat text := v_row.metadata->>'category';
        v_area text := v_row.metadata->>'area';
        v_new_pros int;
      BEGIN
        SELECT count(*) INTO v_new_pros
        FROM public.professional_services ps
        JOIN public.service_micro_categories smc ON smc.id = ps.micro_id
        JOIN public.service_subcategories ssc ON ssc.id = smc.subcategory_id
        JOIN public.service_categories sc ON sc.id = ssc.category_id
        WHERE sc.slug = v_cat
          AND ps.created_at > v_row.created_at;

        v_details := jsonb_build_object(
          'category', v_cat,
          'area', v_area,
          'new_pros_in_category', v_new_pros
        );

        IF v_new_pros > 0 THEN
          v_status := 'observed';
        ELSIF v_hours_since > v_observation_window_hours * 2 THEN
          v_status := 'expired';
        ELSE
          v_status := 'no_effect';
        END IF;
      END;
    END IF;

    -- For pending: if still within window and no effect yet
    IF v_status = 'no_effect' AND v_hours_since < 24 THEN
      v_status := 'pending';
    END IF;

    v_outcome := jsonb_build_object(
      'action_id', v_row.id,
      'action_type', v_row.action_type,
      'target_type', v_row.target_type,
      'target_id', v_row.target_id,
      'admin_user_id', v_row.admin_user_id,
      'action_metadata', v_row.metadata,
      'created_at', v_row.created_at,
      'hours_since', round(v_hours_since::numeric, 1),
      'outcome_status', v_status,
      'outcome_details', v_details
    );

    v_results := v_results || v_outcome;
  END LOOP;

  RETURN v_results;
END;
$$;
