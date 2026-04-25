
-- =====================================================================
-- Phase 2B — Custom Request Pathway
-- Goal: make custom jobs visible in matching by ensuring that whenever
-- a classification (or admin edit) writes jobs.micro_slug or
-- jobs.answers.selected.microSlugs, job_micro_links is kept in sync.
-- job_micro_links remains the single source of truth (Phase 2A invariant).
-- =====================================================================

-- 1) Trigger function: sync job_micro_links from jobs.micro_slug and
--    jobs.answers->'selected'->'microSlugs'.
--
-- Behavior:
--  - On INSERT/UPDATE of jobs, derive the desired set of micro_slugs from
--    (a) jobs.micro_slug (if not null), and
--    (b) jobs.answers->'selected'->'microSlugs' (if array).
--  - INSERT any missing rows (ON CONFLICT DO NOTHING).
--  - We do NOT delete existing job_micro_links rows here. Removal is an
--    explicit operation (out of scope for Phase 2B). This avoids accidental
--    loss of links a client may have intentionally chosen.
CREATE OR REPLACE FUNCTION public.sync_job_micro_links_from_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_slugs text[];
BEGIN
  -- Collect slugs from primary column
  IF NEW.micro_slug IS NOT NULL AND length(trim(NEW.micro_slug)) > 0 THEN
    v_slugs := ARRAY[NEW.micro_slug];
  ELSE
    v_slugs := ARRAY[]::text[];
  END IF;

  -- Merge slugs from answers.selected.microSlugs (jsonb array of strings)
  IF NEW.answers IS NOT NULL
     AND jsonb_typeof(NEW.answers -> 'selected' -> 'microSlugs') = 'array' THEN
    SELECT v_slugs || COALESCE(array_agg(DISTINCT s), ARRAY[]::text[])
      INTO v_slugs
    FROM jsonb_array_elements_text(NEW.answers -> 'selected' -> 'microSlugs') AS s
    WHERE s IS NOT NULL AND length(trim(s)) > 0;
  END IF;

  -- De-duplicate
  SELECT ARRAY(SELECT DISTINCT unnest(v_slugs)) INTO v_slugs;

  -- Fan out to job_micro_links (additive, no deletes)
  IF array_length(v_slugs, 1) IS NOT NULL THEN
    FOREACH v_slug IN ARRAY v_slugs LOOP
      INSERT INTO public.job_micro_links (job_id, micro_slug)
      VALUES (NEW.id, v_slug)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure unique key for ON CONFLICT (idempotency). Safe if it already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'job_micro_links'
      AND indexname = 'job_micro_links_job_slug_uniq'
  ) THEN
    CREATE UNIQUE INDEX job_micro_links_job_slug_uniq
      ON public.job_micro_links (job_id, micro_slug);
  END IF;
END $$;

-- 2) Attach trigger
DROP TRIGGER IF EXISTS trg_sync_job_micro_links ON public.jobs;
CREATE TRIGGER trg_sync_job_micro_links
AFTER INSERT OR UPDATE OF micro_slug, answers ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.sync_job_micro_links_from_job();

-- 3) Backfill: for any existing job that has micro_slug or answers.selected.microSlugs
--    but is missing JML rows, insert them. Additive only.
WITH derived AS (
  SELECT
    j.id AS job_id,
    DISTINCT_SLUG.slug
  FROM jobs j
  CROSS JOIN LATERAL (
    SELECT slug FROM (
      SELECT j.micro_slug AS slug WHERE j.micro_slug IS NOT NULL
      UNION
      SELECT s::text AS slug
      FROM jsonb_array_elements_text(
             COALESCE(j.answers -> 'selected' -> 'microSlugs', '[]'::jsonb)
           ) AS s
    ) AS sub
    WHERE slug IS NOT NULL AND length(trim(slug)) > 0
  ) AS DISTINCT_SLUG
)
INSERT INTO public.job_micro_links (job_id, micro_slug)
SELECT d.job_id, d.slug
FROM derived d
ON CONFLICT DO NOTHING;
