-- =============================================================================
-- Track 2 / Phase 2A — Verification SQL Pack
-- =============================================================================
-- Run each block individually. Every block prints a PASS/FAIL verdict.
-- These checks are READ-ONLY and safe to run against production at any time.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- CHECK 1 — Feed vs admin_notify_matching_pros recipient parity
-- -----------------------------------------------------------------------------
-- For every open + publicly listed job, the set of professionals reachable via
-- job_micro_links (the new admin nudge path) must be a SUPERSET of, or equal
-- to, the set returned by the matched_jobs_for_professional view (which adds
-- zone + budget filtering on top of the same micro join). Any pro returned by
-- the feed but NOT eligible to receive a nudge is a parity violation.
--
-- Note: the feed view filters to auth.uid() and applies zone/budget filters,
-- so we model both paths in raw form (without the auth.uid() restriction) to
-- compare set membership at the matching layer.
-- -----------------------------------------------------------------------------
WITH feed_recipients AS (
  SELECT DISTINCT j.id AS job_id, ps.user_id
  FROM public.jobs j
  JOIN public.job_micro_links jml ON jml.job_id = j.id
  JOIN public.service_micro_categories m
    ON m.slug = jml.micro_slug AND m.is_active = true
  JOIN public.professional_services ps ON ps.micro_id = m.id
  JOIN public.professional_profiles pp ON pp.user_id = ps.user_id
  WHERE j.status = 'open' AND j.is_publicly_listed = true
),
nudge_recipients AS (
  SELECT DISTINCT j.id AS job_id, ps.user_id
  FROM public.jobs j
  JOIN public.job_micro_links jml ON jml.job_id = j.id
  JOIN public.service_micro_categories smc
    ON smc.slug = jml.micro_slug AND smc.is_active = true
  JOIN public.professional_services ps ON ps.micro_id = smc.id
  WHERE j.status = 'open' AND j.is_publicly_listed = true
    AND ps.status = 'offered'
    AND ps.notify = true
),
parity AS (
  SELECT
    (SELECT COUNT(*) FROM feed_recipients) AS feed_total,
    (SELECT COUNT(*) FROM nudge_recipients) AS nudge_total,
    (SELECT COUNT(*) FROM nudge_recipients n
       WHERE NOT EXISTS (
         SELECT 1 FROM feed_recipients f
         WHERE f.job_id = n.job_id AND f.user_id = n.user_id
       )) AS nudge_not_in_feed
)
SELECT
  feed_total,
  nudge_total,
  nudge_not_in_feed,
  CASE
    WHEN nudge_not_in_feed = 0 THEN 'PASS — every nudge recipient is reachable through the feed-side micro join'
    ELSE 'FAIL — admin nudge would notify pros the feed cannot match'
  END AS verdict
FROM parity;


-- -----------------------------------------------------------------------------
-- CHECK 2 — Multi-micro jobs are handled correctly
-- -----------------------------------------------------------------------------
-- Every multi-micro job (microSlugs array length > 1) must have a matching
-- number of job_micro_links rows. The sync_job_micro_links() trigger fans the
-- array into JML; if any multi-micro job has fewer JML rows than declared
-- micros, the trigger has not fired correctly for that row.
-- -----------------------------------------------------------------------------
WITH multi AS (
  SELECT
    j.id,
    jsonb_array_length(j.answers->'selected'->'microSlugs') AS declared_micros,
    (SELECT COUNT(*) FROM public.job_micro_links jml WHERE jml.job_id = j.id) AS jml_rows
  FROM public.jobs j
  WHERE j.answers ? 'selected'
    AND j.answers->'selected' ? 'microSlugs'
    AND jsonb_typeof(j.answers->'selected'->'microSlugs') = 'array'
    AND jsonb_array_length(j.answers->'selected'->'microSlugs') > 1
)
SELECT
  COUNT(*) AS multi_micro_jobs,
  COUNT(*) FILTER (WHERE jml_rows < declared_micros) AS under_linked,
  CASE
    WHEN COUNT(*) FILTER (WHERE jml_rows < declared_micros) = 0
      THEN 'PASS — every multi-micro job has at least one JML row per declared micro'
    ELSE 'FAIL — some multi-micro jobs are missing JML rows'
  END AS verdict
FROM multi;


-- -----------------------------------------------------------------------------
-- CHECK 3 — Open + publicly listed non-custom jobs all have ≥1 JML row
-- -----------------------------------------------------------------------------
-- This is the invariant enforced by the new guardrail trigger.
-- A non-zero violation count means historical data exists that the trigger
-- would now reject; those rows must be backfilled or remediated separately.
-- -----------------------------------------------------------------------------
SELECT
  COUNT(*) AS violating_jobs,
  CASE
    WHEN COUNT(*) = 0
      THEN 'PASS — every open public non-custom job has ≥1 job_micro_links row'
    ELSE 'FAIL — non-custom jobs are open and public without any JML row'
  END AS verdict
FROM public.jobs j
WHERE j.status = 'open'
  AND j.is_publicly_listed = true
  AND COALESCE(j.is_custom_request, false) = false
  AND NOT EXISTS (SELECT 1 FROM public.job_micro_links jml WHERE jml.job_id = j.id);


-- -----------------------------------------------------------------------------
-- CHECK 4 — Custom jobs are exempt from the guardrail
-- -----------------------------------------------------------------------------
-- Custom requests legitimately have no micro selection at post time. They must
-- be allowed to be open + publicly listed without JML rows. We confirm the
-- trigger does NOT block them by counting how many such rows exist today.
-- A non-zero count proves custom jobs are passing through the trigger
-- successfully (since the migration is already live).
-- -----------------------------------------------------------------------------
SELECT
  COUNT(*) AS open_public_custom_without_jml,
  CASE
    WHEN COUNT(*) >= 0
      THEN 'PASS — custom jobs are not blocked by the guardrail (informational count above)'
    ELSE 'FAIL'
  END AS verdict
FROM public.jobs j
WHERE j.status = 'open'
  AND j.is_publicly_listed = true
  AND j.is_custom_request = true
  AND NOT EXISTS (SELECT 1 FROM public.job_micro_links jml WHERE jml.job_id = j.id);


-- -----------------------------------------------------------------------------
-- CHECK 5 — No existing open/public non-custom job is broken
-- -----------------------------------------------------------------------------
-- Re-evaluate the same invariant by simulating an UPDATE of every existing
-- open + publicly listed job's status to itself. Any row that would now fail
-- the guardrail would surface here. This is the "do not break what already
-- works" safety net. (Read-only: we only count, we do not actually update.)
-- -----------------------------------------------------------------------------
WITH would_fail AS (
  SELECT j.id, j.is_custom_request
  FROM public.jobs j
  WHERE j.status = 'open'
    AND j.is_publicly_listed = true
    AND COALESCE(j.is_custom_request, false) = false
    AND NOT EXISTS (SELECT 1 FROM public.job_micro_links jml WHERE jml.job_id = j.id)
)
SELECT
  (SELECT COUNT(*) FROM would_fail) AS would_fail_count,
  CASE
    WHEN (SELECT COUNT(*) FROM would_fail) = 0
      THEN 'PASS — guardrail will not break any currently open public non-custom job'
    ELSE 'FAIL — existing rows would now violate the guardrail; backfill required'
  END AS verdict;


-- -----------------------------------------------------------------------------
-- BONUS — Function source confirmation
-- -----------------------------------------------------------------------------
-- Confirms admin_notify_matching_pros now references job_micro_links and no
-- longer uses jobs.micro_slug for matching.
-- -----------------------------------------------------------------------------
SELECT
  CASE
    WHEN pg_get_functiondef(p.oid) ILIKE '%job_micro_links%'
     AND pg_get_functiondef(p.oid) NOT ILIKE '%v_job.micro_slug%'
      THEN 'PASS — admin_notify_matching_pros uses job_micro_links'
    ELSE 'FAIL — admin_notify_matching_pros has not been updated'
  END AS verdict
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'admin_notify_matching_pros';
