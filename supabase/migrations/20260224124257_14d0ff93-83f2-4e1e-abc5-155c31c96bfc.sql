-- Phase B: Add i18n columns for user-generated content translation

-- Jobs table: add translation columns
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS source_lang text,
  ADD COLUMN IF NOT EXISTS title_i18n jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS teaser_i18n jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS translation_status text DEFAULT 'pending';

-- Service listings table: add translation columns
ALTER TABLE public.service_listings
  ADD COLUMN IF NOT EXISTS source_lang text,
  ADD COLUMN IF NOT EXISTS display_title_i18n jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS short_description_i18n jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS translation_status text DEFAULT 'pending';

-- Recreate views to include new columns
-- Drop in correct dependency order
DROP VIEW IF EXISTS public.matched_jobs_for_professional CASCADE;
DROP VIEW IF EXISTS public.job_details CASCADE;
DROP VIEW IF EXISTS public.jobs_board CASCADE;

-- jobs_board view (lightweight, for feed cards)
CREATE VIEW public.jobs_board
WITH (security_invoker = true) AS
SELECT
  id, title, teaser, category, subcategory, micro_slug, area,
  location, budget_type, budget_value, budget_min, budget_max,
  start_timing, start_date, has_photos, highlights,
  created_at, updated_at, status, is_publicly_listed,
  flags, computed_inspection_bias, computed_safety,
  source_lang, title_i18n, teaser_i18n
FROM public.jobs
WHERE is_publicly_listed = true AND status = 'open';

-- job_details view (full detail with answers)
CREATE VIEW public.job_details
WITH (security_invoker = true) AS
SELECT
  id, title, teaser, description, category, subcategory, micro_slug, area,
  location, budget_type, budget_value, budget_min, budget_max,
  start_timing, start_date, has_photos, highlights, answers,
  created_at, updated_at, status, is_publicly_listed,
  flags, computed_inspection_bias, computed_safety,
  source_lang, title_i18n, teaser_i18n, description_i18n,
  (user_id = auth.uid()) AS is_owner
FROM public.jobs
WHERE is_publicly_listed = true AND status = 'open'
   OR user_id = auth.uid();

-- matched_jobs_for_professional view
CREATE VIEW public.matched_jobs_for_professional
WITH (security_invoker = true) AS
SELECT
  j.id, j.title, j.teaser, j.category, j.subcategory, j.micro_slug, j.area,
  j.location, j.budget_type, j.budget_value, j.budget_min, j.budget_max,
  j.start_timing, j.start_date, j.has_photos, j.highlights,
  j.created_at, j.updated_at, j.status, j.is_publicly_listed,
  j.flags, j.computed_inspection_bias, j.computed_safety,
  j.source_lang, j.title_i18n, j.teaser_i18n,
  ps.user_id AS professional_user_id
FROM public.jobs j
JOIN public.service_micro_categories m ON m.slug = j.micro_slug AND m.is_active = true
JOIN public.professional_services ps ON ps.micro_id = m.id
WHERE j.is_publicly_listed = true
  AND j.status = 'open'
  AND ps.user_id = auth.uid();