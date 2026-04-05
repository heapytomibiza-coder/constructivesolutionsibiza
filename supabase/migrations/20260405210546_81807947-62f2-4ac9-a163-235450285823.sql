
-- 1. Rules evaluation trigger function
CREATE OR REPLACE FUNCTION public.evaluate_pack_rules_on_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_micro_key text;
  v_micro_answers jsonb;
  v_rules jsonb;
  v_rule jsonb;
  v_answer_raw jsonb;
  v_when_op text;
  v_match boolean;
  v_flags text[] := '{}';
  v_inspection_bias text;
  v_safety text;
  v_insp_priority int := 0;
  v_safe_priority int := 0;
  v_cur_insp int;
  v_cur_safe int;
BEGIN
  -- Only evaluate when answers change
  IF TG_OP = 'UPDATE' AND NEW.answers IS NOT DISTINCT FROM OLD.answers THEN
    RETURN NEW;
  END IF;

  -- Skip if no microAnswers
  IF NEW.answers IS NULL OR NEW.answers->'microAnswers' IS NULL THEN
    RETURN NEW;
  END IF;

  -- Iterate each micro in answers
  FOR v_micro_key IN SELECT jsonb_object_keys(NEW.answers->'microAnswers')
  LOOP
    -- Skip metadata keys (start with underscore)
    IF v_micro_key LIKE E'\\_%' THEN CONTINUE; END IF;

    v_micro_answers := NEW.answers->'microAnswers'->v_micro_key;
    IF v_micro_answers IS NULL OR jsonb_typeof(v_micro_answers) != 'object' THEN CONTINUE; END IF;

    -- Fetch rules for this micro
    SELECT qp.metadata->'rules' INTO v_rules
    FROM question_packs qp
    WHERE qp.micro_slug = v_micro_key
      AND qp.metadata->'rules' IS NOT NULL
      AND jsonb_typeof(qp.metadata->'rules') = 'array'
      AND jsonb_array_length(qp.metadata->'rules') > 0
    LIMIT 1;

    IF v_rules IS NULL THEN CONTINUE; END IF;

    -- Evaluate each rule
    FOR v_rule IN SELECT jsonb_array_elements(v_rules)
    LOOP
      v_when_op := v_rule->'when'->>'op';
      v_answer_raw := v_micro_answers->(v_rule->'when'->>'questionId');

      IF v_answer_raw IS NULL THEN CONTINUE; END IF;

      -- Normalize: handle { "value": "x" } wrapper
      IF jsonb_typeof(v_answer_raw) = 'object' AND v_answer_raw ? 'value' THEN
        v_answer_raw := v_answer_raw->'value';
      END IF;

      v_match := false;

      CASE v_when_op
        WHEN 'eq' THEN
          v_match := (v_answer_raw #>> '{}') = (v_rule->'when'->'value' #>> '{}');

        WHEN 'in' THEN
          IF jsonb_typeof(v_rule->'when'->'value') = 'array' THEN
            IF jsonb_typeof(v_answer_raw) = 'array' THEN
              v_match := EXISTS (
                SELECT 1 FROM jsonb_array_elements(v_answer_raw) a,
                              jsonb_array_elements(v_rule->'when'->'value') r
                WHERE a = r
              );
            ELSE
              v_match := v_answer_raw IN (
                SELECT jsonb_array_elements(v_rule->'when'->'value')
              );
            END IF;
          END IF;

        WHEN 'contains' THEN
          IF jsonb_typeof(v_answer_raw) = 'array' THEN
            IF jsonb_typeof(v_rule->'when'->'value') = 'array' THEN
              v_match := EXISTS (
                SELECT 1 FROM jsonb_array_elements(v_answer_raw) a,
                              jsonb_array_elements(v_rule->'when'->'value') r
                WHERE a = r
              );
            ELSE
              v_match := v_answer_raw @> jsonb_build_array(v_rule->'when'->'value');
            END IF;
          END IF;

        ELSE
          CONTINUE;
      END CASE;

      IF v_match THEN
        -- Accumulate flags
        IF v_rule->'add_flags' IS NOT NULL AND jsonb_typeof(v_rule->'add_flags') = 'array' THEN
          SELECT array_agg(DISTINCT f) INTO v_flags
          FROM (
            SELECT unnest(v_flags) AS f
            UNION
            SELECT jsonb_array_elements_text(v_rule->'add_flags')
          ) sub;
          v_flags := COALESCE(v_flags, '{}');
        END IF;

        -- Track highest inspection_bias
        IF v_rule->'set'->>'inspection_bias' IS NOT NULL THEN
          v_cur_insp := CASE v_rule->'set'->>'inspection_bias'
            WHEN 'mandatory' THEN 4
            WHEN 'high' THEN 3
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 1
            ELSE 0
          END;
          IF v_cur_insp > v_insp_priority THEN
            v_insp_priority := v_cur_insp;
            v_inspection_bias := v_rule->'set'->>'inspection_bias';
          END IF;
        END IF;

        -- Track highest safety
        IF v_rule->'set'->>'safety' IS NOT NULL THEN
          v_cur_safe := CASE v_rule->'set'->>'safety'
            WHEN 'red' THEN 3
            WHEN 'amber' THEN 2
            WHEN 'green' THEN 1
            ELSE 0
          END;
          IF v_cur_safe > v_safe_priority THEN
            v_safe_priority := v_cur_safe;
            v_safety := v_rule->'set'->>'safety';
          END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  -- Write results (NULL if no rules matched)
  NEW.flags := NULLIF(v_flags, '{}');
  NEW.computed_inspection_bias := v_inspection_bias;
  NEW.computed_safety := v_safety;

  RETURN NEW;
END;
$$;

-- 2. Create trigger
CREATE TRIGGER trg_evaluate_pack_rules
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.evaluate_pack_rules_on_job();

-- 3. Backfill existing jobs (no-op update fires the trigger)
UPDATE public.jobs SET answers = answers WHERE answers IS NOT NULL;
