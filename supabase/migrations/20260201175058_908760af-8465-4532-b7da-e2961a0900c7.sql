-- Fix security definer views by using security_invoker = true
-- This ensures RLS policies of the querying user are enforced

DROP VIEW IF EXISTS public_jobs_preview;
CREATE VIEW public_jobs_preview 
WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  teaser,
  category,
  subcategory,
  micro_slug,
  area,
  status,
  budget_type,
  budget_value,
  budget_min,
  budget_max,
  start_timing,
  start_date,
  has_photos,
  created_at,
  is_publicly_listed
FROM public.jobs
WHERE is_publicly_listed = true AND status = 'open';

DROP VIEW IF EXISTS public_job_details;
CREATE VIEW public_job_details 
WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  teaser,
  description,
  category,
  subcategory,
  micro_slug,
  area,
  status,
  budget_type,
  budget_value,
  budget_min,
  budget_max,
  start_timing,
  start_date,
  has_photos,
  created_at
FROM public.jobs
WHERE is_publicly_listed = true;

-- Also fix the professionals views
DROP VIEW IF EXISTS public_professionals_preview;
CREATE VIEW public_professionals_preview 
WITH (security_invoker = true) AS
SELECT 
  id,
  display_name,
  avatar_url,
  verification_status,
  services_count
FROM public.professional_profiles
WHERE is_publicly_listed = true;

DROP VIEW IF EXISTS public_professional_details;
CREATE VIEW public_professional_details 
WITH (security_invoker = true) AS
SELECT 
  id,
  display_name,
  avatar_url,
  bio,
  verification_status,
  services_count
FROM public.professional_profiles
WHERE is_publicly_listed = true;