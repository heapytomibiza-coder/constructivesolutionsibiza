ALTER TABLE public.jobs
  ALTER COLUMN translation_status SET DEFAULT NULL;

ALTER TABLE public.service_listings
  ALTER COLUMN translation_status SET DEFAULT NULL;

-- Clean up existing stuck rows
UPDATE public.jobs
SET translation_status = NULL
WHERE translation_status = 'pending'
  AND (source_lang IS NULL OR title_i18n = '{}'::jsonb);

UPDATE public.service_listings
SET translation_status = NULL
WHERE translation_status = 'pending'
  AND source_lang IS NULL;