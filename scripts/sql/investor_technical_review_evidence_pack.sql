-- ============================================================
-- Investor Technical Review — Evidence Pack (READ-ONLY)
-- Purpose: One-shot snapshot of platform health for due diligence.
-- Safety:  SELECT-only. Safe to run against production.
-- Usage:   psql "$DB_URL" -f scripts/sql/investor_technical_review_evidence_pack.sql > evidence.txt
-- ============================================================

\echo '############ SECTION A — Schema Footprint ############'

SELECT 'tables'    AS kind, count(*)::text AS value FROM pg_tables    WHERE schemaname='public'
UNION ALL SELECT 'rls_enabled_tables', count(*)::text
  FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND relrowsecurity
UNION ALL SELECT 'rls_policies', count(*)::text FROM pg_policy
UNION ALL SELECT 'functions_total', count(*)::text
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
UNION ALL SELECT 'functions_security_definer', count(*)::text
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef
UNION ALL SELECT 'triggers', count(*)::text FROM information_schema.triggers WHERE trigger_schema='public'
UNION ALL SELECT 'foreign_keys', count(*)::text
  FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_type='FOREIGN KEY';

\echo ''
\echo '############ SECTION B — Tables WITHOUT RLS (red flags) ############'
SELECT relname AS unprotected_table
FROM pg_class
WHERE relnamespace='public'::regnamespace
  AND relkind='r'
  AND NOT relrowsecurity
ORDER BY relname;

\echo ''
\echo '############ SECTION C — Marketplace Lifecycle Health ############'

SELECT status, count(*) AS jobs FROM public.jobs GROUP BY status ORDER BY status;

\echo ''
SELECT 'jobs_total'              AS metric, count(*)::text AS value FROM public.jobs
UNION ALL SELECT 'jobs_with_micro_slug',     count(*)::text FROM public.jobs WHERE micro_slug IS NOT NULL
UNION ALL SELECT 'jobs_without_micro_slug',  count(*)::text FROM public.jobs WHERE micro_slug IS NULL
UNION ALL SELECT 'professional_profiles',    count(*)::text FROM public.professional_profiles
UNION ALL SELECT 'service_listings_live',    count(*)::text FROM public.service_listings WHERE status='live'
UNION ALL SELECT 'conversations',            count(*)::text FROM public.conversations
UNION ALL SELECT 'reviews',                  count(*)::text FROM public.job_reviews;

\echo ''
\echo '############ SECTION D — Email Pipeline Health ############'
SELECT status, count(*) AS rows
FROM public.email_notifications_queue
GROUP BY status
ORDER BY status;

\echo ''
\echo '############ SECTION E — Track 1 RPC Authorization Surface ############'
SELECT p.proname AS function,
       CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security,
       pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND p.proname IN ('check_rate_limit','increment_job_edit_version',
                    'admin_force_complete_job','has_role','is_admin_email',
                    'grant_professional_access','get_or_create_conversation',
                    'submit_quote_with_items','validate_job_status_transition')
ORDER BY p.proname;

\echo ''
\echo '############ SECTION F — Storage Buckets (public exposure check) ############'
SELECT id, name, public, file_size_limit
FROM storage.buckets
ORDER BY name;

\echo ''
\echo '############ SECTION G — Recent admin actions (audit trail proof) ############'
SELECT action_type, count(*) AS calls,
       max(created_at) AS most_recent
FROM public.admin_actions_log
GROUP BY action_type
ORDER BY most_recent DESC NULLS LAST;

\echo ''
\echo '############ END OF EVIDENCE PACK ############'
