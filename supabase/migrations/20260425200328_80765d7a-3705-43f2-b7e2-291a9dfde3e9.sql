
-- =====================================================================
-- Phase 2B-Ops — Admin operational view
-- Lists custom job requests that are publicly open but not yet
-- classified into job_micro_links and have no accepted classification.
-- Read-only. Admin-only.
-- =====================================================================

CREATE OR REPLACE VIEW public.admin_unclassified_custom_jobs
WITH (security_invoker = true)
AS
SELECT
  j.id                                       AS job_id,
  j.title,
  j.teaser,
  j.area,
  j.created_at,
  j.updated_at,
  j.user_id                                  AS client_id,
  -- Latest suggestion status (NULL means no suggestion has ever been generated)
  (SELECT s.status
     FROM public.job_classification_suggestions s
     WHERE s.job_id = j.id
     ORDER BY s.created_at DESC
     LIMIT 1)                                AS latest_suggestion_status,
  (SELECT s.confidence
     FROM public.job_classification_suggestions s
     WHERE s.job_id = j.id
     ORDER BY s.created_at DESC
     LIMIT 1)                                AS latest_suggestion_confidence,
  (SELECT s.created_at
     FROM public.job_classification_suggestions s
     WHERE s.job_id = j.id
     ORDER BY s.created_at DESC
     LIMIT 1)                                AS latest_suggestion_at
FROM public.jobs j
WHERE j.is_custom_request = true
  AND j.status = 'open'
  AND j.is_publicly_listed = true
  -- Not yet linked into the matching system
  AND NOT EXISTS (
    SELECT 1 FROM public.job_micro_links jml
    WHERE jml.job_id = j.id
  )
  -- Not yet accepted by an admin (pending or no suggestion is OK)
  AND NOT EXISTS (
    SELECT 1 FROM public.job_classification_suggestions s
    WHERE s.job_id = j.id AND s.status = 'accepted'
  );

COMMENT ON VIEW public.admin_unclassified_custom_jobs IS
'Phase 2B-Ops: admin worklist of open public custom jobs that need classification before they become visible in matching. Admins can either re-run the classify-custom-request edge function or accept/edit a suggestion in the Job Detail Drawer.';

-- Lock down: only admins can read the view. We use security_invoker=true
-- so existing RLS on the underlying tables (jobs, job_classification_suggestions,
-- job_micro_links) applies. Admin RLS policies already permit full reads on
-- these tables, while regular users cannot see other users' jobs or any
-- classification suggestions, so the view is naturally admin-scoped.

-- Revoke broad grants and grant only to authenticated (RLS will still gate).
REVOKE ALL ON public.admin_unclassified_custom_jobs FROM PUBLIC;
REVOKE ALL ON public.admin_unclassified_custom_jobs FROM anon;
GRANT SELECT ON public.admin_unclassified_custom_jobs TO authenticated;
