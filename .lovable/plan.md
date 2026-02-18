

# Minimal Drip-Feed Rollout System

## What This Does

Adds a single "rollout phase" switch that controls which parts of the site are visible and accessible. You change one value to reveal features progressively -- no database, no admin UI, no complex system. Just route-level gating plugged into your existing registry/nav/guard architecture.

## What Gets Built

### 1. Rollout config (1 new file)

**New file: `src/domain/rollout.ts`**

Defines 6 ordered phases and a single `CURRENT_ROLLOUT` constant (starts at `pipe-control`). One helper function `isRolloutActive(min)` checks if the current phase has reached a given minimum.

### 2. RouteConfig gets one new field

**Modified: `src/app/routes/rules.ts`**

Add `minRollout?: RolloutPhase` to `RouteConfig`. Any route with this field is hidden from nav and blocked by the guard until that phase is reached.

### 3. Nav filters by rollout

**Modified: `src/app/routes/nav.ts`**

`canSeeRoute()` gets one line added at the top: if the route has `minRollout` and the current rollout hasn't reached it, return false. Links disappear from menus automatically.

### 4. RouteGuard blocks direct URL access

**Modified: `src/guard/RouteGuard.tsx`**

After resolving the route config, before checking access rules: if `minRollout` isn't reached, redirect to `/`. Prevents URL-guessing.

### 5. Registry routes get tagged

**Modified: `src/app/routes/registry.ts`**

Tag routes you want hidden right now:
- `/services`, `/services/:categorySlug` -- `minRollout: 'service-layer'`
- `/professionals`, `/professionals/:id` -- `minRollout: 'founding-members'`
- `/services/listing/:listingId` -- `minRollout: 'service-layer'`

Everything else stays visible: Home, Post Job, Jobs, Forum, How it Works, Contact, Auth, Messages, Settings.

### 6. Auth signup gets a "Full name" field

**Modified: `src/pages/auth/Auth.tsx`**

Add a required "Full name" input above email in the signup form. Pass it as `full_name` in signup metadata so the existing `handle_new_user()` trigger can pick it up. The `profiles` table already has `display_name` -- update the trigger to populate it.

### 7. Update handle_new_user trigger

**Database migration**

Update the existing `handle_new_user()` function to also set `display_name` from `raw_user_meta_data->>'full_name'` when creating the profile row.

## What's Visible After This (pipe-control)

| Visible | Hidden until later |
|---------|--------------------|
| Home `/` | `/services` (service-layer) |
| Post Job `/post` | `/professionals` (founding-members) |
| Jobs `/jobs` | Service listing detail (service-layer) |
| Forum `/forum` | |
| How it Works | |
| Contact | |
| Auth + Messages + Settings (when logged in) | |

## How You Drip-Feed

Change one line in `src/domain/rollout.ts`:

```text
export const CURRENT_ROLLOUT: RolloutPhase = 'pipe-control';
```

to `'founding-members'` -- professionals directory appears.
to `'service-layer'` -- services marketplace appears.
to `'trust-engine'` -- (gate reviews UI later the same way).

No database changes needed. Just redeploy.

## Technical Details

### Files changed (5 modified, 1 new)

| File | Change |
|------|--------|
| `src/domain/rollout.ts` | **NEW** -- RolloutPhase type, CURRENT_ROLLOUT constant, isRolloutActive() helper |
| `src/app/routes/rules.ts` | Add `minRollout?: RolloutPhase` to RouteConfig interface |
| `src/app/routes/nav.ts` | Import rollout, add 1 check at top of canSeeRoute() |
| `src/guard/RouteGuard.tsx` | Import rollout, add 1 redirect check before access check |
| `src/app/routes/registry.ts` | Add `minRollout` to /services, /professionals, /services/listing routes |
| `src/pages/auth/Auth.tsx` | Add fullName state + input field + pass in signup metadata |

### Database migration (1)

Update `handle_new_user()` trigger to set `profiles.display_name` from `full_name` metadata.

### No new tables, no admin UI, no external dependencies

