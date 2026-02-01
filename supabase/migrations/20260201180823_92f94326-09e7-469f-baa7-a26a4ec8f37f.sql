-- Drop views first before modifying highlights column
DROP VIEW IF EXISTS public.jobs_board CASCADE;
DROP VIEW IF EXISTS public.job_details CASCADE;

-- Fix highlights: change from jsonb to text[]
ALTER TABLE public.jobs DROP COLUMN IF EXISTS highlights;
ALTER TABLE public.jobs ADD COLUMN highlights text[] NOT NULL DEFAULT '{}';

-- Recreate views with updated highlights type
-- jobs_board: for feed cards (lightweight, no answers)
CREATE VIEW public.jobs_board
WITH (security_invoker = true)
AS
SELECT
  j.id,
  j.created_at,
  j.updated_at,
  j.status,
  j.title,
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
  j.is_publicly_listed
FROM public.jobs j
WHERE j.is_publicly_listed = true
  AND j.status = 'open';

-- job_details: for detail view (includes answers)
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
  j.is_publicly_listed
FROM public.jobs j
WHERE j.is_publicly_listed = true;

-- Grant view access
GRANT SELECT ON public.jobs_board TO authenticated;
GRANT SELECT ON public.job_details TO authenticated;