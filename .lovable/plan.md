

# Quote Acceptance Flow — Full Analysis and Behavioral Test Plan

## Current Architecture

The quote acceptance flow has three entry points, all calling the same `acceptQuote()` action:

1. **QuoteCard** (job ticket detail) — role="client" gate on the Accept button
2. **QuoteComparison** (dashboard page) — no explicit ownership check before calling accept
3. **AssignProSelector** (admin/dashboard widget) — dropdown + assign button

All three call `acceptQuote(quoteId, jobId, professionalId)` which calls the `accept_quote_and_assign` RPC. The RPC is `SECURITY DEFINER` and performs:

- Row-level lock on job (`FOR UPDATE`)
- Ownership check: `v_job.user_id != auth.uid()` → `not_authorized`
- Already-assigned check: `assigned_professional_id IS NOT NULL` → `job_already_assigned`
- Status check: must be `open` or `posted` → `job_not_assignable`
- Quote existence + job match check → `quote_not_found`
- Quote status check: must be `submitted` or `revised` → `quote_not_acceptable`
- Derives `professional_id` from the quote record (not from client input)
- Atomically: accepts quote, rejects others, assigns pro, moves job to `in_progress`

## What the Existing Tests Actually Prove

### Current tests (7 total across 2 files):

| Test | What it proves | Verdict |
|---|---|---|
| RPC params don't include professionalId | Payload tamper protection | **Real** |
| Only 2 keys sent to RPC | No extra field injection | **Real** |
| Success returns `{ success: true }` | Happy path action result | **Shallow** — only checks return value, not what happens next |
| `job_already_assigned` error mapped | Error string mapping | **Real but narrow** |
| Unauthenticated blocked | Auth gate | **Real** |
| `not_authorized` error mapped | Error string mapping | **Real but narrow** |
| `quote_not_acceptable` error mapped | Error string mapping | **Real but narrow** |

### What these tests do NOT prove:

1. **UI does not show Accept button to non-owners** — QuoteCard gates on `role="client"` prop, but nothing verifies the prop is set correctly based on actual job ownership
2. **Double-click prevention** — `handleAccept` sets `acting=true` but no test proves a second click is blocked
3. **UI state after acceptance** — no test verifies query invalidation happens, status badge updates, or navigation occurs
4. **QuoteComparison page ownership** — the page fetches job data but never checks `job.user_id === currentUser.id` before rendering accept buttons
5. **AssignProSelector** — zero tests
6. **Modal confirmation flow** — AcceptConfirmationModal is untested; no proof the confirm button calls the right action
7. **Job status not checked in UI before showing accept** — QuoteCard shows accept for any `isActive` quote regardless of job status (the RPC catches it, but the user gets a confusing error instead of a hidden button)
8. **Network failure** — no test for what happens when RPC throws a non-specific error
9. **Quote belonging to wrong job** — RPC handles it, but the mismatch case `v_quote.job_id != p_job_id` is not tested at action level
10. **Concurrent acceptance race** — two clients accepting simultaneously (only testable E2E)

## Failure Modes Identified

| # | Failure | Layer | Current Protection | Test Coverage |
|---|---|---|---|---|
| 1 | Wrong user accepts quote | DB | RPC ownership check | Error mapping tested, UI gating NOT tested |
| 2 | Duplicate acceptance (double click) | UI + DB | `acting` state + RPC status check | Neither tested |
| 3 | Job already assigned | DB | RPC check | Error mapping tested |
| 4 | Manipulated professionalId | Action | professionalId not sent to RPC | Tested |
| 5 | Network failure mid-action | UI | Generic error fallback | NOT tested |
| 6 | Quote on wrong job | DB | RPC cross-check | NOT tested at action level |
| 7 | Accepting withdrawn/rejected quote | DB | RPC status check | Tested (quote_not_acceptable) |
| 8 | Job in wrong status (completed/cancelled) | DB | RPC status check | NOT tested |
| 9 | Accept button visible to pro role | UI | `role="client"` prop | NOT tested |
| 10 | Concurrent acceptance (two tabs) | DB | `FOR UPDATE` lock | Requires E2E |

## Plan: New Behavioral Tests

### File: `src/test/interaction/quote-accept.interaction.test.tsx` — REPLACE entirely

The existing file has 5 tests that are partially duplicated with `rpc-integrity.test.ts`. Replace with a comprehensive behavioral suite:

**Happy path (2 tests):**
- Accept returns success AND `trackEvent` is called with correct quote/pro IDs
- Accept with generic RPC success — verify RPC called exactly once (no duplicate calls)

**Error states — every RPC error code (6 tests):**
- `job_not_found` → user-friendly "Job not found"
- `not_authorized` → "Not authorized"
- `job_already_assigned` → "already has an assigned professional"
- `job_not_assignable` → "must be open to accept"
- `quote_not_found` → "Quote not found"
- `quote_not_acceptable` → "not in an acceptable status"

**Permission enforcement (2 tests):**
- Unauthenticated user → blocked before RPC, returns "Not authenticated"
- RPC not called when auth fails (verify `mockRpc` not called)

**Data integrity (2 tests):**
- professionalId param is NOT sent to RPC (kept from existing)
- Only exactly 2 keys sent to RPC (kept from existing)

**Edge cases (3 tests):**
- Generic/unknown RPC error → returns "Failed to accept quote" (not raw error)
- RPC returns `null` error (success case handles cleanly)
- Network exception (RPC throws instead of returning error object) — verify graceful handling

**Total: 15 behavioral tests replacing 5 shallow ones + 2 from rpc-integrity**

### File: `src/test/security/rpc-integrity.test.ts` — KEEP but add

Add 1 test:
- Calling `acceptQuote` with mismatched jobId/quoteId still only sends those exact values to RPC (proves client can't influence which professional gets assigned even with wrong IDs)

### NOT automatable in Vitest (label explicitly):

- **Requires E2E (Playwright):** Concurrent acceptance from two browser tabs — verify only one succeeds and the other gets `job_already_assigned`
- **Requires E2E (Playwright):** Double-click on Accept button — verify only one RPC call fires
- **Requires E2E (Playwright):** QuoteComparison page accessed by non-owner — verify accept button behavior
- **Requires E2E (Playwright):** After acceptance, job status badge updates to "In Progress" without manual refresh
- **Manual QA required:** AcceptConfirmationModal on mobile (375px) — confirm button reachable, modal scrollable, not covered by keyboard

### Code issue found during analysis (fix in same PR):

**`QuoteComparison.tsx` line 52-64** — fetches job but never checks ownership. The accept button is shown to anyone who navigates to `/dashboard/jobs/:jobId/quotes`. The RPC will reject them, but the UI should not show the button. This is a UX bug, not a security bug (RPC is the real gate). Recommend adding `job.user_id` to the query and comparing against session user before rendering accept actions.

## Technical Details

- All tests use existing mock patterns (vi.mock for supabase client and trackEvent)
- Dynamic imports (`await import(...)`) used per test to avoid module caching issues with mocks
- No new dependencies required
- Tests run in existing Vitest + CI pipeline

