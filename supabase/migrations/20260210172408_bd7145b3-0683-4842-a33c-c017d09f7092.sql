-- Add RLS policies for admin_platform_stats view (it's a view, needs security_invoker)
-- First check if it's a view and recreate with security_invoker if needed

-- Add RLS policy for admin_platform_stats
-- Since this is a view, we need to ensure it uses security_invoker
-- The view already exists, so we drop and recreate with security_invoker

-- Enable RLS on the underlying materialized/view object
-- For views with security_invoker=true, RLS on base tables applies automatically
-- But we should restrict direct access

-- Create a wrapper policy approach: 
-- admin_platform_stats is a VIEW so we handle it by recreating with security_invoker

DROP VIEW IF EXISTS public.admin_platform_stats;

CREATE OR REPLACE VIEW public.admin_platform_stats
WITH (security_invoker = true)
AS
SELECT
  (SELECT count(*) FROM public.user_roles)::int AS total_users,
  (SELECT count(*) FROM public.professional_profiles)::int AS total_professionals,
  (SELECT count(*) FROM public.professional_profiles WHERE is_publicly_listed = true)::int AS active_professionals,
  (SELECT count(*) FROM public.jobs)::int AS total_jobs,
  (SELECT count(*) FROM public.jobs WHERE status = 'open')::int AS open_jobs,
  (SELECT count(*) FROM public.jobs WHERE status = 'in_progress')::int AS active_jobs,
  (SELECT count(*) FROM public.jobs WHERE status = 'completed')::int AS completed_jobs,
  (SELECT count(*) FROM public.forum_posts)::int AS total_posts,
  (SELECT count(*) FROM public.conversations)::int AS total_conversations,
  (SELECT count(*) FROM public.support_requests WHERE status IN ('open', 'triage'))::int AS open_support_tickets,
  (SELECT count(*) FROM public.support_requests WHERE created_at > now() - interval '7 days')::int AS new_support_tickets;

-- Grant access only to authenticated users (RLS on base tables + admin checks in app)
GRANT SELECT ON public.admin_platform_stats TO authenticated;
REVOKE SELECT ON public.admin_platform_stats FROM anon;