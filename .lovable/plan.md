

# Grant Professional Role to constructivesolutionsibiza@gmail.com

## Current State
- Account exists (UUID: `d0495545-...`), email confirmed since Feb 3rd
- Roles: `[client, admin]` -- missing `professional`
- No `professional_profiles` row exists
- Active role: `client`

## What Needs to Change

### 1. Add `professional` to the roles array
Update `user_roles` to include `professional` alongside the existing `client` and `admin` roles.

### 2. Create a professional profile
Insert a row into `professional_profiles` with `onboarding_phase = 'not_started'` so the onboarding wizard launches on first visit.

### 3. No code changes needed
The existing route guards and session logic already handle the `professional` role correctly.

## After the Fix
- You can sign in normally with your email and password (no email confirmation needed -- it's already done)
- Switch to Tasker mode in Settings
- Complete professional onboarding when ready
- Admin Panel link will still be visible since the `admin` role is preserved

## SQL to Execute
```sql
-- Add professional to roles array
UPDATE public.user_roles
SET roles = array_append(roles, 'professional')
WHERE user_id = 'd0495545-8fd2-411b-83d4-3f405c5940ff'
AND NOT ('professional' = ANY(roles));

-- Create professional profile for onboarding
INSERT INTO public.professional_profiles (user_id, onboarding_phase, verification_status)
VALUES ('d0495545-8fd2-411b-83d4-3f405c5940ff', 'not_started', 'unverified')
ON CONFLICT (user_id) DO NOTHING;
```

