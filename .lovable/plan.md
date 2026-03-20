

# Admin Dispute Dashboard Enhancement

The current admin queue is a solid list view. The user's feedback requests two improvements:

1. **Tighten counterparty response auth** — the `/respond` route should only allow the actual counterparty, not the complainant
2. **Add admin row actions** — advance status, trigger re-analysis, escalate, add notes — directly from the queue

---

## 1. Tighten Counterparty Response Auth

**File:** `src/pages/disputes/actions/submitCounterpartyResponse.action.ts`

Change the auth check from allowing either party (`counterparty_id OR raised_by`) to strictly requiring `counterparty_id` only. The complainant already has the dispute detail page for their interactions.

**File:** `src/pages/disputes/DisputeResponse.tsx`

Add an early guard: if the current user is not the counterparty, show a "not authorized" message instead of the response form.

---

## 2. Admin Row Actions in DisputeQueue

**File:** `src/pages/admin/sections/disputes/DisputeQueue.tsx`

Replace the single "open in new tab" button with a dropdown menu containing:

- **View Case** — opens `/disputes/:id` in new tab (existing)
- **Advance Status** — sub-menu showing the next valid status(es) based on current state, calls `advanceDisputeStatus` RPC
- **Trigger Re-analysis** — calls `analyzeDispute` action
- **Escalate** — shortcut to advance to `escalated`
- **Add Admin Note** — dialog with textarea, inserts into `dispute_inputs` as `admin_note` type

The valid-next-status map mirrors the DB trigger:
```text
draft → open
open → awaiting_counterparty
awaiting_counterparty → evidence_collection
evidence_collection → assessment
assessment → resolution_offered, escalated
resolution_offered → awaiting_acceptance, escalated
awaiting_acceptance → resolved, escalated
resolved → closed
escalated → closed
```

**New file:** `src/pages/admin/sections/disputes/DisputeRowActions.tsx`

Extracted component with `DropdownMenu` containing the actions above. Uses existing `advanceDisputeStatus` and `analyzeDispute` actions. Admin note insertion uses a simple dialog + direct insert to `dispute_inputs`.

**File:** `src/pages/admin/sections/disputes/DisputeQueue.tsx`

- Add `overdue` filter (response_deadline passed, no counterparty response)
- Add `high_value` filter (budget > guardrail threshold)
- Replace the Actions column `<Button>` with `<DisputeRowActions>`
- Add `completeness_level` to the RPC and display it

---

## 3. Database: Add completeness to inbox RPC

**Migration:** Update `rpc_admin_dispute_inbox` to also return a `completeness_level` field by calling the existing `rpc_dispute_completeness` function inline, or replicating its logic as a subquery.

---

## Files Changed

| File | Action |
|---|---|
| `src/pages/disputes/actions/submitCounterpartyResponse.action.ts` | Edit: restrict to counterparty only |
| `src/pages/disputes/DisputeResponse.tsx` | Edit: add counterparty-only guard |
| `src/pages/admin/sections/disputes/DisputeRowActions.tsx` | Create: dropdown with advance/escalate/re-analyze/note |
| `src/pages/admin/sections/disputes/DisputeQueue.tsx` | Edit: add filters, use row actions, show completeness |
| `src/pages/admin/sections/disputes/index.ts` | Edit: export new component |
| `src/pages/admin/queries/adminDisputes.query.ts` | Edit: add completeness_level to type |
| Migration SQL | Update `rpc_admin_dispute_inbox` to include completeness_level |

