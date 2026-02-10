

## Pre-Launch Checklist Additions

Your checklist is solid. Based on a full codebase audit, here are the items you're missing or that need sharper attention.

---

### 1. index.html Meta Tags (CRITICAL -- Social previews will look broken)

The `index.html` still has Lovable defaults:

- Title: "Lovable App" (should be "Constructive Solutions Ibiza" or similar)
- OG title: "Lovable App"
- OG description: "Lovable Generated Project"
- OG image: points to `lovable.dev/opengraph-image-p98pqg.png`
- Twitter card: references `@Lovable`
- Favicon: default Lovable icon

**Action:** Update all meta tags, OG image, Twitter handle, and favicon to match CS Ibiza branding. This is what shows when someone shares a link on WhatsApp/iMessage/social.

---

### 2. robots.txt -- Missing Sitemap Reference

Currently allows all crawlers but has no `Sitemap:` directive. Search engines won't find your pages efficiently without it.

**Action:** Add `Sitemap: https://yourdomain.com/sitemap.xml` and consider generating a basic sitemap (at minimum: homepage, services, professionals, how-it-works).

---

### 3. 404 Page is Bare

The NotFound page works but is unstyled compared to the rest of the app -- plain text, no branding, no navigation. Users who hit a dead link will think the site is broken.

**Action:** Wrap it in `PublicLayout`, add the CS Ibiza branding, and include a search bar or "Browse Services" CTA.

---

### 4. Console Warnings in Production

Found `console.log` and `console.warn` statements in production code paths:

- Wizard deep-link processor (`CanonicalJobWizard.tsx`): `console.log('[DeepLink] Hydrated micro...')`
- Search-to-wizard fallbacks (`types.ts`): multiple `console.warn('[Search->Wizard]...')`
- Wizard draft saving: `console.warn('Failed to save wizard draft...')`
- Session snapshot: `console.warn('Cannot switch to role...')`

These are fine for dev but look unprofessional in a user's browser console and leak internal architecture details.

**Action:** Either strip these or gate them behind a `DEV` flag before launch.

---

### 5. TODO Comments Still in Code

Found production-visible TODOs:

- `zones.ts`: "TODO: Run migration to normalize all values"
- `ProfessionalServices.tsx`: "TODO: Implement service management"
- `ProfessionalPortfolio.tsx`: "TODO: Implement portfolio"
- `index.html`: "TODO: Set the document title"

The services and portfolio pages are behind auth, but if a pro navigates to them they'll see placeholder/stub content.

**Action:** Either implement or redirect those routes to the dashboard. The `/professional/services` route already redirects, but `/professional/portfolio` should be checked.

---

### 6. Auth: Forgot Password Route Behind PublicOnlyGuard

`/auth/forgot-password` is wrapped in `PublicOnlyGuard`, meaning a logged-in user who wants to change their password via the forgot-password flow will be redirected to their dashboard instead. This is technically correct (they should use Settings), but could confuse users who click a bookmarked link.

**Action:** Verify the Settings page has a working "Change Password" option, or consider removing forgot-password from the public-only guard.

---

### 7. Reset Password Route Has No Guard

`/auth/reset-password` is outside both `PublicOnlyGuard` and `RouteGuard` -- it's fully public. This is correct for the magic-link flow, but verify it handles edge cases:

- What if someone visits it without a valid token?
- What if the token is expired?

**Action:** Test the reset password flow end-to-end including expired/invalid token scenarios.

---

### 8. Missing from Your Checklist: Rate Limiting

No rate limiting visible on:

- Login attempts (brute force risk)
- Password reset requests
- Job submissions (the idempotency key helps but doesn't prevent spam)
- Message sending

**Action:** Consider adding rate limiting via backend functions or database constraints before public launch. At minimum, the auth edge function (`send-auth-email`) should have basic throttling.

---

### 9. Missing: Redirect Loop Protection

The `returnUrl` parameter is passed through auth flows. If a user hits a guarded route, gets sent to `/auth?returnUrl=/protected`, logs in, and still doesn't have access (e.g., wrong role), they could loop.

**Action:** Verify that `AuthCallback` doesn't blindly redirect to `returnUrl` without checking if the user actually has access to that route.

---

### 10. Missing: Edge Function Health

Three edge functions are deployed (`ping`, `seedpacks`, `send-auth-email`) -- all with `verify_jwt = false`. The `send-auth-email` function is your critical auth path.

**Action:** 
- Test `send-auth-email` works for signup, resend, and recovery flows
- Confirm it has proper error handling for missing/invalid email
- Verify the confirmation email link points to your production domain, not the preview URL

---

### Summary of Additions to Your Checklist

| Priority | Item | Status |
|----------|------|--------|
| CRITICAL | Update index.html meta tags + OG image + favicon | Not done |
| CRITICAL | Confirm auth emails link to production domain | Needs test |
| HIGH | Style 404 page with branding + navigation | Not done |
| HIGH | Strip console.log/warn from production paths | Not done |
| HIGH | Test reset password with expired/invalid tokens | Needs test |
| MEDIUM | Add Sitemap directive to robots.txt | Not done |
| MEDIUM | Remove/redirect stub pages (portfolio, services) | Partially done |
| MEDIUM | Verify Settings has password change | Needs test |
| MEDIUM | Test auth redirect loop scenario | Needs test |
| LOW | Add rate limiting to auth + messaging | Not done |
| LOW | Clean TODO comments from production code | Not done |

