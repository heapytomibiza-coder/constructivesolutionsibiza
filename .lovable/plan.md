

# Dispute Engine — Architecture Hardening (Complete)

Applied fixes from the 6-layer architecture review:

## ✅ Fixes Applied

1. **`rpc_dispute_completeness` auth hardened** — Added party/admin auth check. Non-parties now get an exception instead of completeness data.

2. **`rpc_admin_dispute_inbox` confirmed secure** — Already had `WHERE has_role(auth.uid(), 'admin') AND is_admin_email()` in the query. No change needed.

3. **`createDispute` now sets `awaiting_counterparty` directly** — Skips the redundant `open` status since a counterparty is always identified from the job at creation time.

4. **Deadlines use `ESCROW_GUARDRAILS` constants** — Replaced hardcoded 72h/96h with `autoProgressionHours` and `responseWarningHours` from `escrowGuardrails.ts`.

## Deferred (pre-wider-release)

- Storage evidence SELECT policy scoping (currently any authenticated user can view via UUID path)
- Duplicate RLS policy cleanup on `dispute_inputs` / `dispute_evidence`
