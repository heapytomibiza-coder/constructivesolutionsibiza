

# Dispute Engine Architecture Review — 6 Layers

This is a read-only architecture audit, not an implementation plan. Here is the full system mapped across the 6 layers requested.

<lov-artifact path="dispute_architecture.mmd" mime_type="text/vnd.mermaid"></lov-artifact>

---

## Layer 1: System Map

### Tables
- `disputes` — core case record (status, parties, deadlines, AI outputs)
- `dispute_inputs` — voice/text/questionnaire from both parties + admin notes
- `dispute_evidence` — uploaded files with category and visibility metadata
- `dispute_analysis` — versioned AI analysis with `is_current` flag
- `dispute_status_history` — full audit trail of every transition
- `dispute_ai_events` — lifecycle log of all AI interactions (requested/completed/failed)
- `email_notifications_queue` — delivery queue for all dispute emails

### Edge Functions
- `analyze-dispute` — AI case structuring via Lovable AI (Gemini Flash)
- `dispute-deadline-automation` — cron every 15 min for nudges + auto-progression
- `send-notifications` — email delivery (handles dispute_opened, deadline_approaching, auto_advanced, etc.)

### Actions (client-side)
- `createDispute` — inserts dispute + inputs, sets deadlines
- `submitCounterpartyResponse` — restricted to counterparty only
- `uploadDisputeEvidence` — storage upload + metadata record
- `analyzeDispute` — triggers edge function
- `advanceDisputeStatus` — calls RPC

### Pages
- `RaiseDispute` — 6-step wizard (cooling off, issues, questionnaire, describe, evidence, review)
- `DisputeDetail` — full case view with analysis, evidence, timeline, counterparty banner
- `DisputeResponse` — 4-step counterparty response form (review, respond, evidence, confirm)
- `DisputeQueue` (admin) — filterable table with row actions

---

## Layer 2: Status/State Model

### Dispute State Machine (DB-enforced via trigger)
```text
draft -> open
open -> awaiting_counterparty
awaiting_counterparty -> evidence_collection
evidence_collection -> assessment
assessment -> resolution_offered | escalated
resolution_offered -> awaiting_acceptance | escalated
awaiting_acceptance -> resolved | escalated
resolved -> closed
escalated -> closed
Any status -> closed (admin override)
```

Enforced by: `validate_dispute_status_transition` trigger (BEFORE UPDATE).
Logged by: `log_dispute_status_change` trigger (AFTER INSERT/UPDATE) into `dispute_status_history`.
Transition source tracked: `change_source` field = `app`, `automation`, or `rpc`.

### AI Analysis Versioning
- `is_current` flag on `dispute_analysis`
- `deactivate_previous_analyses` trigger auto-sets old analyses to `is_current = false` on new insert

---

## Layer 3: User Flows

### Complainant
1. Navigates to `/disputes/raise?job=<id>`
2. Cooling-off notice -> select issue types -> questionnaire -> describe -> upload evidence -> review
3. `createDispute` inserts dispute (status: `open`), inputs, evidence
4. DB trigger enqueues email to counterparty + admin
5. Views case at `/disputes/:id` — sees analysis, completeness, timeline
6. Can trigger re-analysis

### Counterparty
1. Receives email with link to `/disputes/:id`
2. Sees `CounterpartyBanner` with deadline countdown and CTA
3. Navigates to `/disputes/:id/respond`
4. 4-step form: review complaint -> answer questionnaire + text -> upload evidence -> confirm
5. `submitCounterpartyResponse` inserts inputs, updates `counterparty_responded_at`
6. DB trigger notifies complainant

### Admin
1. Admin dashboard -> Disputes tab -> `DisputeQueue`
2. Filters: Active, Needs Review, Overdue, High Value, Escalated, Resolved, All
3. Row actions via dropdown: View Case, Advance Status (sub-menu), Trigger Re-analysis, Escalate, Add Admin Note
4. All actions use existing RPCs/actions

### AI Analysis
1. Triggered by user (button) or admin (row action)
2. `analyze-dispute` edge function:
   - Verifies auth (party or admin)
   - Logs `analysis_requested` event
   - Fetches dispute + inputs + evidence + job context
   - Calls Gemini Flash via structured tool call
   - Validates output (enum checks, range caps, array limits)
   - Forces `human_review_required = true` (beta) + high-risk/high-value/low-confidence rules
   - Stores in `dispute_analysis` with `is_current = true`
   - Updates dispute summary fields
   - Logs `analysis_completed` or `analysis_failed`
3. Handles: 429 rate limit, 402 credits exhausted, invalid response

### No-Response / Deadline Automation
1. `dispute-deadline-automation` runs every 15 min
2. 24h before deadline: nudge email to counterparty
3. Deadline passed: warning to counterparty, update to raiser, alert to admin
4. 24h grace period expires: auto-advance (`awaiting_counterparty` -> `evidence_collection`, or `evidence_collection` -> `assessment`)
5. All events logged in `dispute_ai_events` for idempotency

---

## Layer 4: Permission Model

### RLS Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| disputes | Parties + admin | raised_by only | Parties + admin | None |
| dispute_inputs | Parties + admin | user_id = auth.uid() AND is party | None | None |
| dispute_evidence | Parties + admin | user_id = auth.uid() AND is party | None | None |
| dispute_analysis | Parties + admin | None (service role only) | None | None |
| dispute_status_history | Parties + admin | None (trigger only) | None | None |
| dispute_ai_events | Parties + admin | None (service role only) | None | None |

### Storage (dispute-evidence bucket)
- Upload: authenticated, folder must match `auth.uid()`
- View: any authenticated user (broad — see findings below)

### RPC Auth
- `rpc_advance_dispute_status`: SECURITY DEFINER, checks party or admin
- `rpc_dispute_completeness`: SECURITY DEFINER, no auth check (read-only, no sensitive data)
- `rpc_admin_dispute_inbox`: SECURITY DEFINER, no auth check (relies on admin dashboard route guard)

### Edge Function Auth
- `analyze-dispute`: verifies JWT, checks user is party or admin via `has_role`
- `dispute-deadline-automation`: service role only (cron), no user auth

### Client-Side Guards
- `DisputeResponse`: blocks non-counterparty users with auth check
- `submitCounterpartyResponse`: verifies `counterparty_id` match

---

## Layer 5: Data Structure

### disputes
```text
id, job_id, milestone_label, raised_by, raised_by_role,
issue_types[], secondary_tags[], status (enum),
summary_neutral, requested_outcome,
ai_confidence_score, recommended_pathway (enum), human_review_required,
counterparty_id, counterparty_responded_at,
resolution_type, resolution_description, resolution_accepted_at,
evidence_deadline, response_deadline,
created_at, updated_at, resolved_at, closed_at
```

### dispute_inputs
```text
id, dispute_id, user_id, input_type ('text'|'voice'|'multiple_choice'|'admin_note'),
raw_text, transcript, questionnaire_answers (jsonb), voice_file_path, created_at
```

### dispute_evidence
```text
id, dispute_id, user_id, file_path, file_type, file_name, file_size_bytes,
description, submitted_by_role, evidence_category, related_issue_type,
is_visible_to_counterparty, created_at
```

### dispute_analysis
```text
id, dispute_id, issue_types[], agreed_facts (jsonb), disputed_points (jsonb),
missing_evidence (jsonb), summary_neutral, suggested_pathway (enum),
confidence_score, requires_human_review, raw_ai_response (jsonb),
is_current, created_at
```

### dispute_status_history
```text
id, dispute_id, from_status (enum), to_status (enum), changed_by,
change_source ('app'|'automation'), metadata (jsonb), created_at
```

### dispute_ai_events
```text
id, dispute_id, event_type, metadata (jsonb), created_at
```

---

## Layer 6: Findings and Observations

### Structurally Sound
1. State machine is DB-enforced with trigger — cannot be bypassed from client
2. AI is strictly advisory: never executes payments, always flags human review in beta
3. Analysis versioning with `is_current` prevents conflicting active recommendations
4. Deadline automation is idempotent via event tracking
5. Audit trail captures every transition with source attribution
6. Counterparty response is auth-locked to correct party

### Items Worth Noting

**1. Storage evidence visibility is broad**
The SELECT policy on `storage.objects` for `dispute-evidence` allows any authenticated user to view files — not scoped to dispute parties. Low risk during beta (file paths are UUIDs), but should be tightened before wider release.

**2. `rpc_admin_dispute_inbox` has no internal auth check**
It relies on the frontend route guard. A logged-in non-admin could call this RPC directly. Should add `has_role(auth.uid(), 'admin')` check inside the function.

**3. `rpc_dispute_completeness` has no auth check**
Any authenticated user could call it with any dispute_id. The data returned isn't sensitive (boolean flags + counts), but it's a minor information leak.

**4. Duplicate RLS policies on dispute_inputs and dispute_evidence**
The original migration creates "Users can view/add" policies, and the counterparty migration adds "Dispute parties can view/insert" policies. These are additive (permissive), so they work, but it's redundant.

**5. `createDispute` skips `awaiting_counterparty` status**
Creates with `open` status. The transition map requires `open` -> `awaiting_counterparty` before `evidence_collection`. The admin or automation must manually advance. This is intentional but worth confirming — or auto-set to `awaiting_counterparty` on creation.

**6. Deadline auto-advance bypasses the validation trigger**
The automation function uses service role to update status directly. Since it writes valid transitions this works, but the `log_dispute_status_change` trigger won't capture `auth.uid()` (it'll be null for service role calls). The automation compensates by inserting history manually.

**7. No payment coupling yet**
The dispute engine is completely decoupled from any payment/escrow tables. This is correct for current phase — payment hold/release should be a separate, admin-controlled action.

**8. `createDispute` sets deadlines as fixed offsets (72h/96h)**
Hardcoded in the action, not from `escrowGuardrails`. Minor inconsistency — should reference the guardrails constants.

None of these are blockers for beta. Items 2, 3, and 5 are the most worth addressing before wider rollout.

