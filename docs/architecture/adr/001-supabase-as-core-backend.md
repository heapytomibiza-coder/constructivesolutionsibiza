# ADR-001: Supabase as Core Backend

**Status:** Accepted
**Date:** 2025-01 (project inception)
**Decision maker:** Founder / Engineering Lead

## Context

The platform needed a backend that provides authentication, database, realtime, storage, and edge functions without requiring dedicated backend engineers. Options considered:

1. **Custom Node.js/Express backend** — Full control, high maintenance burden
2. **Firebase** — Good realtime, but weaker relational data model
3. **Supabase** — Postgres-based, RLS, realtime, edge functions, auth in one platform

## Decision

Use Supabase (via Lovable Cloud) as the single backend platform.

## Consequences

### Positive
- **Postgres + RLS** provides enterprise-grade security without custom middleware
- **Edge Functions** (Deno) handle all server-side logic: notifications, translations, seeding
- **Realtime** channels enable live messaging without additional infrastructure
- **Auth** with email + social providers out of the box
- **Rapid iteration** — schema changes via migrations, no deployment pipeline for DB changes

### Negative
- **Vendor lock-in** — Postgres is portable, but edge functions and auth are Supabase-specific
- **Edge function limitations** — No persistent connections, cold starts, execution time limits
- **RLS complexity** — Recursive policy issues require careful function design (e.g., `has_role()` as SECURITY DEFINER)
- **No direct dashboard access** — Lovable Cloud abstracts the Supabase dashboard

### Mitigations
- All business logic is in standard TypeScript — portable if backend changes
- DB schema is version-controlled via migrations — can replay on any Postgres
- Edge functions use standard Deno APIs where possible
- `has_role()` function pattern avoids RLS recursion (documented in security audit)

## Related
- `docs/BACKEND_AUDIT.md` — Security audit of RLS policies
- `src/integrations/supabase/client.ts` — Auto-generated client
- `docs/architecture/system-overview.md` — Full component map
