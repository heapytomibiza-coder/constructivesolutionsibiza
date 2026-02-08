-- =============================================
-- ADMIN FOUNDATION: Role check function + platform stats view
-- =============================================

-- 1. Create has_role function (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND _role = ANY(roles)
  )
$$;

-- 2. Create admin_actions_log table for audit trail
CREATE TABLE public.admin_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS - only admins can access
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read action logs"
  ON public.admin_actions_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert action logs"
  ON public.admin_actions_log
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_user_id = auth.uid());

-- 3. Create admin_platform_stats view
CREATE VIEW public.admin_platform_stats
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*) FROM public.user_roles) AS total_users,
  (SELECT COUNT(*) FROM public.user_roles WHERE 'professional' = ANY(roles)) AS total_professionals,
  (SELECT COUNT(*) FROM public.professional_profiles WHERE is_publicly_listed = true) AS active_professionals,
  (SELECT COUNT(*) FROM public.jobs) AS total_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'open') AS open_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'in_progress') AS active_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'completed') AS completed_jobs,
  (SELECT COUNT(*) FROM public.forum_posts) AS total_posts,
  (SELECT COUNT(*) FROM public.conversations) AS total_conversations;

-- 4. Grant admin SELECT on the stats view
-- Note: RLS will use has_role check in the application layer