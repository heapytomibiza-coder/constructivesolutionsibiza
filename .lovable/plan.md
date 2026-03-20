

# Dispute Engine — Four Feature Expansion (Complete)

## ✅ 1. Resolution Acceptance Flow
- `rpc_offer_resolution` — admin offers resolution from assessment status, logs to `admin_actions_log`
- `rpc_respond_to_resolution` — party accepts (→ resolved) or rejects with reason (→ escalated)
- `ResolutionBanner` component in DisputeDetail for parties to accept/reject
- "Offer Resolution" action in admin DisputeRowActions with type selector + description
- Email notification trigger on `resolution_offered` status change

## ✅ 2. Visual Dispute Timeline
- `DisputeTimeline` component merges status history, inputs, evidence, and AI events
- Color-coded vertical timeline with event-type icons and source badges
- Replaces plain text timeline in DisputeDetail
- `fetchDisputeDetail` now includes `dispute_ai_events`

## ✅ 3. Admin Bulk Actions
- Checkbox column in DisputeQueue for multi-select
- Floating action bar: "Close Stale" and "Batch Escalate"
- Confirmation dialogs before execution
- Calls `rpc_advance_dispute_status` per dispute via Promise.allSettled

## ✅ 4. Dispute Analytics
- `rpc_admin_dispute_analytics` — returns volume by status, weekly trends, resolution times, escalation rate, top issues, repeat offenders
- `DisputeAnalytics` collapsible dashboard above DisputeQueue
- Summary cards, issue breakdown bars, repeat parties table

## Deferred (pre-wider-release)
- Storage evidence SELECT policy scoping
- Duplicate RLS policy cleanup on `dispute_inputs` / `dispute_evidence`
