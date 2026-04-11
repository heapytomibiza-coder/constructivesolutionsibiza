

# Plan: Implement QA Test Suite for Constructive Solutions Ibiza

## Current State

You already have a solid test infrastructure:
- **Vitest + React Testing Library + jsdom** configured
- **CI pipeline** in `.github/workflows/ci.yml`
- **Existing tests** across 3 layers:
  - `src/test/access.test.ts` — unit tests for access rules
  - `src/test/smoke/` — 7 smoke tests (auth, dashboard, guards, messages, onboarding, post, wizard)
  - `src/test/interaction/` — 4 interaction tests (auth-redirect, dashboard-action, onboarding-flow, wizard-flow)
  - `src/features/search/lib/__tests__/` — feature-level unit test
- **Shared patterns**: mock factories for SessionContext, Supabase client, i18n, and trackEvent

## Coverage Gap Analysis

Your 12-section QA spec maps to the existing tests like this:

| Section | Existing Coverage | Gap |
|---|---|---|
| 1. Auth (AUTH-001–010) | Smoke: render, tabs, returnUrl. No signup/login/logout interaction tests | Missing: intent-based signup role validation, login redirect by role, password reset, logout |
| 2. Route Guards (ROUTE-001–005) | Good coverage in guards.smoke.test.tsx + access.test.ts | Missing: role:client blocked from /dashboard/pro (only tests generic auth + admin) |
| 3. Onboarding (ONB-001–006) | Smoke + interaction tests exist | Missing: step validation blocking, deep-link redirect, save/persist on refresh |
| 4. Job Posting (JOB-001–004) | Smoke: render only | Missing: guest auth checkpoint, form validation, submission |
| 5. Job Management (JOBM-001–003) | None | Fully missing |
| 6. Quotes (QUOTE-001–004) | None | Fully missing |
| 7. Messaging (MSG-001–004) | Smoke: render + empty states | Missing: send message, permissions, mark-as-read |
| 8. Listings (LIST-001–004) | None | Fully missing |
| 9. Admin (ADMIN-001–003) | None | Fully missing |
| 10. Settings (SET-001–002) | None | Fully missing |
| 11. Mobile (MOB-001–003) | None | Fully missing |
| 12. Security (SEC-001–004) | Partially covered by access.test.ts | Missing: RPC integrity tests |

## Implementation Approach

### Layer Strategy

Tests split into two layers matching your existing structure:

1. **Smoke tests** (`src/test/smoke/`) — Does the page render? Does it handle empty/error/loading states?
2. **Interaction tests** (`src/test/interaction/`) — Does the user flow work? Does clicking/submitting produce the right outcome?

All tests use the **existing mock patterns** (SessionContext, Supabase client, i18n) already established in your codebase.

### New Test Files

**Smoke tests** (new files):
- `src/test/smoke/settings.smoke.test.tsx` — SET-001, SET-002
- `src/test/smoke/admin.smoke.test.tsx` — ADMIN-001, ADMIN-002, ADMIN-003
- `src/test/smoke/listings.smoke.test.tsx` — LIST-001, LIST-002, LIST-003, LIST-004
- `src/test/smoke/job-management.smoke.test.tsx` — JOBM-001, JOBM-002, JOBM-003
- `src/test/smoke/quotes.smoke.test.tsx` — QUOTE-001, QUOTE-002

**Interaction tests** (new files):
- `src/test/interaction/auth-signup.interaction.test.tsx` — AUTH-002, AUTH-003, AUTH-004, AUTH-005
- `src/test/interaction/auth-login.interaction.test.tsx` — AUTH-006, AUTH-007, AUTH-008, AUTH-009, AUTH-010
- `src/test/interaction/messaging.interaction.test.tsx` — MSG-002, MSG-003, MSG-004
- `src/test/interaction/quote-accept.interaction.test.tsx` — QUOTE-002, QUOTE-003, QUOTE-004

**Enhanced existing files**:
- `src/test/smoke/guards.smoke.test.tsx` — add ROUTE-003 (client blocked from pro dashboard)
- `src/test/smoke/post.smoke.test.tsx` — add JOB-002 (guest auth checkpoint), JOB-004 (validation)
- `src/test/access.test.ts` — add SEC-002 cross-role checks

**Unit tests** (new):
- `src/test/security/rpc-integrity.test.ts` — SEC-003 (quote assignment uses server-side values)

### What Will NOT Be Automated

These require manual QA or browser-level E2E (Playwright/Cypress), not Vitest:
- **MOB-001–003**: Mobile viewport tests need real rendering. Will add a note in the test files pointing to manual QA checklist.
- **SEC-001**: RLS enforcement requires real database queries — covered by Supabase linter + manual testing.
- **AUTH-008/009**: Password reset email delivery — infrastructure test, not unit test.

### File Count

- **10 new test files**
- **3 enhanced existing test files**
- ~**65 new test cases** covering all automatable items from your 12 sections

### Execution

All tests run via existing `vitest` config and CI pipeline. No config changes needed.

