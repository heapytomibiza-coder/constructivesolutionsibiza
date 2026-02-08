-- =============================================
-- ADMIN PHASE 2: User management infrastructure
-- =============================================

-- 1. Add suspension tracking to user_roles
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS suspended_by UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT DEFAULT NULL;

-- 2. Create admin_users_list view for user management
-- This view joins user_roles with profiles and professional_profiles
CREATE OR REPLACE VIEW public.admin_users_list
WITH (security_invoker = true)
AS
SELECT
  ur.user_id AS id,
  ur.roles,
  ur.active_role,
  ur.created_at,
  ur.suspended_at,
  ur.suspension_reason,
  p.display_name,
  p.phone,
  CASE 
    WHEN 'professional' = ANY(ur.roles) THEN pp.verification_status
    ELSE NULL
  END AS pro_verification_status,
  CASE 
    WHEN 'professional' = ANY(ur.roles) THEN pp.onboarding_phase
    ELSE NULL
  END AS pro_onboarding_phase,
  CASE 
    WHEN 'professional' = ANY(ur.roles) THEN pp.services_count
    ELSE 0
  END AS pro_services_count,
  CASE 
    WHEN 'professional' = ANY(ur.roles) THEN pp.is_publicly_listed
    ELSE FALSE
  END AS pro_is_listed,
  CASE
    WHEN ur.suspended_at IS NOT NULL THEN 'suspended'
    WHEN 'professional' = ANY(ur.roles) AND pp.is_publicly_listed = true THEN 'active_pro'
    WHEN 'professional' = ANY(ur.roles) THEN 'pending_pro'
    ELSE 'active'
  END AS status
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
LEFT JOIN public.professional_profiles pp ON pp.user_id = ur.user_id;

-- 3. Admin policies for user management

-- Allow admins to read all user_roles
CREATE POLICY "Admins can read all user roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update suspension status
CREATE POLICY "Admins can update user suspension"
  ON public.user_roles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all professional profiles
CREATE POLICY "Admins can read all professional profiles"
  ON public.professional_profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update professional verification status
CREATE POLICY "Admins can update professional verification"
  ON public.professional_profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));