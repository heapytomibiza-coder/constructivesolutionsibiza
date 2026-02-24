
-- P0: Lock down user_roles UPDATE policy
-- 1. Drop the permissive "Users can update their own roles" policy
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;

-- 2. Create restricted policy: users can ONLY update active_role column
-- The WITH CHECK ensures active_role must be a value in their existing roles array
CREATE POLICY "Users can switch active role only"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND roles = (SELECT ur.roles FROM public.user_roles ur WHERE ur.user_id = auth.uid())
);

-- 3. Create SECURITY DEFINER RPC for safe role switching
CREATE OR REPLACE FUNCTION public.switch_active_role(p_new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate the new role is in the user's existing roles array
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND p_new_role = ANY(roles)
  ) THEN
    RAISE EXCEPTION 'Role not available: %', p_new_role;
  END IF;

  UPDATE public.user_roles
  SET active_role = p_new_role, updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;
