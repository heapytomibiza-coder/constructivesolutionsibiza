-- Track 3: Suggestion Layer (additive, no matching changes)
-- Option C: minimal compatibility adjustments to preserve existing Phase 2 schema.

-- 1) Preserve existing table; add accepted_at only if missing.
ALTER TABLE public.job_classification_suggestions
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_job_classification_suggestions_job_id
  ON public.job_classification_suggestions(job_id);

CREATE INDEX IF NOT EXISTS idx_job_classification_suggestions_status
  ON public.job_classification_suggestions(status);

-- 2) Generator RPC (heuristic-v1). Sets model_name to satisfy existing NOT NULL constraint.
CREATE OR REPLACE FUNCTION public.generate_job_classification_suggestions(p_job_id uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job record;
  v_text text;
  v_suggestions text[] := '{}';
BEGIN
  SELECT id, title, description, category, subcategory, is_custom_request
  INTO v_job
  FROM public.jobs
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'job_not_found';
  END IF;

  IF v_job.is_custom_request IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'job_not_custom_request';
  END IF;

  -- Do not overwrite existing suggestions
  IF EXISTS (
    SELECT 1
    FROM public.job_classification_suggestions s
    WHERE s.job_id = p_job_id
  ) THEN
    SELECT s.suggested_micro_slugs
    INTO v_suggestions
    FROM public.job_classification_suggestions s
    WHERE s.job_id = p_job_id
    ORDER BY s.created_at DESC
    LIMIT 1;
    RETURN COALESCE(v_suggestions, '{}');
  END IF;

  v_text := lower(trim(concat_ws(' ', coalesce(v_job.title, ''), coalesce(v_job.description, ''))));

  -- Primary heuristic: match job text against active micro slugs/names
  SELECT COALESCE(array_agg(candidate.slug), '{}')
  INTO v_suggestions
  FROM (
    SELECT DISTINCT smc.slug
    FROM public.service_micro_categories smc
    WHERE smc.is_active = true
      AND (
        v_text ILIKE '%' || smc.slug || '%'
        OR v_text ILIKE '%' || replace(smc.slug, '-', ' ') || '%'
        OR v_text ILIKE '%' || lower(coalesce(smc.name, '')) || '%'
      )
    ORDER BY smc.slug
    LIMIT 5
  ) candidate;

  -- Fallback heuristic by category/subcategory if no direct text match
  IF COALESCE(array_length(v_suggestions, 1), 0) = 0 THEN
    SELECT COALESCE(array_agg(candidate.slug), '{}')
    INTO v_suggestions
    FROM (
      SELECT DISTINCT smc.slug
      FROM public.service_micro_categories smc
      JOIN public.service_subcategories ssub ON ssub.id = smc.subcategory_id
      JOIN public.service_categories scat ON scat.id = ssub.category_id
      WHERE smc.is_active = true
        AND (
          (v_job.subcategory IS NOT NULL AND ssub.slug = v_job.subcategory)
          OR (v_job.category IS NOT NULL AND scat.slug = v_job.category)
        )
      ORDER BY smc.slug
      LIMIT 5
    ) candidate;
  END IF;

  -- Final safety fallback: return one active micro if nothing matched
  IF COALESCE(array_length(v_suggestions, 1), 0) = 0 THEN
    SELECT ARRAY[
      (
        SELECT smc.slug
        FROM public.service_micro_categories smc
        WHERE smc.is_active = true
        ORDER BY smc.slug
        LIMIT 1
      )
    ]
    INTO v_suggestions;
    v_suggestions := array_remove(v_suggestions, NULL);
  END IF;

  INSERT INTO public.job_classification_suggestions (
    job_id,
    model_name,
    suggested_micro_slugs,
    status,
    created_at
  )
  VALUES (
    p_job_id,
    'heuristic-v1',
    COALESCE(v_suggestions, '{}'),
    'pending',
    now()
  );

  RETURN COALESCE(v_suggestions, '{}');
END;
$$;

-- 3) Reader RPC. Includes accepted_at (now guaranteed to exist).
CREATE OR REPLACE FUNCTION public.get_job_classification_suggestions(p_job_id uuid)
RETURNS TABLE(
  id uuid,
  job_id uuid,
  suggested_micro_slugs text[],
  status text,
  created_at timestamptz,
  accepted_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.job_id,
    s.suggested_micro_slugs,
    s.status,
    s.created_at,
    s.accepted_at
  FROM public.job_classification_suggestions s
  WHERE s.job_id = p_job_id
  ORDER BY s.created_at DESC;
$$;