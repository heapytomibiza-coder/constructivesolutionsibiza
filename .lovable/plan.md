

## Plan: Switch Unique World Solutions SL to Tasker active role

### Current State
- **Unique World Solutions SL** (user_id: `3b90e175-8d8f-4b72-8ca7-340fa98bd38f`)
  - Already has roles: `[client, professional]`
  - Active role: `client` (needs to be `professional`)
  - Professional profile exists with `onboarding_phase: not_started`
- **Thomas Heap / heapytomibiza** — already set up correctly as Tasker (two accounts, both active_role: `professional`)

### Change
One database migration to update the active role:

```sql
UPDATE public.user_roles
SET active_role = 'professional', updated_at = now()
WHERE user_id = '3b90e175-8d8f-4b72-8ca7-340fa98bd38f';
```

This will make Unique World Solutions SL land in the Tasker lane on next login and begin the Tasker onboarding flow.

No code changes required.

