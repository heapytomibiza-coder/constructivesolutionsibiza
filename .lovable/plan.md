

# Dispute Engine Hardening Plan

This plan addresses 10 hardening requirements from the feedback before `escrow-beta` goes live. The work is grouped into three layers: database, backend, and frontend.

---

## Layer 1 — Database Migration

A single migration adding constraints, functions, and schema enrichments.

### 1a. State Machine Enforcement (DB trigger)
Create a `validate_dispute_status_transition()` trigger function that defines an explicit allowed-transitions map and raises an exception on invalid jumps. This runs `BEFORE UPDATE` on `disputes`.

Allowed transitions:
```text
draft         → open
open          → awaiting_counterparty
awaiting_cp   → evidence_collection
evidence_coll → assessment
assessment    → resolution_offered / escalated
resolution_of → awaiting_acceptance / escalated
awaiting_acc  → resolved / escalated
resolved      → closed
escalated     → closed
(any)         → closed  (admin override)
```

### 1b. Evidence Schema Enrichment
Add columns to `dispute_evidence`:
- `submitted_by_role TEXT` (client/professional)
- `evidence_category TEXT` (photo, video, invoice, message, plan, receipt)
- `related_issue_type dispute_issue_type`
- `is_visible_to_counterparty BOOLEAN DEFAULT true`

### 1c. Analysis Idempotency
Add `is_current BOOLEAN DEFAULT true` to `dispute_analysis`. Add a trigger that sets `is_current = false` on all previous rows for the same `dispute_id` when a new row is inserted.

### 1d. Case Completeness Function
Create `rpc_dispute_completeness(p_dispute_id UUID)` as a `SECURITY DEFINER` function returning a JSON object with boolean checks:
- `has_statement`, `has_questionnaire`, `has_evidence`, `has_counterparty_response`, `evidence_count`, `has_scope`
- Plus an overall `level` field: `low`, `medium`, `high`.

### 1e. AI Audit Log Table
Create `dispute_ai_events` table:
- `id`, `dispute_id`, `event_type` (analysis_requested, analysis_completed, analysis_failed, analysis_superseded, manual_override), `metadata JSONB`, `created_at`

---

## Layer 2 — Backend (Edge Function + Domain Logic)

### 2a. Harden `analyze-dispute` Edge Function
- After parsing AI tool output, validate: `confidence_score` in 0..1, `suggested_pathway` in allowed enum, arrays capped at 20 items, `summary_neutral` max 2000 chars, no empty required fields.
- On insert, write to `dispute_ai_events` (analysis_requested before call, analysis_completed/failed after).
- Use the `is_current` flag pattern instead of blind insert.
- Broaden human review triggers: also flag if issue contains `damage`, `abandonment`, `communication_conduct`, or if project budget > `manualReviewThresholdEur` from guardrails.

### 2b. Status Transition RPC
Create `rpc_advance_dispute_status(p_dispute_id UUID, p_new_status TEXT)` as a `SECURITY DEFINER` function that:
- Validates caller is a party or admin
- Checks the transition is allowed per the map
- Updates the dispute
- Returns the updated record

This replaces scattered `.update()` calls from the client.

---

## Layer 3 — Frontend

### 3a. Replace Direct Writes with RPC Calls
- `createDispute.action.ts`: keep the `.insert()` (it's the creation path) but switch status transitions to the new RPC.
- Add a new `advanceDisputeStatus.action.ts` calling the RPC.

### 3b. Case Completeness Display
In `DisputeDetail.tsx`, fetch completeness via `rpc_dispute_completeness` and render a small progress indicator (e.g., "Case Strength: Medium — 3/5 items submitted") before the AI analysis section.

### 3c. AI Analysis Idempotency in UI
- Disable "Generate Analysis" button if an `is_current` analysis already exists.
- Add "Re-analyze" button that creates a new analysis (superseding the old one), with a confirmation prompt.

### 3d. Evidence Metadata in Upload Flow
Update `EvidenceUploader` to collect `evidence_category` (dropdown: photo, video, invoice, etc.) and pass it through `uploadDisputeEvidence.action.ts`.

---

## What This Does NOT Cover (deferred to next phase)

- Counterparty response flow (notifications + response form) — separate task
- Admin dispute queue/dashboard — separate task
- Auto-nudge/deadline automation — separate task
- Pre-dispute "request correction" mode — separate task
- Resolution templates — separate task
- Reputation/behaviour tracking — separate task

---

## Files Changed

| File | Action |
|---|---|
| `supabase/migrations/new_hardening.sql` | Create: state machine trigger, evidence columns, `is_current` flag, completeness RPC, AI events table |
| `supabase/functions/analyze-dispute/index.ts` | Edit: add validation, idempotency, AI event logging, broader human-review rules |
| `src/pages/disputes/actions/advanceDisputeStatus.action.ts` | Create |
| `src/pages/disputes/actions/uploadDisputeEvidence.action.ts` | Edit: add `evidence_category` |
| `src/pages/disputes/actions/analyzeDispute.action.ts` | Minor edit for re-analysis |
| `src/pages/disputes/components/EvidenceUploader.tsx` | Edit: category dropdown |
| `src/pages/disputes/components/CompletenessIndicator.tsx` | Create |
| `src/pages/disputes/DisputeDetail.tsx` | Edit: completeness display, analysis idempotency |
| `src/pages/disputes/types.ts` | Edit: add new types |

