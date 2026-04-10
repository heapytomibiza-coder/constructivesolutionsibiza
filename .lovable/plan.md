

# Sprint Plan: Security Fixes & Code Quality Stabilisation

## P0 — Security Blockers

### Ticket 1: Enable HIBP Leaked Password Protection
- Use `configure_auth` tool to set `password_hibp_enabled: true`
- One config change, zero code impact

### Ticket 2: Realtime Authorization Hardening
**Current state:** 6 realtime subscriptions found across the codebase. All use Postgres Changes (not Broadcast/Presence), which means RLS on the underlying tables IS enforced by Supabase — subscribers only receive rows they can SELECT via RLS.

**Assessment:** The existing RLS on `messages` and `conversations` already restricts data to `client_id` or `pro_id`. Postgres Changes respects RLS, so unauthorized users receive no payloads even if they subscribe to a channel. However, we should still add application-level guards as defense-in-depth:

- `useMessages.ts` — add early return if user is not a participant of the conversation (already scoped by `conversationId` from an authorized query, but add explicit check)
- `useConversations.ts` — already scoped to `userId` filter, safe
- `useJobTicketRealtime.ts` — already scoped to `jobId` from authorized context
- `useJobAlerts.ts` — scoped to `userId`
- `useMessageNotifications.ts` — scoped to `userId`
- `useLatestJobs.ts` — admin-only page, already behind admin route guard

**Changes:** Add a pre-subscription authorization check in `useMessages.ts` to verify the current user is a conversation participant before subscribing. Document the RLS-enforced safety in a code comment on each subscription.

---

## P1 — Quick Wins

### Ticket 3: Remove Dead Deprecated Files
Delete 4 files:
- `src/pages/jobs/actions/assignProfessional.action.ts`
- `src/pages/jobs/actions/reviseQuote.action.ts`
- `src/hooks/useMatchedJobs.ts`
- `src/components/wizard/index.ts`

Also remove the `reviseQuote` re-export from `src/pages/jobs/actions/index.ts` (line 12).

---

## P2 — Type Safety

### Ticket 4: Regenerate Supabase Types
- Supabase types are auto-generated and cannot be manually edited. They will be regenerated automatically when the schema is next synced. No manual action needed — the types file updates on its own.

### Ticket 5: Reduce `as any` in Critical Paths
Focus on the dispute domain first (134 occurrences across 10 files). Since the types file auto-regenerates but currently lacks dispute tables, the pragmatic fix is:
- Create `src/types/disputes.ts` and `src/types/quotes.ts` with manual interfaces matching the DB schema
- Replace `as any` casts in dispute queries/actions with typed generics: `supabase.from('disputes').select(...)` using `.returns<DisputeRow[]>()` pattern
- Replace `const d = dispute as any` patterns with properly typed variables

---

## P3 — Architecture Cleanup

### Ticket 6: Extract Dispute Component Supabase Calls
Move inline supabase calls from 2 components into dedicated files:

- `CompletenessIndicator.tsx` → new `src/pages/disputes/queries/completeness.query.ts`
- `ResolutionBanner.tsx` → new `src/pages/disputes/actions/respondToResolution.action.ts`

Components will import clean functions instead of calling supabase directly.

### Ticket 7: Extract Admin Supabase Calls
The admin domain has 38 files with supabase calls. Most are already properly organized in `admin/queries/`, `admin/actions/`, and `admin/hooks/`. The specific violators called out:
- `AdminPricingRulesPage.tsx` — extract to `admin/queries/pricingRules.query.ts` and `admin/actions/pricingRules.action.ts`
- `MessagingPulsePage.tsx` — extract nudge mutation to `admin/actions/nudgeClient.action.ts`
- Other admin components with inline calls are already in hooks — low priority.

---

## P4 — Type Definitions

### Ticket 8: Define Dispute & Quote Interfaces
Create two type files:
- `src/types/disputes.ts` — `Dispute`, `DisputeStatus`, `DisputeEvidence`, `DisputeInput`, `DisputeAnalysis`, `DisputeStatusHistory`
- `src/types/quotes.ts` — `Quote`, `QuoteStatus`, `QuoteLineItem`

Replace `as any` chains in `DisputeDetail.tsx`, `DisputeResponse.tsx`, and quote-related files with these typed interfaces.

---

## Summary

```text
Ticket  Priority  Files Changed     Effort
──────  ────────  ───────────────   ──────
1       P0        0 (config only)   1 min
2       P0        1-2 files         20 min
3       P1        5 files deleted   5 min
4       P2        0 (auto-regen)    0 min
5+8     P2+P4     ~12 files         2 hrs
6       P3        4 files           30 min
7       P3        3 files           30 min
```

Tickets 5 and 8 are merged in implementation since defining interfaces (T8) and replacing `as any` (T5) are the same work.

Total: ~15 files touched, 4 files deleted, 2 new type files created, 4 new query/action files created, 1 auth config change.

