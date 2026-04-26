CREATE OR REPLACE FUNCTION public.generate_job_classification_suggestions(p_job_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_job record;
  v_text text;
  v_suggestions text[] := '{}';
  v_keyword_candidates text[] := '{}';
  v_reasoning text := 'no match';
  v_matched_groups text[] := '{}';
  -- Curated keyword groups: regex pattern + ordered preferred slugs.
  -- The first slug in each preferred list that exists & is active is chosen.
  v_keyword_map text[][] := ARRAY[
    -- Drainage / blockages
    ARRAY['(^|[^a-z])(drain|drains|drainage|blocked drain|blockage|unblock|unblocking|clogged)([^a-z]|$)',
          'guttering-drainage,foundation-drainage,pipe-repair',
          'drain'],
    -- Leaks (tightened: no broad %water% expansion)
    ARRAY['(^|[^a-z])(leak|leaks|leaking|water leak|dripping)([^a-z]|$)',
          'fix-leak,burst-pipe,pipe-repair,ac-leak-detection-repair',
          'leak'],
    -- Burst pipe
    ARRAY['(^|[^a-z])(burst pipe|pipe burst|burst water)([^a-z]|$)',
          'burst-pipe,pipe-repair,fix-leak',
          'burst-pipe'],
    -- General pipework
    ARRAY['(^|[^a-z])(pipe|pipes|pipework|waste pipe|piping)([^a-z]|$)',
          'pipe-repair,burst-pipe,fix-leak',
          'pipe'],
    -- Toilet
    ARRAY['(^|[^a-z])(toilet|wc|loo|cistern)([^a-z]|$)',
          'install-toilet,toilet-installation',
          'toilet'],
    -- Sink
    ARRAY['(^|[^a-z])(sink|basin|kitchen sink|bathroom sink)([^a-z]|$)',
          'install-sink,sink-installation,install-kitchen-sink',
          'sink'],
    -- Shower
    ARRAY['(^|[^a-z])(shower|wetroom|wet room)([^a-z]|$)',
          'install-shower,shower-installation,shower-wetroom-tiling,electric-shower-circuits',
          'shower'],
    -- Tap / faucet
    ARRAY['(^|[^a-z])(tap|taps|faucet|mixer tap)([^a-z]|$)',
          'tap-installation,fix-leak',
          'tap'],
    -- Bathroom
    ARRAY['(^|[^a-z])(bathroom|en-suite|ensuite)([^a-z]|$)',
          'bathroom-renovation,bathroom-design,bathroom-extractor-installation',
          'bathroom'],
    -- Boiler / hot water
    ARRAY['(^|[^a-z])(boiler|hot water|water heater|immersion)([^a-z]|$)',
          'boiler-repair,boiler-installation,water-heater-emergency',
          'boiler']
  ];
  v_pattern text;
  v_preferred text[];
  v_label text;
  v_slug text;
  v_chosen text;
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

  -- 1) Direct text-match against active micro slugs/names
  SELECT COALESCE(array_agg(candidate.slug), '{}')
  INTO v_suggestions
  FROM (
    SELECT DISTINCT smc.slug
    FROM public.service_micro_categories smc
    WHERE smc.is_active = true
      AND length(v_text) > 0
      AND (
        v_text ILIKE '%' || smc.slug || '%'
        OR v_text ILIKE '%' || replace(smc.slug, '-', ' ') || '%'
        OR (coalesce(smc.name, '') <> '' AND v_text ILIKE '%' || lower(smc.name) || '%')
      )
    ORDER BY smc.slug
    LIMIT 5
  ) candidate;

  IF COALESCE(array_length(v_suggestions, 1), 0) > 0 THEN
    v_reasoning := 'text-match';
  END IF;

  -- 2) Curated keyword-group pass (only if direct text-match found nothing)
  IF COALESCE(array_length(v_suggestions, 1), 0) = 0 AND length(v_text) > 0 THEN
    FOR i IN 1..array_length(v_keyword_map, 1) LOOP
      v_pattern := v_keyword_map[i][1];
      v_preferred := string_to_array(v_keyword_map[i][2], ',');
      v_label := v_keyword_map[i][3];

      IF v_text ~ v_pattern THEN
        v_chosen := NULL;
        FOREACH v_slug IN ARRAY v_preferred LOOP
          IF EXISTS (
            SELECT 1 FROM public.service_micro_categories
            WHERE slug = v_slug AND is_active = true
          ) THEN
            v_chosen := v_slug;
            EXIT;
          END IF;
        END LOOP;

        IF v_chosen IS NOT NULL
           AND NOT (v_chosen = ANY(v_keyword_candidates)) THEN
          v_keyword_candidates := array_append(v_keyword_candidates, v_chosen);
          v_matched_groups := array_append(v_matched_groups, v_label);
        END IF;
      END IF;

      EXIT WHEN array_length(v_keyword_candidates, 1) >= 5;
    END LOOP;

    IF COALESCE(array_length(v_keyword_candidates, 1), 0) > 0 THEN
      v_suggestions := v_keyword_candidates;
      v_reasoning := 'keyword: ' || array_to_string(v_matched_groups, ',');
    END IF;
  END IF;

  -- 3) Category / subcategory fallback (only if still nothing)
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

    IF COALESCE(array_length(v_suggestions, 1), 0) > 0 THEN
      v_reasoning := 'category fallback';
    END IF;
  END IF;

  -- NOTE: The previous alphabetical "first active micro" safety fallback has been
  -- intentionally removed. Jobs with no signal now insert an empty array.

  -- Hard cap to 5
  IF COALESCE(array_length(v_suggestions, 1), 0) > 5 THEN
    v_suggestions := v_suggestions[1:5];
  END IF;

  INSERT INTO public.job_classification_suggestions (
    job_id,
    model_name,
    suggested_micro_slugs,
    status,
    reasoning_summary,
    created_at
  )
  VALUES (
    p_job_id,
    'heuristic-v1',
    COALESCE(v_suggestions, '{}'),
    'pending',
    v_reasoning,
    now()
  );

  RETURN COALESCE(v_suggestions, '{}');
END;
$function$;