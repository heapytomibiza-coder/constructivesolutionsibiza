

# Developer Execution Plan — Launch Readiness

**Based on:** Launch Specification v1.0 (2026-04-04)

---

## 1. EXECUTIVE SUMMARY

Three critical issues must be fixed before launch: (1) five live UI elements link to `/disputes/raise`, a route gated behind `escrow-beta` — users clicking "Raise Issue" land on a Coming Soon page but get no actionable alternative; these must be rerouted to `/contact?subject=issue&job=X`; (2) nine ghost jobs exist in the database with `status = 'in_progress'` and `assigned_professional_id IS NULL`, causing completion/cancellation RPCs to fail; a migration must revert them and add a CHECK constraint; (3) the "Need to cancel? Raise an issue" link for in_progress clients also routes to the gated dispute page and must use the same contact reroute. Everything else — Euro icon swap, realtime subscription (already wired), session timeout messaging, withdraw condition cleanup — can ship after launch with zero trust risk.

---

## 2. SPRINT GROUPING

### Sprint A — Pre-launch blockers (3 tasks, ~2 hours)
Fix trust-breaking dead links and data integrity issues.

### Sprint B — Post-launch trust and UX (4 tasks, ~4 hours)
Euro consistency, session timeout UX, withdraw cleanup, trust-engine fallback coverage.

### Sprint C — Nice-to-have polish (2 tasks, ~2 hours)
Optional enhancements already partially implemented.

---

## 3–4. PRE-LAUNCH TASKS (Sprint A)

### A1: Reroute all "Raise Issue" links away from gated dispute route

**Why:** 5 live UI elements link to `/disputes/raise` which is gated at `escrow-beta`. Users get a Coming Soon page with no way to actually report a problem. This is the only escalation path for in_progress jobs.

**Routes/pages affected:**
- `/dashboard/jobs/:jobId` (Job Ticket footer — 2 links)
- `/dashboard/client/jobs` (ClientJobCard)
- Messages thread (SupportRequestDialog, RequestSupportButton)
- Job Board modal (JobDetailsModal)

**Files:**
- `src/pages/dashboard/client/JobTicketDetail.tsx` (lines 658, 710)
- `src/pages/dashboard/client/components/ClientJobCard.tsx` (line 295)
- `src/pages/messages/components/SupportRequestDialog.tsx` (line 226)
- `src/pages/messages/components/RequestSupportButton.tsx` (line 42)
- `src/pages/jobs/JobDetailsModal.tsx` (line 508)

**Backend dependencies:** None — link change only.

**Exact fix:** Replace all `to={/disputes/raise?job=${id}}` with `to={/contact?subject=issue&job=${id}}`. Keep the button text, icon, and styling unchanged.

**Acceptance criteria:**
- Zero references to `/disputes/raise` remain in non-admin, non-QA component files
- Clicking "Raise Issue" on any job ticket/card opens `/contact` with job context in URL
- No visual change to button appearance

**Risk:** Low — link swap only
**Effort:** XS

---

### A2: Fix ghost jobs in database

**Why:** 9 jobs have `status = 'in_progress'` with `assigned_professional_id IS NULL`. The CompletionCard and CancellationRequestCard render action buttons that trigger RPCs which fail with `no_professional_assigned`.

**Routes/pages affected:** `/dashboard/jobs/:jobId` for any of these 9 jobs

**Files:** New SQL migration only

**Backend dependencies:** Direct DB write

**Exact fix:** Migration with two statements:
```sql
UPDATE public.jobs
SET status = 'open', updated_at = now()
WHERE status = 'in_progress' AND assigned_professional_id IS NULL;

ALTER TABLE public.jobs
ADD CONSTRAINT chk_in_progress_has_professional
CHECK (status != 'in_progress' OR assigned_professional_id IS NOT NULL);
```

**Acceptance criteria:**
- `SELECT count(*) FROM jobs WHERE status = 'in_progress' AND assigned_professional_id IS NULL` returns 0
- Attempting to set a job to `in_progress` without an `assigned_professional_id` fails at DB level
- Existing valid in_progress jobs are unaffected

**Risk:** Medium — touches live data. Must verify the 9 jobs have no active quotes or conversations that would break.
**Effort:** S

---

### A3: Verify "Need to cancel?" link uses same contact reroute

**Why:** This is a subset of A1 but deserves explicit verification — it's the **only** cancel path for in_progress clients.

**Files:** `src/pages/dashboard/client/JobTicketDetail.tsx` line 710

**Acceptance criteria:** Same as A1 — link target is `/contact?subject=issue&job=${jobId}`, not `/disputes/raise`.

**Risk:** Low
**Effort:** XS (covered by A1)

---

## 5. POST-LAUNCH TASKS (Sprint B)

### B1: Euro icon consistency

**Why:** `DollarSign` icon used alongside `€` currency values — cosmetic inconsistency on a European platform.

**Files:**
- `src/pages/dashboard/client/JobTicketDetail.tsx` (line 25, 780)
- `src/pages/dashboard/client/MatchAndSend.tsx` (line 21, 153)
- `src/pages/dashboard/client/components/ClientJobCard.tsx` (line 6, 257)
- `src/pages/dashboard/client/components/ProQuoteSummary.tsx` (line 16, 112)

**Exact fix:** Replace `DollarSign` import with `Euro` from `lucide-react` in all 4 files. Update JSX references.

**Acceptance criteria:** No `DollarSign` imports remain in client dashboard files. Budget displays show `€` icon.

**Risk:** Low
**Effort:** XS

---

### B2: Session timeout messaging

**Why:** `RouteGuard` shows a generic spinner for up to 15 seconds during auth hydration. Users may abandon.

**Files:** `src/guard/RouteGuard.tsx` (LoadingSpinner component, lines 33-40)

**Exact fix:** After 5 seconds of loading, change spinner text to "Still connecting — please wait…" with a manual "Retry" button that calls `refresh()`.

**Acceptance criteria:** After 5s of loading, user sees explanatory text and retry option instead of bare spinner.

**Risk:** Low
**Effort:** S

---

### B3: Clean up redundant withdraw condition

**Why:** Withdraw button checks `assigned_professional_id === user?.id` on open jobs where no pro is assigned. Condition safely fails (null !== userId) but is logically misleading.

**Files:** `src/pages/dashboard/client/JobTicketDetail.tsx` (line ~661)

**Exact fix:** Remove `&& job.assigned_professional_id === user?.id` from the withdraw button condition. `canWithdrawQuote(status)` already limits to `open` only.

**Acceptance criteria:** Withdraw button appears for pros on open jobs where they have a quote. No change in actual behavior.

**Risk:** Low
**Effort:** XS

---

### B4: Trust-engine page fallback coverage

**Why:** `/for-professionals`, `/pricing`, `/reputation` are gated at `trust-engine` and silently redirect. Not linked from live UI, but URLs are guessable.

**Files:** `src/App.tsx` — the route definitions for these 3 pages

**Exact fix:** Already done — `RolloutGate` now renders `ComingSoonPage`. Verify each route passes `fallbackTitle` and `fallbackMessage` props with relevant copy.

**Acceptance criteria:** Visiting `/pricing` directly shows a Coming Soon card, not a redirect.

**Risk:** Low
**Effort:** XS (verification only — may already be complete)

---

## Sprint C — Nice-to-have polish

### C1: Realtime subscription verification

**Status:** Already implemented (`useJobTicketRealtime.ts` hook, wired in `JobTicketDetail.tsx`, DB migration adds tables to `supabase_realtime` publication).

**Remaining work:** Manual verification that quote/status/completion changes propagate without page refresh.

**Effort:** XS (test only)

---

### C2: Pro dashboard empty state verification

**Status:** Already implemented (calm "You're all set" card with profile/services/priorities links).

**Remaining work:** Visual verification on a test pro account with zero jobs.

**Effort:** XS (test only)

---

## 6. QA PLAN

| Task | Happy Path Test | Edge Case Test | Regression Risk | Proof of Fix |
|------|----------------|---------------|-----------------|-------------|
| **A1** Reroute Raise Issue | Click "Raise Issue" on in_progress job → lands on `/contact?subject=issue&job=X` | Click from ClientJobCard, SupportRequestDialog, RequestSupportButton, JobDetailsModal — all 5 locations | Zero — link target change only | `grep -r "disputes/raise" src/pages src/components` returns 0 non-admin results |
| **A2** Ghost jobs | Load a previously-ghost job ticket → shows "open" status, quote actions visible | Try `INSERT INTO jobs (status, assigned_professional_id) VALUES ('in_progress', NULL)` → DB rejects | Low — only affects 9 orphaned rows | Query returns 0 ghost jobs; constraint exists |
| **A3** Cancel link | In-progress client clicks "Need to cancel?" → `/contact` page | Same job, pro view → link not visible | None | Visual + URL check |
| **B1** Euro icon | Budget section shows `€` icon next to euro values | Jobs with no budget → icon section hidden | None | Visual check on 3+ job tickets |
| **B2** Session timeout | Throttle network, wait 5s → see "Still connecting" + Retry button | Click Retry → session recovers | Low — spinner is non-critical | Visual check |
| **B3** Withdraw cleanup | Pro on open job with quote → sees Withdraw button | Pro on open job without quote → no Withdraw | None — behavior unchanged | Code review |
| **B4** Trust-engine fallback | Visit `/pricing` directly → Coming Soon card | Visit `/reputation` → Coming Soon card | None | Visual check |

---

## 7. RELEASE CHECKLIST

| # | Blocker | Task | Fixed? | Verified? | Auto Test? | Ready? |
|---|---------|------|--------|-----------|------------|--------|
| 1 | YES | A1 — Reroute Raise Issue links | ☐ | ☐ | ☐ grep check | ☐ |
| 2 | YES | A2 — Fix ghost jobs + add constraint | ☐ | ☐ | ☐ DB query | ☐ |
| 3 | YES | A3 — Verify cancel link reroute | ☐ | ☐ | ☐ | ☐ |
| 4 | no | B1 — Euro icon | ☐ | ☐ | ☐ | ☐ |
| 5 | no | B2 — Session timeout UX | ☐ | ☐ | ☐ | ☐ |
| 6 | no | B3 — Withdraw cleanup | ☐ | ☐ | ☐ | ☐ |
| 7 | no | B4 — Trust-engine fallbacks | ☐ | ☐ | ☐ | ☐ |

---

## 8. FINAL OUTPUT TABLE

| Task | Sprint | Owner | Severity | Effort | Status | Dependency |
|------|--------|-------|----------|--------|--------|------------|
| A1 — Reroute all Raise Issue links to /contact | A | frontend | Critical | XS | todo | none |
| A2 — Fix 9 ghost jobs + add CHECK constraint | A | backend | Critical | S | todo | none |
| A3 — Verify cancel link uses contact reroute | A | frontend | High | XS | todo | A1 |
| B1 — Replace DollarSign with Euro icon | B | frontend | Low | XS | todo | none |
| B2 — Session timeout "Still connecting" UX | B | frontend | Low | S | todo | none |
| B3 — Clean up redundant withdraw condition | B | frontend | Low | XS | todo | none |
| B4 — Verify trust-engine page fallbacks | B | frontend | Medium | XS | todo | none |
| C1 — Verify realtime subscription works | C | QA | Medium | XS | done (code) | manual test |
| C2 — Verify pro empty state renders | C | QA | Medium | XS | done (code) | manual test |

