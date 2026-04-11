

## Fix Plan: Professional Profile Data Integrity Gap

### Problem
Two users (`b10b23f8`, `d6f67cd7`) have the `professional` role but no `professional_profiles` row, causing 406 errors on every page load. This is not an onboarding regression — it's a pre-existing data integrity gap exposed by the session hook.

### What the health report actually shows
- The 9 onboarding errors are **stale-build artifacts** from a single user on April 10 who was running the old bundle. That user has since completed onboarding.
- The 9 `professional_profiles` 406 errors are all from `/messages` and `/` routes, not onboarding. They affect users with orphaned role assignments.
- Onboarding zone backfill is confirmed working: 0 of 20 `service_setup` users have missing zones.

### Fixes (2 items)

**1. SQL migration: Create missing `professional_profiles` rows**

Insert `professional_profiles` rows with `onboarding_phase = 'not_started'` for any user who has the `professional` role but no corresponding profile row. This closes the data gap immediately.

```sql
INSERT INTO professional_profiles (user_id, onboarding_phase)
SELECT ur.user_id, 'not_started'
FROM user_roles ur
WHERE 'professional' = ANY(ur.roles)
AND NOT EXISTS (
  SELECT 1 FROM professional_profiles pp WHERE pp.user_id = ur.user_id
)
ON CONFLICT DO NOTHING;
```

**2. Defensive guard in `useSessionSnapshot.ts`**

After the `professional_profiles` query, if the user has the professional role but `proResult.data` is null, log a warning and treat it as a new user (not an error). This prevents 406-type failures from reaching error monitoring for this edge case going forward.

### What this does NOT touch
- Onboarding flow code (confirmed stable)
- Alert rules or release discipline (already correct)
- The old-build errors (self-resolving)

### Technical details
- File: `src/hooks/useSessionSnapshot.ts` (~line 143-160)
- Migration: single INSERT statement
- No schema changes, no new tables

