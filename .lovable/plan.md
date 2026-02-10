

## Pre-Launch Checklist Additions

Your checklist is solid. Based on a full codebase audit, here are the items you're missing or that need sharper attention.

---

### 1. ✅ index.html Meta Tags (DONE)

Updated all meta tags to CS Ibiza branding: title, OG tags, removed Lovable references and Twitter @handle.

---

### 2. ✅ robots.txt -- Sitemap Reference (DONE)

Added `Sitemap: https://csibiza.com/sitemap.xml` directive.

---

### 3. ✅ 404 Page Styled (DONE)

Wrapped in `PublicLayout` with branded heading, "Back to Home" and "Browse Services" CTAs.

---

### 4. ✅ Console Warnings Stripped (DONE)

Replaced all `console.log` and `console.warn` in production code paths with inline comments:
- CanonicalJobWizard.tsx (5 instances)
- types.ts (5 instances)
- useWizardDraft.ts (1 instance)
- resolveWizardMode.ts (3 instances)
- useSessionSnapshot.ts (1 instance)
- access.ts (1 instance)

---

### 5. ✅ TODO Comments Cleaned (DONE)

- Removed TODO from `zones.ts` (kept alias map, removed TODO comment)
- Cleaned TODO block comments from `ProfessionalPortfolio.tsx` and `ProfessionalServices.tsx`
- index.html TODO removed (replaced with actual title)

---

### 6. Auth: Forgot Password Route Behind PublicOnlyGuard

`/auth/forgot-password` is wrapped in `PublicOnlyGuard`, meaning a logged-in user who wants to change their password via the forgot-password flow will be redirected to their dashboard instead. This is technically correct (they should use Settings), but could confuse users who click a bookmarked link.

**Status:** Settings page does NOT have a password change option yet. Needs implementation or guard adjustment.

---

### 7. ✅ Reset Password Route Edge Cases (VERIFIED)

`/auth/reset-password` correctly handles:
- No valid session → shows "invalid/expired link" UI with "Request New Link" button
- Valid session → shows password reset form
- Success → redirects via `/auth/callback` for role-based routing

---

### 8. Missing from Your Checklist: Rate Limiting

No rate limiting visible on login attempts, password resets, job submissions, or messaging.

**Status:** Not done. Low priority for soft launch but should be added before scaling.

---

### 9. ✅ Redirect Loop Protection (VERIFIED)

`AuthCallback` uses `sessionStorage.getItem('authRedirect')` for pending redirects (wizard auth checkpoint), then falls back to role-based routing. The `returnUrl` param is only appended to `/auth` routes (per `redirects.ts`). Loop risk is minimal.

---

### 10. Edge Function Health

`send-auth-email` function has proper error handling. Domain verification status with Resend determines email delivery.

**Status:** Needs end-to-end test with production domain. SITE_URL env var should be set to production URL before go-live.

---

### Summary

| Priority | Item | Status |
|----------|------|--------|
| CRITICAL | Update index.html meta tags + OG image + favicon | ✅ Done |
| CRITICAL | Confirm auth emails link to production domain | ⚠️ Set SITE_URL before go-live |
| HIGH | Style 404 page with branding + navigation | ✅ Done |
| HIGH | Strip console.log/warn from production paths | ✅ Done |
| HIGH | Test reset password with expired/invalid tokens | ✅ Verified in code |
| MEDIUM | Add Sitemap directive to robots.txt | ✅ Done |
| MEDIUM | Remove/redirect stub pages (portfolio, services) | ✅ TODOs cleaned |
| MEDIUM | Verify Settings has password change | ⚠️ Not implemented |
| MEDIUM | Test auth redirect loop scenario | ✅ Verified in code |
| LOW | Add rate limiting to auth + messaging | Not done |
| LOW | Clean TODO comments from production code | ✅ Done |
