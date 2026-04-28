## Goal

Give Gary Peachey professional access. Right now he has **two client-only accounts** and **no professional profile or role record on either**, so he cannot act as a pro at all.

## Current state (verified in DB)

| Account ID | Display name | Phone | Created | `user_roles` | `professional_profiles` | Jobs |
|---|---|---|---|---|---|---|
| `f3ed67dd-…745acf` | Gary Peachey | +34634020260 | 2026-03-04 | none | none | 0 |
| `bb85e2cb-…2643b4` | Gary Peachey | 634020260 | 2026-03-16 | none | none | 0 |

Note: the previously referenced `718a1c04…` account does **not exist** in the database — that ID was stale. There is nothing to merge: both accounts are empty shells, no jobs, no listings, no messages.

## Decision

- **Keep `bb85e2cb-…2643b4`** as Gary's primary account (most recent, matches his current phone format).
- **Soft-archive `f3ed67dd-…745acf`** by leaving it dormant (no roles, no profile). We can hard-delete later if needed; for now leaving it does no harm because it has zero attached data.
- **Grant professional access** on the primary account so when Gary logs in he is routed straight into pro onboarding.

## Changes (data only — no schema changes, no frontend changes)

Two inserts on `bb85e2cb-eee0-4545-90d8-31cc082643b4`:

1. **`user_roles`**
   - `roles = ['client','professional']`
   - `active_role = 'professional'`

2. **`professional_profiles`** (minimal stub, all other columns use defaults)
   - `user_id = bb85e2cb-…`
   - `onboarding_phase = 'not_started'` (default) — he will land in the standard pro onboarding flow
   - `is_publicly_listed = false` (default) — he will not appear in the marketplace until he completes onboarding and the readiness rules pass

3. **Audit log** entry in `admin_actions_log` recording the manual grant, target, and reason ("Manual pro access grant — onboarded outside platform").

## What this does NOT do

- Does **not** make him publicly visible — the existing `enforce_pro_public_listing_guard` trigger still applies; visibility only flips on once he completes onboarding (or you manually flip it later, like the previous Gary case).
- Does **not** create listings, services, or skip any verification.
- Does **not** touch the duplicate `f3ed67dd-…` account.

## Expected outcome for Gary

- Next login → role switcher shows "Professional" → routed to `/onboarding/pro` → he completes the standard 3-step pro onboarding → his listings become eligible to publish.

## Optional follow-ups (not in this change)

- DM/email Gary the link to log in and finish setup.
- Decide later whether to delete the dormant `f3ed67dd-…` account (safe to drop — zero attached data).
