-- Add highlights column for rich job cards
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Ensure location has proper default
ALTER TABLE public.jobs
ALTER COLUMN location SET DEFAULT '{}'::jsonb;

-- Update any null locations to empty object
UPDATE public.jobs SET location = '{}'::jsonb WHERE location IS NULL;

-- Create sync trigger to keep area column in sync with location->>'area'
CREATE OR REPLACE FUNCTION public.sync_job_area_from_location()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.location IS NOT NULL AND jsonb_typeof(NEW.location) = 'object' THEN
    IF NEW.location ? 'area' THEN
      NEW.area := NULLIF(NEW.location->>'area', '');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_job_area_from_location ON public.jobs;

CREATE TRIGGER trg_sync_job_area_from_location
BEFORE INSERT OR UPDATE OF location
ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.sync_job_area_from_location();

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.jobs_board;
DROP VIEW IF EXISTS public.job_details;
DROP VIEW IF EXISTS public.public_jobs_preview;
DROP VIEW IF EXISTS public.public_job_details;

-- Create jobs_board view (for feed - lightweight with highlights, no answers)
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

-- Create job_details view (includes answers for full detail view)
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

-- Grant select on the views to authenticated users
GRANT SELECT ON public.jobs_board TO authenticated;
GRANT SELECT ON public.job_details TO authenticated;

-- Drop old restrictive policies and create proper ones
-- First check if policy exists before dropping
DO $$
BEGIN
  -- Drop existing select policies
  DROP POLICY IF EXISTS "Public can view listed jobs" ON public.jobs;
  DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
  DROP POLICY IF EXISTS "authenticated can read open listed jobs" ON public.jobs;
END $$;

-- Create new RLS policies for proper access
-- 1. Users can always view their own jobs (any status)
CREATE POLICY "Users can view their own jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Authenticated users can view publicly listed open jobs
CREATE POLICY "Authenticated can view public open jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (is_publicly_listed = true AND status = 'open');