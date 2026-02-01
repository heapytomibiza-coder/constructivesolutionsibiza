-- Add missing columns to jobs table for proper card rendering + filtering
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS subcategory text,
ADD COLUMN IF NOT EXISTS micro_slug text,
ADD COLUMN IF NOT EXISTS area text,
ADD COLUMN IF NOT EXISTS teaser text,
ADD COLUMN IF NOT EXISTS budget_type text DEFAULT 'range',
ADD COLUMN IF NOT EXISTS budget_value numeric,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS start_timing text DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS has_photos boolean DEFAULT false;

-- Add check constraint for budget_type
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_budget_type_check 
CHECK (budget_type IN ('fixed', 'hourly', 'range', 'tbd'));

-- Add check constraint for start_timing
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_start_timing_check 
CHECK (start_timing IN ('asap', 'date', 'flexible', 'this_week', 'this_month'));

-- Create indexes for common filter patterns
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON public.jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs (category);
CREATE INDEX IF NOT EXISTS idx_jobs_area ON public.jobs (area);
CREATE INDEX IF NOT EXISTS idx_jobs_subcategory ON public.jobs (subcategory);

-- Drop and recreate public_jobs_preview view with all card fields
DROP VIEW IF EXISTS public_jobs_preview;
CREATE VIEW public_jobs_preview AS
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

-- Drop and recreate public_job_details view
DROP VIEW IF EXISTS public_job_details;
CREATE VIEW public_job_details AS
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