-- =============================================================================
-- Track 5 — Response RLS Test Pack (live verification)
-- =============================================================================
-- Purpose: Prove the live behavior of job_responses (and the response RPC layer)
-- BEFORE any user-facing UI is built on top of it.
--
-- Run as: postgres/service_role (read-only). All checks return one row per
-- assertion with a PASS/FAIL verdict so the pack is grep-able and CI-friendly.
--
-- Pack covers:
--   §1  RLS is enabled on job_responses + job_matches
--   §2  Table grants: anon=NONE, authenticated=SELECT only
--   §3  Policies present and shaped correctly on job_responses
--   §4  RPC EXECUTE grants: anon/PUBLIC=NO, authenticated=YES (defense in depth)
--   §5  Schema invariants the RLS model assumes (one-winner index, FK shape)
--
-- NOTE: This pack does NOT test runtime row visibility per user — that requires
-- a seeded multi-user fixture and is owned by the interaction test suite once
-- the Responses UI / action layer lands. The grant/policy/RPC layer proven
-- here is what makes that visibility safe.
-- =============================================================================

\echo '== §1 RLS enabled =='
SELECT
  relname AS table_name,
  relrowsecurity AS rls_on,
  CASE WHEN relrowsecurity THEN 'PASS' ELSE 'FAIL' END AS verdict
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN ('job_responses', 'job_matches')
ORDER BY relname;

\echo '== §2 Table grants (anon=NONE, authenticated=SELECT only — no write privs) =='
-- Use has_table_privilege() because information_schema.role_table_grants
-- does not surface Supabase's NOLOGIN pseudo-roles (anon/authenticated)
-- consistently across Postgres versions. has_table_privilege() is authoritative.
WITH targets(table_name) AS (VALUES ('job_responses'), ('job_matches'))
SELECT
  t.table_name,
  has_table_privilege('anon',          'public.'||t.table_name, 'SELECT') AS anon_select,
  has_table_privilege('authenticated', 'public.'||t.table_name, 'SELECT') AS auth_select,
  has_table_privilege('authenticated', 'public.'||t.table_name, 'INSERT') AS auth_insert,
  has_table_privilege('authenticated', 'public.'||t.table_name, 'UPDATE') AS auth_update,
  has_table_privilege('authenticated', 'public.'||t.table_name, 'DELETE') AS auth_delete,
  CASE
    WHEN has_table_privilege('anon', 'public.'||t.table_name, 'SELECT')
      THEN 'FAIL: anon can SELECT'
    WHEN NOT has_table_privilege('authenticated', 'public.'||t.table_name, 'SELECT')
      THEN 'FAIL: authenticated cannot SELECT'
    WHEN has_table_privilege('authenticated', 'public.'||t.table_name, 'INSERT')
      OR has_table_privilege('authenticated', 'public.'||t.table_name, 'UPDATE')
      OR has_table_privilege('authenticated', 'public.'||t.table_name, 'DELETE')
      THEN 'FAIL: authenticated has direct write — should be RPC-only'
    ELSE 'PASS'
  END AS verdict
FROM targets t
ORDER BY t.table_name;

\echo '== §3 Policies on job_responses (admin ALL + pro SELECT own + client SELECT owned-jobs) =='
WITH expected(polname, polcmd_label) AS (
  VALUES
    ('Admins manage all job_responses',     'ALL'),
    ('Professionals read own job_responses','SELECT'),
    ('Clients read responses on owned jobs','SELECT')
),
actual AS (
  SELECT polname::text,
         CASE polcmd WHEN 'r' THEN 'SELECT'
                     WHEN '*' THEN 'ALL'
                     WHEN 'a' THEN 'INSERT'
                     WHEN 'w' THEN 'UPDATE'
                     WHEN 'd' THEN 'DELETE' END AS polcmd_label
  FROM pg_policy
  WHERE polrelid = 'public.job_responses'::regclass
)
SELECT e.polname,
       e.polcmd_label AS expected_cmd,
       a.polcmd_label AS actual_cmd,
       CASE WHEN a.polcmd_label = e.polcmd_label THEN 'PASS' ELSE 'FAIL' END AS verdict
FROM expected e
LEFT JOIN actual a USING (polname)
ORDER BY e.polname;

\echo '== §4 RPC EXECUTE grants (expected: anon=NO, public=NO, authenticated=YES) =='
WITH rpcs(name) AS (
  VALUES
    ('express_interest'),
    ('link_quote_to_response'),
    ('withdraw_response'),
    ('shortlist_response'),
    ('accept_response'),
    ('decline_response')
)
SELECT
  r.name AS rpc,
  has_function_privilege('anon',          (p.oid)::regprocedure, 'EXECUTE') AS anon_exec,
  has_function_privilege('authenticated', (p.oid)::regprocedure, 'EXECUTE') AS auth_exec,
  has_function_privilege('public',        (p.oid)::regprocedure, 'EXECUTE') AS public_exec,
  CASE
    WHEN has_function_privilege('anon',          (p.oid)::regprocedure, 'EXECUTE') THEN 'FAIL: anon can execute'
    WHEN has_function_privilege('public',        (p.oid)::regprocedure, 'EXECUTE') THEN 'FAIL: PUBLIC can execute'
    WHEN NOT has_function_privilege('authenticated', (p.oid)::regprocedure, 'EXECUTE') THEN 'FAIL: authenticated cannot execute'
    ELSE 'PASS'
  END AS verdict
FROM rpcs r
JOIN pg_proc p ON p.proname = r.name
JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
ORDER BY r.name;

\echo '== §5 Schema invariants =='
-- 5a: one-winner-per-job partial unique index exists
SELECT
  'one_accepted_per_job_index' AS invariant,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'job_responses'
      AND indexname = 'job_responses_one_accepted_per_job'
  ) AS present,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'job_responses'
      AND indexname = 'job_responses_one_accepted_per_job'
  ) THEN 'PASS' ELSE 'FAIL' END AS verdict;

-- 5b: status column constrained to known set
SELECT
  'status_check_constraint' AS invariant,
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.job_responses'::regclass
      AND conname = 'job_responses_status_chk'
  ) AS present,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.job_responses'::regclass
      AND conname = 'job_responses_status_chk'
  ) THEN 'PASS' ELSE 'FAIL' END AS verdict;

-- 5c: one (job, professional) row enforced
SELECT
  'unique_job_pro_pair' AS invariant,
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.job_responses'::regclass
      AND conname = 'job_responses_job_pro_key'
  ) AS present,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.job_responses'::regclass
      AND conname = 'job_responses_job_pro_key'
  ) THEN 'PASS' ELSE 'FAIL' END AS verdict;

\echo '== Done. Any FAIL verdict above is a Track 5 RLS regression. =='
