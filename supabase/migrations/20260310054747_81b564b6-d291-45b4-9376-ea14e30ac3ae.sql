-- ============================================================
-- Migration: Tighten user_roles INSERT policy
-- Prevents self-assignment of admin/professional roles on signup
-- ============================================================

-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "System can insert roles on signup" ON public.user_roles;

-- Create tightened INSERT policy: users can only self-assign client role
CREATE POLICY "System can insert roles on signup"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND roles = ARRAY['client']::text[]
  AND active_role = 'client'
);
