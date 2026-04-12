
CREATE OR REPLACE FUNCTION public.get_budget_range_for_micros(p_micro_slugs text[])
RETURNS TABLE (
  sample_size bigint,
  p20 numeric,
  p50 numeric,
  p80 numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(DISTINCT j.id) AS sample_size,
    percentile_cont(0.2) WITHIN GROUP (ORDER BY j.budget_min) AS p20,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY j.budget_min) AS p50,
    percentile_cont(0.8) WITHIN GROUP (ORDER BY j.budget_max) AS p80
  FROM jobs j
  JOIN job_micro_links jml ON j.id = jml.job_id
  WHERE jml.micro_slug = ANY(p_micro_slugs)
    AND j.status = 'completed'
    AND j.budget_min IS NOT NULL
    AND j.budget_max IS NOT NULL;
$$;
