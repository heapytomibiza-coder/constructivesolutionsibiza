# ADR-003: DB-Backed Queue Pattern

**Status:** Accepted
**Date:** 2025-Q1
**Decision maker:** Engineering Lead

## Context

The platform needs asynchronous processing for notifications (email, WhatsApp, Telegram). Options considered:

1. **External queue service** (SQS, Redis, BullMQ) — Purpose-built, but adds infrastructure complexity and cost
2. **Direct send from client** — Simple, but blocks UI and has no retry
3. **DB-backed queue** — Use Postgres tables as job queues, processed by edge functions

## Decision

Use database tables (`email_notifications_queue`, `job_notifications_queue`) as lightweight job queues, processed by Supabase edge functions.

## Consequences

### Positive
- **Zero additional infrastructure:** Queue is just another Postgres table with RLS
- **Transactional enqueue:** DB triggers enqueue notifications in the same transaction as the source event (message INSERT, job INSERT). No risk of event loss.
- **Built-in audit trail:** Every notification attempt is recorded with `attempts` count and `last_error`
- **Queryable:** Admin can inspect queue state, dead letters, and delivery rates via standard SQL
- **Retry logic:** Simple `attempts < 3` check. Dead letters preserved for manual inspection.

### Negative
- **No push processing:** Edge functions must be invoked (webhook or scheduled) — no automatic processing on INSERT
- **Throughput ceiling:** Single-threaded edge function, 600ms throttle, 20 items/batch ≈ 2 items/sec
- **No backpressure:** If enqueue rate exceeds processing rate, queue grows unbounded
- **No priority lanes:** All items processed FIFO regardless of urgency

### Mitigations
- Current volume (< 100 users) is well within throughput limits
- Scaling plan documented in `docs/architecture/scaling-roadmap.md` — Tier 2+ addresses throughput
- Dead letter monitoring planned for admin dashboard
- Priority queues can be added via `priority` column when needed

## Related
- `docs/architecture/queue-architecture.md` — Full queue documentation
- `supabase/functions/send-notifications/index.ts` — Queue consumer
- `supabase/functions/send-job-notification/index.ts` — Job notification consumer
