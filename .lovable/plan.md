

## Change: Client post-auth landing → Homepage

**Current behavior:** `AuthCallback.tsx` sends clients to `/post` after sign-in.
**New behavior:** Clients land on `/` (homepage) instead.

### Files to change

1. **`src/pages/auth/AuthCallback.tsx`** (line ~72)
   - Change `navigate('/post')` to `navigate('/')`

2. **`src/guard/RouteGuard.tsx`** — `PublicOnlyGuard` (line ~95)
   - Change the client fallback from `'/post'` to `'/'`

Two single-line changes, no other files affected.

