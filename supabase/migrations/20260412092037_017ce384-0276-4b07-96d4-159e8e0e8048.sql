
-- ============================================================
-- 1. Create job_micro_links junction table
-- ============================================================
CREATE TABLE public.job_micro_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  micro_slug text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (job_id, micro_slug)
);

CREATE INDEX idx_job_micro_links_job_id ON public.job_micro_links(job_id);
CREATE INDEX idx_job_micro_links_micro_slug ON public.job_micro_links(micro_slug);

ALTER TABLE public.job_micro_links ENABLE ROW LEVEL SECURITY;

-- Public SELECT matching jobs visibility (public open jobs)
CREATE POLICY "Anyone can view micro links for public open jobs"
  ON public.job_micro_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_micro_links.job_id
        AND j.is_publicly_listed = true
        AND j.status = 'open'
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all micro links"
  ON public.job_micro_links
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::text) AND is_admin_email());

-- Job owners can view their own
CREATE POLICY "Job owners can view their micro links"
  ON public.job_micro_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_micro_links.job_id AND j.user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. Create sync trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_job_micro_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  slugs_arr text[];
  slug_val text;
BEGIN
  -- Extract microSlugs from answers JSON
  IF NEW.answers IS NOT NULL
     AND NEW.answers->'selected'->'microSlugs' IS NOT NULL
     AND jsonb_typeof(NEW.answers->'selected'->'microSlugs') = 'array'
  THEN
    -- Convert JSONB array to text array
    SELECT array_agg(elem::text)
    INTO slugs_arr
    FROM jsonb_array_elements_text(NEW.answers->'selected'->'microSlugs') AS elem;
  ELSE
    slugs_arr := ARRAY[]::text[];
  END IF;

  -- Also include jobs.micro_slug if set and not already in the array
  IF NEW.micro_slug IS NOT NULL AND NEW.micro_slug <> '' THEN
    IF slugs_arr IS NULL OR NOT (NEW.micro_slug = ANY(slugs_arr)) THEN
      slugs_arr := array_append(COALESCE(slugs_arr, ARRAY[]::text[]), NEW.micro_slug);
    END IF;
  END IF;

  -- Delete old links for this job
  DELETE FROM public.job_micro_links WHERE job_id = NEW.id;

  -- Insert new links
  IF slugs_arr IS NOT NULL AND array_length(slugs_arr, 1) > 0 THEN
    INSERT INTO public.job_micro_links (job_id, micro_slug)
    SELECT NEW.id, unnest(slugs_arr)
    ON CONFLICT (job_id, micro_slug) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_job_micro_links
  AFTER INSERT OR UPDATE OF answers, micro_slug
  ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_job_micro_links();

-- ============================================================
-- 3. Backfill existing jobs
-- ============================================================
INSERT INTO public.job_micro_links (job_id, micro_slug)
SELECT j.id, slug_val
FROM public.jobs j,
     LATERAL jsonb_array_elements_text(j.answers->'selected'->'microSlugs') AS slug_val
WHERE j.answers IS NOT NULL
  AND j.answers->'selected'->'microSlugs' IS NOT NULL
  AND jsonb_typeof(j.answers->'selected'->'microSlugs') = 'array'
ON CONFLICT (job_id, micro_slug) DO NOTHING;

-- Also backfill from micro_slug column for jobs without answers microSlugs
INSERT INTO public.job_micro_links (job_id, micro_slug)
SELECT j.id, j.micro_slug
FROM public.jobs j
WHERE j.micro_slug IS NOT NULL
  AND j.micro_slug <> ''
ON CONFLICT (job_id, micro_slug) DO NOTHING;

-- ============================================================
-- 4. Replace matched_jobs_for_professional view
-- ============================================================
CREATE OR REPLACE VIEW public.matched_jobs_for_professional AS
SELECT DISTINCT ON (j.id)
    j.id,
    j.title,
    j.teaser,
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
    j.highlights,
    j.created_at,
    j.updated_at,
    j.status,
    j.is_publicly_listed,
    j.flags,
    j.computed_inspection_bias,
    j.computed_safety,
    j.source_lang,
    j.title_i18n,
    j.teaser_i18n,
    ps.user_id AS professional_user_id
FROM public.jobs j
JOIN public.job_micro_links jml ON jml.job_id = j.id
JOIN public.service_micro_categories m ON m.slug = jml.micro_slug AND m.is_active = true
JOIN public.professional_services ps ON ps.micro_id = m.id
JOIN public.professional_profiles pp ON pp.user_id = ps.user_id
LEFT JOIN public.professional_micro_preferences pmp
  ON pmp.user_id = ps.user_id AND pmp.micro_id = m.id
WHERE j.is_publicly_listed = true
  AND j.status = 'open'
  AND ps.user_id = auth.uid()
  -- Location filter: permissive — no zones = match all
  AND (
    pp.service_zones IS NULL
    OR pp.service_zones = '{}'::text[]
    OR j.area = ANY(pp.service_zones)
  )
  -- Budget filter: permissive — no pref or TBD = match
  AND (
    pmp.min_budget_eur IS NULL
    OR pmp.min_budget_eur = 0
    OR j.budget_max >= pmp.min_budget_eur
    OR j.budget_type = 'tbd'
  )
ORDER BY j.id, j.created_at DESC;
