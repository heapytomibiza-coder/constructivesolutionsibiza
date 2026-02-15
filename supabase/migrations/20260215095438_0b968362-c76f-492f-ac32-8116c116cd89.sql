
-- Add "No Pro Reply" RPC for unanswered jobs v2
CREATE OR REPLACE FUNCTION public.admin_no_pro_reply_jobs(
  p_from_ts timestamptz DEFAULT now() - interval '30 days',
  p_to_ts timestamptz DEFAULT now(),
  p_hours_threshold int DEFAULT 6
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT
      j.id,
      j.title,
      j.category,
      j.area,
      j.budget_type,
      j.budget_value,
      j.created_at,
      ROUND(EXTRACT(EPOCH FROM (now() - j.created_at)) / 3600, 1) AS hours_waiting,
      (SELECT count(*) FROM public.conversations c WHERE c.job_id = j.id) AS conversation_count,
      0::bigint AS pro_message_count
    FROM public.jobs j
    WHERE j.created_at BETWEEN p_from_ts AND p_to_ts
      AND j.status = 'open'
      AND j.is_publicly_listed = true
      AND EXISTS (
        SELECT 1 FROM public.conversations c WHERE c.job_id = j.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.conversations c
        JOIN public.messages m ON m.conversation_id = c.id AND m.sender_id = c.pro_id
        WHERE c.job_id = j.id
      )
      AND EXTRACT(EPOCH FROM (now() - j.created_at)) / 3600 >= p_hours_threshold
    ORDER BY j.created_at ASC
  ) r;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
