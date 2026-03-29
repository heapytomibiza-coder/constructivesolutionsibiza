

# Add Trigger Guard on `user_roles` for Defense-in-Depth

## Current State

- **RLS policy** ("Users can switch active role only") uses WITH CHECK subqueries to lock `roles`, `suspended_at`, `suspended_by`, `suspension_reason` columns
- **`switch_active_role` RPC** (SECURITY DEFINER) validates the requested role is in the user's existing `roles` array
- **No trigger guard exists** — if RLS is somehow bypassed (e.g., future policy change, admin mistake), there is no second layer preventing self-escalation

All 9 security scan findings are already marked as resolved/ignored with documented reasons. No new scan findings to fix.

## What This Adds

A single `BEFORE UPDATE` trigger on `user_roles` that rejects any change to sensitive columns when the update comes from the row owner (non-admin path). This is the belt-and-suspenders layer the user requested.

## Implementation

### Migration: Add `guard_user_roles_update` trigger

```sql
CREATE OR REPLACE FUNCTION public.guard_user_roles_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only guard non-service-role updates (regular user path)
  -- Service role updates (admin, system) are allowed through
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

CREATE TRIGGER trg_guard_user_roles_update
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.guard_user_roles_update();
```

### Why check `current_setting('role')` instead of `auth.uid() = OLD.user_id`

- The `switch_active_role` RPC runs as SECURITY DEFINER, which executes under the function owner's role — not `authenticated`. So the trigger won't block the RPC.
- Admin operations via service role key also bypass the guard correctly.
- Direct client-side `.update()` calls run as `authenticated` — those are blocked from touching sensitive columns.

### Files Changed

| File | Change |
|------|--------|
| New migration SQL | `guard_user_roles_update()` function + trigger |

### What This Does NOT Change
- Existing RLS policies — kept as-is (double protection)
- `switch_active_role` RPC — unaffected (runs as definer)
- Admin suspension policies — unaffected (use service role)
- Scan findings — all already resolved/ignored

