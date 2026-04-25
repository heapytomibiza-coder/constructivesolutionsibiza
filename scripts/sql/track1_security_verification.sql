-- ============================================================
-- Track 1 — Security Verification (READ-ONLY)
-- Purpose: Evidence pack for authorization boundaries on the
--          four Track 1 RPCs and the translate-content function.
-- Safety:  SELECT-only. No DDL, no DML. Safe to run on prod.
-- Usage:   psql "$DB_URL" -f scripts/sql/track1_security_verification.sql
-- ============================================================

\echo '=== 1. RPC definitions (security model + body) ==='
SELECT n.nspname AS schema,
       p.proname AS function,
       CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security,
       pg_get_function_identity_arguments(p.oid) AS args,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'check_rate_limit',
    'increment_job_edit_version',
    'admin_force_complete_job',
    'has_role',
    'is_admin_email'
  )
ORDER BY p.proname;

\echo ''
\echo '=== 2. EXECUTE grants on Track 1 RPCs ==='
SELECT r.routine_schema,
       r.routine_name,
       g.grantee,
       g.privilege_type
FROM information_schema.routines r
LEFT JOIN information_schema.routine_privileges g
       ON g.routine_schema = r.routine_schema
      AND g.routine_name   = r.routine_name
WHERE r.routine_schema = 'public'
  AND r.routine_name IN (
    'check_rate_limit',
    'increment_job_edit_version',
    'admin_force_complete_job'
  )
ORDER BY r.routine_name, g.grantee;

\echo ''
\echo '=== 3. RLS posture on jobs (write paths) ==='
SELECT polname,
       polcmd,
       pg_get_expr(polqual,      polrelid) AS using_expr,
       pg_get_expr(polwithcheck, polrelid) AS check_expr
FROM pg_policy
WHERE polrelid = 'public.jobs'::regclass
ORDER BY polcmd, polname;

\echo ''
\echo '=== 4. RLS posture on service_listings (write paths) ==='
SELECT polname,
       polcmd,
       pg_get_expr(polqual,      polrelid) AS using_expr,
       pg_get_expr(polwithcheck, polrelid) AS check_expr
FROM pg_policy
WHERE polrelid = 'public.service_listings'::regclass
ORDER BY polcmd, polname;

\echo ''
\echo '=== 5. Admin allowlist contents ==='
SELECT email, created_at FROM public.admin_allowlist ORDER BY email;

\echo ''
\echo '=== 6. user_roles distribution (sanity) ==='
SELECT unnest(roles) AS role, count(*) AS users
FROM public.user_roles
GROUP BY role
ORDER BY role;

\echo ''
\echo '=== 7. rate_limit_events table guard (RLS enabled?) ==='
SELECT relname,
       relrowsecurity AS rls_enabled,
       relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname = 'rate_limit_events' AND relnamespace = 'public'::regnamespace;

\echo ''
\echo '=== 8. Triggers that call increment_job_edit_version ==='
SELECT event_object_schema AS schema,
       event_object_table  AS table,
       trigger_name,
       action_statement
FROM information_schema.triggers
WHERE action_statement ILIKE '%increment_job_edit_version%';

\echo ''
\echo '=== END OF VERIFICATION ==='
