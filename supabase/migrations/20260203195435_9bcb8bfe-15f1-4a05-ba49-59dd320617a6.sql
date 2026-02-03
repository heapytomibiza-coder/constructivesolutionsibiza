-- Fix Security Definer View warnings by explicitly setting SECURITY INVOKER
-- This ensures views use the permissions of the querying user, not the view owner

-- Recreate job_details view with explicit security invoker
DROP VIEW IF EXISTS public.job_details;
CREATE VIEW public.job_details 
WITH (security_invoker = true)
AS
SELECT 
  id,
  created_at,
  updated_at,
  status,
  title,
  description,
  teaser,
  highlights,
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
  answers,
  is_publicly_listed,
  ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id)) AS is_owner
FROM jobs j
WHERE is_publicly_listed = true;

-- Recreate jobs_board view with explicit security invoker
DROP VIEW IF EXISTS public.matched_jobs_for_professional;
DROP VIEW IF EXISTS public.jobs_board;
CREATE VIEW public.jobs_board 
WITH (security_invoker = true)
AS
SELECT 
  id,
  created_at,
  updated_at,
  status,
  title,
  teaser,
  highlights,
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
  is_publicly_listed
FROM jobs j
WHERE is_publicly_listed = true AND status = 'open';

-- Recreate matched_jobs_for_professional view with explicit security invoker
CREATE VIEW public.matched_jobs_for_professional 
WITH (security_invoker = true)
AS
SELECT DISTINCT
  jb.id,
  jb.created_at,
  jb.updated_at,
  jb.status,
  jb.title,
  jb.teaser,
  jb.highlights,
  jb.category,
  jb.subcategory,
  jb.micro_slug,
  jb.area,
  jb.location,
  jb.budget_type,
  jb.budget_value,
  jb.budget_min,
  jb.budget_max,
  jb.start_timing,
  jb.start_date,
  jb.has_photos,
  jb.is_publicly_listed,
  ps.user_id AS professional_user_id
FROM jobs_board jb
JOIN service_micro_categories smc ON smc.slug = jb.micro_slug
JOIN professional_services ps ON ps.micro_id = smc.id
WHERE jb.is_publicly_listed = true AND jb.status = 'open';

-- Recreate professional preview views with explicit security invoker
DROP VIEW IF EXISTS public.public_professionals_preview;
CREATE VIEW public.public_professionals_preview 
WITH (security_invoker = true)
AS
SELECT 
  id,
  display_name,
  avatar_url,
  verification_status,
  services_count
FROM professional_profiles
WHERE is_publicly_listed = true;

DROP VIEW IF EXISTS public.public_professional_details;
CREATE VIEW public.public_professional_details 
WITH (security_invoker = true)
AS
SELECT 
  id,
  display_name,
  avatar_url,
  bio,
  verification_status,
  services_count
FROM professional_profiles
WHERE is_publicly_listed = true;