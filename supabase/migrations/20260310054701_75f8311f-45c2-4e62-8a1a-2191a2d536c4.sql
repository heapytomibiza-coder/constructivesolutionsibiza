-- ============================================================
-- Migration: Replace unsecured admin views with SECURITY DEFINER RPCs
-- Gate: has_role(auth.uid(), 'admin') AND is_admin_email()
-- ============================================================

-- 1) admin_platform_stats → RPC
CREATE OR REPLACE FUNCTION public.rpc_admin_platform_stats()
RETURNS TABLE (
  total_users          integer,
  total_professionals  integer,
  active_professionals integer,
  total_jobs           integer,
  open_jobs            integer,
  active_jobs          integer,
  completed_jobs       integer,
  total_posts          integer,
  total_conversations  integer,
  open_support_tickets integer,
  new_support_tickets  integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::int FROM user_roles),
    (SELECT count(*)::int FROM professional_profiles),
    (SELECT count(*)::int FROM professional_profiles WHERE is_publicly_listed = true),
    (SELECT count(*)::int FROM jobs),
    (SELECT count(*)::int FROM jobs WHERE status = 'open'),
    (SELECT count(*)::int FROM jobs WHERE status = 'in_progress'),
    (SELECT count(*)::int FROM jobs WHERE status = 'completed'),
    (SELECT count(*)::int FROM forum_posts),
    (SELECT count(*)::int FROM conversations),
    (SELECT count(*)::int FROM support_requests WHERE status IN ('open','triage')),
    (SELECT count(*)::int FROM support_requests WHERE created_at > now() - interval '7 days')
  WHERE has_role(auth.uid(), 'admin') AND is_admin_email();
$$;

-- 2) admin_users_list → RPC
CREATE OR REPLACE FUNCTION public.rpc_admin_users_list()
RETURNS TABLE (
  id                     uuid,
  roles                  text[],
  active_role            text,
  created_at             timestamptz,
  suspended_at           timestamptz,
  suspension_reason      text,
  display_name           text,
  phone                  text,
  pro_verification_status text,
  pro_onboarding_phase   text,
  pro_services_count     integer,
  pro_is_listed          boolean,
  status                 text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ur.user_id AS id,
    ur.roles,
    ur.active_role,
    ur.created_at,
    ur.suspended_at,
    ur.suspension_reason,
    p.display_name,
    p.phone,
    CASE WHEN 'professional' = ANY(ur.roles) THEN pp.verification_status ELSE NULL END,
    CASE WHEN 'professional' = ANY(ur.roles) THEN pp.onboarding_phase ELSE NULL END,
    CASE WHEN 'professional' = ANY(ur.roles) THEN pp.services_count ELSE 0 END,
    CASE WHEN 'professional' = ANY(ur.roles) THEN pp.is_publicly_listed ELSE false END,
    CASE
      WHEN ur.suspended_at IS NOT NULL THEN 'suspended'
      WHEN 'professional' = ANY(ur.roles) AND pp.is_publicly_listed = true THEN 'active_pro'
      WHEN 'professional' = ANY(ur.roles) THEN 'pending_pro'
      ELSE 'active'
    END
  FROM user_roles ur
  LEFT JOIN profiles p ON p.user_id = ur.user_id
  LEFT JOIN professional_profiles pp ON pp.user_id = ur.user_id
  WHERE has_role(auth.uid(), 'admin') AND is_admin_email();
$$;

-- 3) admin_support_inbox → RPC
CREATE OR REPLACE FUNCTION public.rpc_admin_support_inbox()
RETURNS TABLE (
  id                   uuid,
  ticket_number        text,
  conversation_id      uuid,
  job_id               uuid,
  created_by_user_id   uuid,
  created_by_role      text,
  issue_type           text,
  summary              text,
  status               text,
  priority             text,
  assigned_to          uuid,
  created_at           timestamptz,
  updated_at           timestamptz,
  resolved_at          timestamptz,
  job_title            text,
  job_category         text,
  client_id            uuid,
  pro_id               uuid,
  last_message_at      timestamptz,
  last_message_preview text,
  age_hours            numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sr.id,
    sr.ticket_number,
    sr.conversation_id,
    sr.job_id,
    sr.created_by_user_id,
    sr.created_by_role,
    sr.issue_type,
    sr.summary,
    sr.status,
    sr.priority,
    sr.assigned_to,
    sr.created_at,
    sr.updated_at,
    sr.resolved_at,
    j.title,
    j.category,
    c.client_id,
    c.pro_id,
    c.last_message_at,
    c.last_message_preview,
    EXTRACT(epoch FROM now() - sr.created_at) / 3600
  FROM support_requests sr
  LEFT JOIN jobs j ON j.id = sr.job_id
  LEFT JOIN conversations c ON c.id = sr.conversation_id
  WHERE has_role(auth.uid(), 'admin') AND is_admin_email();
$$;
