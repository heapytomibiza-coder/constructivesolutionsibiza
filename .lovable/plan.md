
# Security Hardening Sprint — Status

Updated: 2026-02-24

## ✅ PHASE 1 — P0: COMPLETED

### 1. Lock down `user_roles` RLS ✅
- Dropped permissive "Users can update their own roles" policy
- Created restricted policy that blocks `roles` array modification
- Created `switch_active_role(p_new_role text)` SECURITY DEFINER RPC
- Updated `switchRole()` in `useSessionSnapshot.ts` to use RPC

### 2. `.env` in `.gitignore` ⚠️
- `.gitignore` is read-only in Lovable Cloud — `.env` is auto-managed and contains only publishable keys

---

## ✅ PHASE 2 — P1: COMPLETED

### 3. Remove hardcoded admin emails ✅
- Removed all email addresses from `adminAllowlist.ts`
- `isAdminEmail()` is now a deprecated no-op
- Frontend gates admin via `hasRole('admin')` from session context
- DB-level `is_admin_email()` enforces real security

### 4. Rename `admin2FA` → `admin` ✅
- Updated `rules.ts`, `access.ts`, `registry.ts`, `nav.ts`
- No more misleading 2FA references

### 5. Error Boundary ✅ (already existed)

---

## ✅ PHASE 3 — P2: COMPLETED

### 6. Admin RLS audit ✅
- All admin tables verified: use `has_role() AND is_admin_email()`
- Tables confirmed: admin_actions_log, support_requests, professional_profiles, messages, conversation_participants, analytics_events, attribution_sessions, job_notifications_queue, service_views, professional_documents, support_request_events, job_status_history

### 7. CSP headers ✅
- Added Content-Security-Policy meta tag to `index.html`
- Baseline policy: self + Supabase endpoints + fonts

### 8. Auth guard tests ✅
- 8 tests covering all access rules
- Tests: public, auth, role:client, role:professional, proReady, admin, unauthenticated admin, unknown rules

---

## PHASE 4 — P3: Cleanup (deferred)
- Radix package audit
- eslint-plugin-import → devDependencies
- next-themes evaluation
