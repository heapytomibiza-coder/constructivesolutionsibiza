-- Defense-in-depth: trigger guard on user_roles
-- Blocks authenticated users from modifying sensitive columns directly.
-- The switch_active_role RPC runs as SECURITY DEFINER (not 'authenticated'), so it passes through.

CREATE OR REPLACE FUNCTION public.guard_user_roles_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'authenticated' THEN
    IF NEW.roles IS DISTINCT FROM OLD.roles THEN
      RAISE EXCEPTION 'Cannot modify roles array directly';
    END IF;
    IF NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
       OR NEW.suspended_by IS DISTINCT FROM OLD.suspended_by
       OR NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason THEN
      RAISE EXCEPTION 'Cannot modify suspension fields directly';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_user_roles_update ON public.user_roles;

CREATE TRIGGER trg_guard_user_roles_update
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.guard_user_roles_update();