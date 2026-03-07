# Scaling Roadmap

**Last updated:** 2026-03-07
**Owner:** Engineering Lead

## Purpose

Identify what breaks at each growth tier and plan mitigations before they're needed.

## Scope

Covers database, edge functions, realtime, frontend caching, and external service limits from current state through 10K+ users.

## Current State

Early-stage platform. Single Supabase instance. All services running within free/starter tier limits.

## Tier Analysis

### Tier 1: 1–100 Users (Current)

**Status:** ✅ Everything works fine.

| Component | Current Behavior | Risk |
|-----------|-----------------|------|
| Database | Single Postgres instance, RLS on all tables | None |
| Edge functions | Cold starts ~1-2s, low invocation count | None |
| Realtime | Few concurrent WebSocket connections | None |
| Email | Gmail SMTP, <50 emails/day | None |
| Frontend | React Query with default staleTime | None |

**Action:** Focus on feature completeness, not optimization.

### Tier 2: 100–1,000 Users

**Status:** ⚠️ Monitor these areas.

| Component | What Breaks | Mitigation |
|-----------|-------------|------------|
| Email throughput | Gmail 500/day limit approached | Migrate to verified Resend domain or dedicated SMTP |
| Notification queue | 20/batch × 600ms = ~2 emails/sec | Increase batch size, reduce throttle if SMTP allows |
| `service_search_index` view | Query time increases with data volume | Add materialized view or indexed columns |
| Edge function cold starts | Noticeable latency on first job notification | Keep-alive ping or move to always-on functions |
| Realtime connections | Concurrent users in messaging | Monitor connection count vs plan limit |

**Key database indexes to add:**
```sql
-- Jobs query performance
CREATE INDEX idx_jobs_status_created ON jobs(status, created_at DESC);
CREATE INDEX idx_jobs_micro_slug ON jobs(micro_slug) WHERE status = 'open';

-- Message query performance
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Professional matching
CREATE INDEX idx_pro_services_micro_status ON professional_services(micro_id, status) WHERE status = 'active';
```

### Tier 3: 1,000–10,000 Users

**Status:** 🔴 Architecture changes needed.

| Component | What Breaks | Mitigation |
|-----------|-------------|------------|
| `matched_jobs_for_professional` view | Complex JOIN across 3+ tables on every load | Materialize to table, refresh on job INSERT trigger |
| Notification queue throughput | Hundreds of notifications per job post | Fan-out: separate queue worker per channel (email, push, in-app) |
| Database connections | Connection pool exhaustion | Enable Supabase connection pooling (PgBouncer) |
| Search performance | `service_search_index` scan time | Full-text search index or external search service |
| Storage | Professional document uploads grow | Configure storage lifecycle policies |
| Frontend bundle | Lazy loading needed for all dashboard routes | Route-level code splitting (already partially done) |

**Architecture changes:**
1. **Connection pooling:** Enable PgBouncer in Supabase settings
2. **Background job processing:** Move from simple queue polling to scheduled cron-style processing
3. **Caching layer:** Implement server-side caching for taxonomy data (rarely changes)
4. **Read replicas:** Consider read replica for heavy read operations (job board, search)

### Tier 4: 10,000+ Users

**Status:** 🔴 Significant re-architecture needed.

| Component | What Breaks | Mitigation |
|-----------|-------------|------------|
| Single database | Write contention on `jobs`, `messages` | Horizontal partitioning or separate service DBs |
| Edge function concurrency | Concurrent invocations exceed plan limit | Dedicated infrastructure or move to containerized workers |
| Realtime fan-out | Thousands of concurrent WebSocket connections | Selective subscriptions, reduce broadcast scope |
| Email delivery | Need dedicated IP, reputation management | Move to dedicated email service (SendGrid, Postmark) |
| Admin dashboard | `admin_users_list` view scans all users | Paginated materialized views with filters |

## Supabase-Specific Limits

| Resource | Free Tier | Pro Tier | Impact |
|----------|-----------|----------|--------|
| Database size | 500 MB | 8 GB | Monitor `jobs`, `messages`, `analytics_events` growth |
| Edge function invocations | 500K/month | 2M/month | Job notifications + queue processing |
| Realtime connections | 200 concurrent | 500 concurrent | Active messaging users |
| Storage | 1 GB | 100 GB | Professional documents + photos |
| Bandwidth | 2 GB/month | 250 GB/month | API + realtime traffic |

## React Query Caching Strategy

Current approach:
- **Taxonomy data** (categories, subcategories, micros): `staleTime: 5 * 60 * 1000` (5 min) — rarely changes
- **Job lists:** Default staleTime — needs fresh data
- **User profile:** Loaded once in `useSessionSnapshot`, refreshed on auth events
- **Question packs:** `staleTime: 5 * 60 * 1000` with 3 retries

**Planned improvements:**
- Increase staleTime for taxonomy data to 30 minutes (data changes weekly at most)
- Implement `select` transforms to reduce re-renders on unchanged data
- Add `placeholderData` for smoother UX during refetches

## Priority Actions by Quarter

### Q1 (Now)
- [ ] Monitor email send volume vs Gmail limit
- [ ] Add database indexes listed above
- [ ] Set up basic monitoring for queue dead letters

### Q2
- [ ] Migrate to verified email domain
- [ ] Implement materialized `service_search_index`
- [ ] Enable connection pooling

### Q3
- [ ] Evaluate push notification service
- [ ] Implement caching for static taxonomy data
- [ ] Load testing: simulate 500 concurrent users

### Q4+
- [ ] Read replica evaluation
- [ ] Full-text search service evaluation
- [ ] Horizontal scaling assessment

## Related Files

- `docs/architecture/queue-architecture.md` — Queue throughput details
- `docs/architecture/system-overview.md` — Component overview
- `src/domain/rollout.ts` — Feature release phases
- `docs/ARCHITECTURE_PACK.md` — Section 8: "Not Built Yet"
