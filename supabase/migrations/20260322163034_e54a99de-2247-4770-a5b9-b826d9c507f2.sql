-- Fix search_path on calculate_job_score_inline
CREATE OR REPLACE FUNCTION public.calculate_job_score_inline(v_job public.jobs)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $$
DECLARE
  v_score numeric := 0;
BEGIN
  IF v_job.description IS NOT NULL AND length(trim(v_job.description)) > 20 THEN
    v_score := v_score + 20;
  ELSIF v_job.description IS NOT NULL AND length(trim(v_job.description)) > 0 THEN
    v_score := v_score + 10;
  END IF;

  IF v_job.has_photos = true THEN
    v_score := v_score + 20;
  END IF;

  IF v_job.budget_value IS NOT NULL OR v_job.budget_min IS NOT NULL OR v_job.budget_max IS NOT NULL THEN
    v_score := v_score + 20;
  END IF;

  IF v_job.category IS NOT NULL AND v_job.micro_slug IS NOT NULL THEN
    v_score := v_score + 20;
  ELSIF v_job.category IS NOT NULL OR v_job.subcategory IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;

  IF v_job.start_date IS NOT NULL OR (v_job.start_timing IS NOT NULL AND v_job.start_timing != 'flexible') THEN
    v_score := v_score + 20;
  ELSIF v_job.start_timing = 'flexible' THEN
    v_score := v_score + 10;
  END IF;

  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$;