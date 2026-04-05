

# Implementation Brief: Job Lifecycle Hardening Sprint

## Context

The audit identified 6 gaps in the job/quote lifecycle enforcement. This brief provides exact tickets with acceptance criteria, ordered by the refined priority you approved.

---

## Ticket 1 — P1: Resolve `ready` status identity

**Question to answer first**: `ready` is used in frontend code (`canPostJob`, `StageHero`, cancel flows) but is NOT in the DB CHECK constraint (`draft, open, in_progress, completed, cancelled`).

**Decision required before migration**:
- If `ready` is a real DB status → add it to the `valid_status` CHECK constraint
- If `ready` is app-derived (e.g. "draft with all fields complete") → remove it from `canPostJob`/`canCancelJob` and treat it as a UI display concept only

**Recommendation**: Based on current usage, `ready` appears to be a UI-layer publish-eligibility concept. Jobs go `draft → open` when posted. Keep `ready` out of the DB. Clean up `jobActions.ts` references accordingly.

**Acceptance criteria**:
- [ ] Clear documented decision on whether `ready` is DB-native or app-derived
- [ ] If app-derived: no code path attempts to SET `status = 'ready'` in the database
- [ ] `canPostJob` and `canCancelJob` updated to reflect the decision

---

## Ticket 2 — P1: `validate_job_status_transition()` trigger

**What**: BEFORE UPDATE trigger on `jobs` that rejects invalid status transitions.

**Transition map** (assuming `ready` stays out of DB):

```text
draft        → open, cancelled
open         → in_progress, cancelled
in_progress  → completed, cancelled
completed    → (terminal)
cancelled    → (terminal)
```

**Migration SQL** (one SECURITY DEFINER function + trigger):
- Function checks `OLD.status` → `NEW.status` against the map
- Raises exception with descriptive error if invalid
- Allows same-status updates (non-status column changes)
- Does NOT restrict SECURITY DEFINER RPCs — they already set correct transitions

**Acceptance criteria**:
- [ ] `UPDATE jobs SET status = 'completed' WHERE status = 'draft'` fails with clear error
- [ ] `UPDATE jobs SET status = 'completed' WHERE status = 'in_progress'` succeeds
- [ ] Terminal states (`completed`, `cancelled`) reject any further status change
- [ ] Non-status updates (e.g. `UPDATE jobs SET title = 'x'`) still work on any status
- [ ] All existing RPCs (`accept_quote_and_assign`, `complete_job`, `request_job_completion`, etc.) continue to pass

---

## Ticket 3 — P1: `cancel_job(p_job_id)` RPC

**What**: Replace the two direct `.update({ status: 'cancelled' })` calls in `JobTicketDetail.tsx` and `ClientJobCard.tsx` with a SECURITY DEFINER RPC.

**RPC logic**:
1. Verify `auth.uid() = job.user_id`
2. Verify `job.status IN ('draft', 'open')` (pre-assignment only)
3. Set `status = 'cancelled'`, `is_publicly_listed = false`
4. Insert into `job_status_history`
5. Return success

**Frontend change**: Replace both direct update blocks with `supabase.rpc('cancel_job', { p_job_id })`.

**Acceptance criteria**:
- [ ] Client can cancel draft/open jobs via RPC
- [ ] Cancellation appears in `job_status_history`
- [ ] Non-owner gets `not_authorized` error
- [ ] `in_progress` jobs are rejected (must use dispute/cancellation-request flow)
- [ ] `is_publicly_listed` set to `false` atomically

---

## Ticket 4 — P2: `post_job(p_job_id)` RPC

**What**: Formalize the `draft → open` transition with audit trail.

**RPC logic**:
1. Verify `auth.uid() = job.user_id`
2. Verify `job.status = 'draft'`
3. Set `status = 'open'`, `is_publicly_listed = true`
4. Insert into `job_status_history`

**Acceptance criteria**:
- [ ] Posting creates a history entry
- [ ] Only draft jobs can be posted
- [ ] Only the job owner can post

---

## Ticket 5 — P2: Expand `jobActions.ts` eligibility map

**What**: Add missing eligibility functions to cover all actions shown in UI.

**Functions to add**:
- `canRequestCompletion(status, role, isAssignedPro)` — pro on in_progress jobs
- `canConfirmCompletion(status, isClient, hasCompletionRequest)` — client after pro requests
- `canRequestCancellation(status, role, isAssignedPro)` — pro on in_progress jobs
- `canRespondToCancellation(status, isClient, hasCancellationRequest)` — client response

**Acceptance criteria**:
- [ ] Every action button in `JobTicketDetail` uses a `can*` function from `jobActions.ts`
- [ ] No inline status checks remain in JSX for action visibility
- [ ] Functions match the transition rules enforced by RPCs

---

## Ticket 6 — P2: `validate_quote_status_transition()` trigger

**Why P2 not P3**: Quote updates ARE RLS-reachable. Both clients (`Clients can update quote status on own jobs`) and pros (`Pros can update own quotes`) have direct UPDATE access. No CHECK constraint exists on quote status.

**Transition map**:

```text
submitted  → accepted, rejected, revised, withdrawn, superseded, expired
revised    → accepted, rejected, withdrawn, superseded, expired
accepted   → (terminal)
rejected   → (terminal)
withdrawn  → (terminal)
superseded → (terminal)
expired    → (terminal)
```

**Migration**: BEFORE UPDATE trigger on `quotes`, same pattern as Ticket 2.

**Acceptance criteria**:
- [ ] Cannot re-reject an accepted quote
- [ ] Cannot re-accept a withdrawn quote
- [ ] `accept_quote_and_assign` RPC still works (it sets `accepted` from `submitted`)
- [ ] Direct client/pro updates that follow valid transitions still work

---

## Ticket 7 — P3: Remove ghost `assigned` status

**What**: Update `withdraw_from_job` RPC to remove `'assigned'` from the status check. Update `src/domain/models.ts` to remove `'assigned'` from the Job type.

**Current code**: `IF v_job.status NOT IN ('open', 'assigned')` → change to `IF v_job.status != 'open'`

**Acceptance criteria**:
- [ ] No reference to `'assigned'` status exists in codebase or DB functions
- [ ] `withdraw_from_job` still works correctly for `open` jobs

---

## Implementation order

```text
1. Ticket 1 — decide ready status (blocks Ticket 2)
2. Ticket 2 — job transition trigger
3. Ticket 3 — cancel_job RPC + frontend swap
4. Ticket 7 — ghost status cleanup (trivial, do alongside 2/3)
5. Ticket 4 — post_job RPC
6. Ticket 5 — eligibility map expansion
7. Ticket 6 — quote transition trigger
```

## Risk notes

- Ticket 2 (transition trigger) must be tested against ALL existing RPCs before deploy — a mismatched map will break live flows
- Ticket 3 requires touching two frontend files that both have the same direct-update pattern
- Ticket 6 should be verified against `accept_quote_and_assign` which sets quote status internally

