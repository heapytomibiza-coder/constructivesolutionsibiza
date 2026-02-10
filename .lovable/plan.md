
## Add "Change Password" to Settings Page

### Why
The Settings page currently has no way for logged-in users to change their password. This is a gap flagged in the checklist (item 8): if a user wants to update their password, there's no in-app path. The forgot-password route is behind `PublicOnlyGuard` and will redirect them to their dashboard.

### What Changes

**File: `src/pages/settings/Settings.tsx`**

Add a "Security" card between the Account and Notifications sections:

- "Change Password" section with:
  - New password input (with show/hide toggle)
  - Confirm password input
  - Submit button
  - Uses `supabase.auth.updateUser({ password })` (same API as ResetPassword page)
  - Validation: min 6 chars, passwords must match
  - Success: toast confirmation
  - Error: toast with message

### Technical Details

- Uses the same `supabase.auth.updateUser()` call already proven in `ResetPassword.tsx`
- No new dependencies needed
- No database changes required
- Follows existing Settings page card pattern (icon + title + description + content)
- Uses `Shield` or `Lock` icon from lucide-react for the section header

### Remaining Non-Code Items (for you to action)

| Item | What to do |
|------|-----------|
| `og-image.png` | Provide a 1200x630 branded image, place in `public/` |
| `favicon.ico` | Provide a branded favicon, replace `public/favicon.ico` |
| `SITE_URL` | Set this secret to your production domain (e.g., `https://csibiza.com`) so auth emails link correctly |
| Rate limiting | Deferred to post-soft-launch hardening pass |
