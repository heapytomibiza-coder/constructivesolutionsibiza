-- Drop existing views
DROP VIEW IF EXISTS public.public_jobs_preview;
DROP VIEW IF EXISTS public.public_job_details;
DROP VIEW IF EXISTS public.public_professionals_preview;
DROP VIEW IF EXISTS public.public_professional_details;

-- Recreate views with security_invoker = true
CREATE VIEW public.public_jobs_preview 
WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  category,
  status,
  created_at,
  budget_min,
  budget_max
FROM public.jobs
WHERE is_publicly_listed = true AND status = 'open';

CREATE VIEW public.public_job_details 
WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  description,
  category,
  status,
  created_at,
  budget_min,
  budget_max
FROM public.jobs
WHERE is_publicly_listed = true;

CREATE VIEW public.public_professionals_preview 
WITH (security_invoker = true) AS
SELECT 
  id,
  display_name,
  avatar_url,
  services_count,
  verification_status
FROM public.professional_profiles
WHERE is_publicly_listed = true;

CREATE VIEW public.public_professional_details 
WITH (security_invoker = true) AS
SELECT 
  id,
  display_name,
  bio,
  avatar_url,
  services_count,
  verification_status
FROM public.professional_profiles
WHERE is_publicly_listed = true;