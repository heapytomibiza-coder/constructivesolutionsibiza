-- =====================================================================
-- Track 2 / Phase 2B — Custom Request Pathway Verification
-- =====================================================================
-- Run with read-only access. All checks should return PASS rows only.
-- =====================================================================

-- 1) Trigger exists and is enabled.
SELECT
  tgname,
  tgenabled,
  CASE WHEN tgenabled = 'O' THEN 'PASS' ELSE 'FAIL' END AS status
FROM pg_trigger
WHERE tgrelid = 'public.jobs'::regclass
  AND tgname = 'trg_sync_job_micro_links';

-- 2) Unique index for (job_id, micro_slug) exists.
SELECT
  indexname,
  CASE WHEN indexname = 'job_micro_links_job_slug_uniq' THEN 'PASS' ELSE 'FAIL' END AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'job_micro_links'
  AND indexname = 'job_micro_links_job_slug_uniq';

-- 3) No job has micro_slug set without a matching job_micro_links row.
SELECT
  COUNT(*) AS jobs_microslug_missing_jml,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM jobs j
WHERE j.micro_slug IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM job_micro_links jml
    WHERE jml.job_id = j.id AND jml.micro_slug = j.micro_slug
  );

-- 4) No job has answers.selected.microSlugs entries without matching JML rows.
SELECT
  COUNT(*) AS answers_slug_missing_jml,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM jobs j
CROSS JOIN LATERAL jsonb_array_elements_text(
  COALESCE(j.answers -> 'selected' -> 'microSlugs', '[]'::jsonb)
) AS s(slug)
WHERE NOT EXISTS (
  SELECT 1 FROM job_micro_links jml
  WHERE jml.job_id = j.id AND jml.micro_slug = s.slug
);

-- 5) Phase 2A guardrail still holds: every non-custom open & public job
--    has at least one job_micro_links row.
SELECT
  COUNT(*) AS non_custom_open_public_without_jml,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM jobs j
WHERE j.is_custom_request = false
  AND j.status = 'open'
  AND j.is_publicly_listed = true
  AND NOT EXISTS (SELECT 1 FROM job_micro_links jml WHERE jml.job_id = j.id);

-- 6) Custom job visibility report: how many custom open/public jobs now
--    have at least one matching link versus how many remain unclassified.
SELECT
  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM job_micro_links jml WHERE jml.job_id = j.id)) AS custom_visible,
  COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM job_micro_links jml WHERE jml.job_id = j.id)) AS custom_awaiting_classification,
  COUNT(*) AS total_custom_open_public
FROM jobs j
WHERE j.is_custom_request = true
  AND j.status = 'open'
  AND j.is_publicly_listed = true;

-- 7) Trigger live test: simulate setting micro_slug on an existing custom
--    job in a transaction, verify JML row is created, then roll back.
DO $$
DECLARE
  v_job_id uuid;
  v_count_before int;
  v_count_after int;
BEGIN
  SELECT id INTO v_job_id
  FROM jobs
  WHERE is_custom_request = true
    AND micro_slug IS NULL
  LIMIT 1;

  IF v_job_id IS NULL THEN
    RAISE NOTICE 'TRIGGER TEST: no candidate custom job found, skipped';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_count_before FROM job_micro_links WHERE job_id = v_job_id;

  -- Use a SAVEPOINT-like approach: do work in a sub-block and raise to undo.
  BEGIN
    UPDATE jobs SET micro_slug = '__phase2b_test_slug__' WHERE id = v_job_id;
    SELECT COUNT(*) INTO v_count_after FROM job_micro_links WHERE job_id = v_job_id;
    IF v_count_after = v_count_before + 1 THEN
      RAISE NOTICE 'TRIGGER TEST: PASS (job=% before=% after=%)', v_job_id, v_count_before, v_count_after;
    ELSE
      RAISE NOTICE 'TRIGGER TEST: FAIL (job=% before=% after=%)', v_job_id, v_count_before, v_count_after;
    END IF;
    -- Rollback by raising
    RAISE EXCEPTION 'phase2b_test_rollback';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'phase2b_test_rollback' THEN
      RAISE;
    END IF;
  END;
END $$;
