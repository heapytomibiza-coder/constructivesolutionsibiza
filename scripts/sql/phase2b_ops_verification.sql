-- Phase 2B-Ops verification (read-only)

-- 1) Confirm admin queue/manual RPCs exist
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname IN ('admin_custom_jobs_classification_queue', 'admin_set_custom_job_micro_slugs')
ORDER BY p.proname;

-- 2) Snapshot queue size from source-of-truth predicates
WITH base AS (
  SELECT j.id
  FROM public.jobs j
  WHERE j.status = 'open'
    AND j.is_publicly_listed = true
    AND j.is_custom_request = true
    AND NOT EXISTS (
      SELECT 1 FROM public.job_micro_links jml WHERE jml.job_id = j.id
    )
)
SELECT count(*) AS open_public_custom_without_jml
FROM base;

-- 3) Preview using admin queue RPC (call as admin context)
SELECT *
FROM public.admin_custom_jobs_classification_queue(50)
ORDER BY created_at DESC;

-- 4) Optional direct suggestion-state preview (guarded if table missing)
DO $$
BEGIN
  IF to_regclass('public.job_classification_suggestions') IS NULL THEN
    RAISE NOTICE 'public.job_classification_suggestions does not exist in this environment';
  ELSE
    RAISE NOTICE 'public.job_classification_suggestions exists';
    EXECUTE $q$
      WITH suggestion_state AS (
        SELECT
          s.job_id,
          bool_or(COALESCE(s.status, '') = 'accepted' OR s.accepted_at IS NOT NULL) AS has_accepted,
          (array_agg(COALESCE(s.status, 'pending') ORDER BY s.created_at DESC))[1] AS latest_status
        FROM public.job_classification_suggestions s
        GROUP BY s.job_id
      )
      SELECT
        j.id,
        j.created_at,
        j.title,
        COALESCE(ss.latest_status, 'none') AS suggestion_status,
        COALESCE(ss.has_accepted, false) AS has_accepted,
        EXISTS (SELECT 1 FROM public.job_micro_links jml WHERE jml.job_id = j.id) AS has_jml
      FROM public.jobs j
      LEFT JOIN suggestion_state ss ON ss.job_id = j.id
      WHERE j.status = 'open'
        AND j.is_publicly_listed = true
        AND j.is_custom_request = true
      ORDER BY j.created_at DESC
      LIMIT 50
    $q$;
  END IF;
END $$;
