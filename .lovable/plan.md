

# Implementation Plan: MVP Hardening Sprint 1 & 2

Based on a thorough review of the codebase against the hardening playbook, here's what's **already done**, what's **immediately actionable**, and the implementation order.

## Already Done (No Action Needed)

- **1.1 Gate `send-notifications` test endpoint** — Already has admin JWT + role + allowlist check (lines 458-471)
- **Privilege escalation fix** — RLS on `user_roles` already locked down
- **Admin views via SECURITY DEFINER RPCs** — Already implemented
- **`isAdminEmail()` deprecated** — File exists but has zero imports; safe to delete

## Sprint 1: Security Hardening (This Session)

### Task A — Remove hardcoded admin email from edge functions
Two files still have `heapytomibiza@gmail.com` hardcoded:
- `supabase/functions/send-job-notification/index.ts` (line 9) — Replace with `Deno.env.get("ADMIN_EMAIL")` with validation
- `supabase/functions/weekly-kpi-digest/index.ts` (line 6) — Already uses env with hardcoded fallback; remove fallback, add startup check

### Task B — Add JWT/auth checks to vulnerable edge functions
Update `supabase/config.toml` and add auth validation to:
- **`seedpacks`** — Admin-only seeding tool, not called from frontend. Add service role or admin JWT check inside the function
- **`search-stock-photos`** — Called from service listing editor. Enable `verify_jwt = true` in config.toml (only authenticated pros should use it)
- **`send-job-notification`** — Appears to be legacy (superseded by `send-notifications` queue). Evaluate if it can be deleted; if kept, add internal auth

### Task C — Delete deprecated `isAdminEmail` shim
- Delete `src/domain/adminAllowlist.ts` — confirmed zero imports remain

### Task D — Create rate limiting infrastructure
Database migration to create:
- `rate_limit_events` table (user_id, action, created_at)
- `check_rate_limit(user_id, action, max_count, window_interval)` RPC function
- Wire into job posting and conversation creation RPCs

## Sprint 2: Database Integrity

### Task E — Add performance indexes
Six critical indexes on jobs, messages, analytics_events, service_views, and email_notifications_queue. Single migration.

### Task F — Add unique constraint on conversations
Prevent duplicate conversations for the same job+client+pro combination.

### Task G — Dead-letter handling for notification queue
Add `failed_at` column to `email_notifications_queue`. Update `send-notifications` to mark items as permanently failed after 3 attempts.

## Sprint 3: Code Cleanup

### Task H — Delete 12 legacy V1 question pack files
All data is already in the `question_packs` table. These files ship with every edge function deploy unnecessarily:
- All files in `_shared/` ending with `QuestionPacks.ts` (not V2)
- `_shared/v1QuestionPacks.ts`

## Implementation Order

```text
1. Delete adminAllowlist.ts (zero-risk cleanup)
2. Fix hardcoded emails in 2 edge functions
3. Add JWT to seedpacks + search-stock-photos
4. Evaluate send-job-notification for deletion
5. DB migration: indexes + conversations constraint
6. DB migration: rate_limit_events + check_rate_limit function
7. DB migration: failed_at on email queue
8. Delete 12 V1 question pack files
9. Update send-notifications for dead-letter marking
```

## What This Achieves

| Area | Before | After |
|------|--------|-------|
| Exposed endpoints | 4 unprotected | 0 (all JWT-gated or deleted) |
| Hardcoded secrets | 2 files | 0 (env-only) |
| Dead code | ~24 legacy files + 1 deprecated shim | Removed |
| DB performance | No indexes on hot paths | 6 critical indexes |
| Rate limiting | None | Function + table ready |
| Notification resilience | Failed items retry forever | Dead-letter after 3 attempts |

All changes **extend and harden existing systems** — no new architectures, no rebuilds, no drift.

