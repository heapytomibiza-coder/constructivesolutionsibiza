-- Must drop and recreate since we're adding a column before is_owner
DROP VIEW IF EXISTS public.job_details;

CREATE VIEW public.job_details AS
SELECT
  id,
  title,
  teaser,
  description,
  category,
  subcategory,
  micro_slug,
  area,
  location,
  budget_type,
  budget_value,
  budget_min,
  budget_max,
  start_timing,
  start_date,
  has_photos,
  highlights,
  answers,
  created_at,
  updated_at,
  status,
  is_publicly_listed,
  flags,
  computed_inspection_bias,
  computed_safety,
  source_lang,
  title_i18n,
  teaser_i18n,
  description_i18n,
  worker_brief,
  (user_id = auth.uid()) AS is_owner
FROM jobs
WHERE (is_publicly_listed = true AND status = 'open') OR (user_id = auth.uid());