-- Recreate job_details view with is_owner computed column
DROP VIEW IF EXISTS public.job_details CASCADE;

CREATE VIEW public.job_details
WITH (security_invoker = true)
AS
SELECT
  j.id,
  j.created_at,
  j.updated_at,
  j.status,
  j.title,
  j.description,
  j.teaser,
  j.highlights,
  j.category,
  j.subcategory,
  j.micro_slug,
  j.area,
  j.location,
  j.budget_type,
  j.budget_value,
  j.budget_min,
  j.budget_max,
  j.start_timing,
  j.start_date,
  j.has_photos,
  j.answers,
  j.is_publicly_listed,
  (auth.uid() = j.user_id) AS is_owner
FROM public.jobs j
WHERE j.is_publicly_listed = true;

-- Grant access to authenticated users
GRANT SELECT ON public.job_details TO authenticated;