
DROP POLICY IF EXISTS "Only admins can read allowlist" ON public.admin_allowlist;
CREATE POLICY "Only admins can read allowlist"
ON public.admin_allowlist
FOR SELECT
USING (has_role(auth.uid(), 'admin'::text) AND public.is_admin_email());
