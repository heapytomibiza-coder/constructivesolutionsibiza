-- Add partial unique index to prevent duplicate active slugs
CREATE UNIQUE INDEX IF NOT EXISTS uq_service_micro_categories_slug_active
ON public.service_micro_categories (slug)
WHERE is_active = true;