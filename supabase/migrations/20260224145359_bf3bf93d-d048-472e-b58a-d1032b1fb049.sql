ALTER TABLE public.jobs
  ADD COLUMN is_custom_request boolean NOT NULL DEFAULT false;