-- Phase 2B-Ops: admin visibility + manual classification path for custom jobs.
-- Scope: operational support only; no matching/ranking logic changes.

-- 1) Admin queue RPC (read-only)
CREATE OR REPLACE FUNCTION public.admin_custom_jobs_classification_queue(p_limit int DEFAULT 100)
RETURNS TABLE(
  job_id uuid,
  created_at timestamptz,
  title text,
  category text,
  subcategory text,
  area text,
  description text,
  has_jml boolean,
  has_accepted_classification boolean,
  suggestion_status text,
  suggested_micro_slugs text[],
  latest_suggested_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF to_regclass('public.job_classification_suggestions') IS NULL THEN
    RETURN QUERY
    SELECT
      j.id,
      j.created_at,
      j.title,
      j.category,
      j.subcategory,
      j.area,
      j.description,
      EXISTS (
        SELECT 1 FROM public.job_micro_links jml WHERE jml.job_id = j.id
      ) AS has_jml,
      false AS has_accepted_classification,
      'none'::text AS suggestion_status,
      NULL::text[] AS suggested_micro_slugs,
      NULL::timestamptz AS latest_suggested_at
    FROM public.jobs j
    WHERE j.status = 'open'
      AND j.is_publicly_listed = true
      AND j.is_custom_request = true
      AND NOT EXISTS (
        SELECT 1 FROM public.job_micro_links jml WHERE jml.job_id = j.id
      )
    ORDER BY j.created_at DESC
    LIMIT p_limit;
    RETURN;
  END IF;

  RETURN QUERY
  WITH suggestion_state AS (
    SELECT
      s.job_id,
      bool_or(COALESCE(s.status, '') = 'accepted' OR s.accepted_at IS NOT NULL) AS has_accepted,
      (array_agg(COALESCE(s.status, 'pending') ORDER BY s.created_at DESC))[1] AS latest_status,
      (array_agg(s.suggested_micro_slugs ORDER BY s.created_at DESC))[1] AS latest_suggested_micro_slugs,
      max(s.created_at) AS latest_suggested_at
    FROM public.job_classification_suggestions s
    GROUP BY s.job_id
  )
  SELECT
    j.id,
    j.created_at,
    j.title,
    j.category,
    j.subcategory,
    j.area,
    j.description,
    EXISTS (
      SELECT 1 FROM public.job_micro_links jml WHERE jml.job_id = j.id
    ) AS has_jml,
    COALESCE(ss.has_accepted, false) AS has_accepted_classification,
    COALESCE(ss.latest_status, 'none') AS suggestion_status,
    ss.latest_suggested_micro_slugs,
    ss.latest_suggested_at
  FROM public.jobs j
  LEFT JOIN suggestion_state ss ON ss.job_id = j.id
  WHERE j.status = 'open'
    AND j.is_publicly_listed = true
    AND j.is_custom_request = true
    AND NOT EXISTS (
      SELECT 1 FROM public.job_micro_links jml WHERE jml.job_id = j.id
    )
    AND COALESCE(ss.has_accepted, false) = false
    AND COALESCE(ss.latest_status, 'none') IN ('none', 'pending')
  ORDER BY j.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 2) Admin manual action RPC
-- Sets selected.microSlugs for a custom job so existing pipeline can make it matchable.
-- No auto-guessing: admin must provide explicit p_micro_slugs.
CREATE OR REPLACE FUNCTION public.admin_set_custom_job_micro_slugs(
  p_job_id uuid,
  p_micro_slugs text[],
  p_note text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job record;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF p_job_id IS NULL THEN
    RAISE EXCEPTION 'job_id_required';
  END IF;

  IF p_micro_slugs IS NULL OR array_length(p_micro_slugs, 1) IS NULL THEN
    RAISE EXCEPTION 'micro_slugs_required';
  END IF;

  SELECT id, is_custom_request, status, is_publicly_listed
  INTO v_job
  FROM public.jobs
  WHERE id = p_job_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'job_not_found';
  END IF;

  IF v_job.is_custom_request IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'job_not_custom_request';
  END IF;

  IF v_job.status IS DISTINCT FROM 'open' OR v_job.is_publicly_listed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'job_not_open_public';
  END IF;

  UPDATE public.jobs
  SET
    answers = jsonb_set(
      jsonb_set(COALESCE(answers, '{}'::jsonb), '{selected}', COALESCE(answers->'selected', '{}'::jsonb), true),
      '{selected,microSlugs}',
      to_jsonb(p_micro_slugs),
      true
    ),
    -- Compatibility write; does not change matching design decisions by itself.
    micro_slug = COALESCE(p_micro_slugs[1], micro_slug),
    updated_at = now()
  WHERE id = p_job_id;

  INSERT INTO public.admin_actions_log (admin_user_id, action_type, target_type, target_id, metadata)
  VALUES (
    auth.uid(),
    'set_custom_job_micro_slugs',
    'job',
    p_job_id,
    jsonb_build_object('micro_slugs', p_micro_slugs, 'note', p_note)
  );

  RETURN jsonb_build_object(
    'success', true,
    'job_id', p_job_id,
    'micro_slugs_set', p_micro_slugs,
    'micro_count', array_length(p_micro_slugs, 1)
  );
END;
$$;