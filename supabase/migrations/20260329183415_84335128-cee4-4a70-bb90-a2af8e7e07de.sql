-- Fix 3: Tighten user_roles self-update to also protect suspension fields
DROP POLICY IF EXISTS "Users can switch active role only" ON public.user_roles;

CREATE POLICY "Users can switch active role only"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND roles = (SELECT ur.roles FROM user_roles ur WHERE ur.user_id = auth.uid())
  AND suspended_at IS NOT DISTINCT FROM (SELECT ur.suspended_at FROM user_roles ur WHERE ur.user_id = auth.uid())
  AND suspended_by IS NOT DISTINCT FROM (SELECT ur.suspended_by FROM user_roles ur WHERE ur.user_id = auth.uid())
  AND suspension_reason IS NOT DISTINCT FROM (SELECT ur.suspension_reason FROM user_roles ur WHERE ur.user_id = auth.uid())
);