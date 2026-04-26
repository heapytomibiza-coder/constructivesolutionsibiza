# Codex Audit Bundle — Track 5 Responses UI

## Purpose

Self-contained snapshot of the Track 5 (job_responses) frontend pass, copied
verbatim from the current Lovable workspace so Codex can audit without GitHub
access.

This bundle is **read-only**. Files mirror their original source paths under
the bundle root. No app behavior was modified to produce it.

## Source-of-truth confirmation

Every file below was copied directly from the active Lovable workspace at the
listed source path. Bundle path = `audits/codex_track5_bundle/<source path>`.

## File map (bundle path ← source path)

| Bundle path | Source path |
|---|---|
| `src/pages/jobs/responses/JobResponsesPage.tsx` | `src/pages/jobs/responses/JobResponsesPage.tsx` |
| `src/pages/jobs/responses/mutations.ts` | `src/pages/jobs/responses/mutations.ts` |
| `src/pages/jobs/responses/queries/useJobResponses.ts` | `src/pages/jobs/responses/queries/useJobResponses.ts` |
| `src/pages/jobs/responses/queries/useMyResponse.ts` | `src/pages/jobs/responses/queries/useMyResponse.ts` |
| `src/pages/jobs/responses/queries/useJobResponseCount.ts` | `src/pages/jobs/responses/queries/useJobResponseCount.ts` |
| `src/pages/jobs/responses/components/ResponsesInbox.tsx` | `src/pages/jobs/responses/components/ResponsesInbox.tsx` |
| `src/pages/jobs/responses/components/ResponseCard.tsx` | `src/pages/jobs/responses/components/ResponseCard.tsx` |
| `src/pages/jobs/responses/components/ResponseStateTimeline.tsx` | `src/pages/jobs/responses/components/ResponseStateTimeline.tsx` |
| `src/pages/jobs/responses/components/HireConfirmModal.tsx` | `src/pages/jobs/responses/components/HireConfirmModal.tsx` |
| `src/pages/jobs/responses/components/ProResponseActionBar.tsx` | `src/pages/jobs/responses/components/ProResponseActionBar.tsx` |
| `src/pages/jobs/responses/components/ResponseSyncBadge.tsx` | `src/pages/jobs/responses/components/ResponseSyncBadge.tsx` |
| `src/pages/jobs/responses/hooks/useResponseLinkRetry.ts` | `src/pages/jobs/responses/hooks/useResponseLinkRetry.ts` |
| `src/pages/jobs/actions/submitQuote.action.ts` | `src/pages/jobs/actions/submitQuote.action.ts` |
| `src/pages/jobs/actions/__tests__/submitQuote.action.test.ts` | `src/pages/jobs/actions/__tests__/submitQuote.action.test.ts` |
| `src/pages/jobs/responses/components/__tests__/ResponseSyncBadge.test.ts` | `src/pages/jobs/responses/components/__tests__/ResponseSyncBadge.test.ts` |
| `src/pages/dashboard/client/components/JobTicketQuotes.tsx` | `src/pages/dashboard/client/components/JobTicketQuotes.tsx` |
| `src/pages/dashboard/client/components/ProQuoteSummary.tsx` | `src/pages/dashboard/client/components/ProQuoteSummary.tsx` |
| `src/lib/eventTaxonomy.ts` | `src/lib/eventTaxonomy.ts` |
| `public/locales/en/responses.json` | `public/locales/en/responses.json` |
| `public/locales/es/responses.json` | `public/locales/es/responses.json` |
| `public/locales/en/dashboard.json` | `public/locales/en/dashboard.json` |

Total: 21 source snapshots + this manifest.

## What Codex should audit

1. **Responses inbox** (`ResponsesInbox.tsx`, `ResponseCard.tsx`,
   `JobResponsesPage.tsx`) — ordering, empty/loading states, decision clarity.
2. **Client entry points** (`JobTicketQuotes.tsx`, `useJobResponseCount.ts`) —
   the "All responses · N" link and badge accuracy.
3. **Hire decision UX** (`HireConfirmModal.tsx`) — confirmation copy,
   workspace handoff, decline/support paths.
4. **Professional response action bar** (`ProResponseActionBar.tsx`,
   `ResponseStateTimeline.tsx`) — allowed transitions, idempotency.
5. **Sync visibility** (`ResponseSyncBadge.tsx`, `ProQuoteSummary.tsx`) —
   `deriveSyncState` correctness for linked / unlinked / hidden states.
6. **One-shot retry** (`useResponseLinkRetry.ts`) — trigger condition,
   loop prevention, cache invalidation on success.
7. **Quote-to-response bridge** (`submitQuote.action.ts`) — non-blocking
   `link_quote_to_response`, structured failure logging via
   `eventTaxonomy.ts` (`quote_link_failed`), preservation of legacy errors
   (daily limit, duplicate key).
8. **Mutations layer** (`mutations.ts`) — RPC wiring only.
9. **Queries** (`useJobResponses.ts`, `useMyResponse.ts`) — cache keys,
   selection shape, invalidation surface.
10. **Test coverage** (`submitQuote.action.test.ts`,
    `ResponseSyncBadge.test.ts`) — completeness of the cases listed below.
11. **Localization** — EN/ES parity in `responses.json` and EN
    `dashboard.json` keys consumed by Track 5 surfaces.

## What Codex must ignore

- Backend, schema, RLS, RPC implementations, edge functions.
- Quote creation behavior (`submit_quote_with_items` internals).
- Routes, components, and features outside the file map above.
- Build tooling, lockfiles, env config.
- Styling/design-token decisions unless they affect audit findings.

## Test status

- Command: `npx vitest run src/pages/jobs/actions/__tests__/submitQuote.action.test.ts src/pages/jobs/responses/components/__tests__/ResponseSyncBadge.test.ts`
- Result: **15 / 15 passing**

Cases covered:

1. `submit_quote_with_items` success + `link_quote_to_response` success →
   `success: true`, `quoteId` set, `linkWarning: false`.
2. Quote success + link RPC error → `success: true`, `linkWarning: true`.
3. Quote success + link RPC throws → `success: true`, `linkWarning: true`.
4. Quote failure → `success: false`, link RPC not called.
5. Daily-limit and duplicate-key error branches preserved.
6. `deriveSyncState`:
   - matching `quote_id` → `linked`
   - missing/mismatched response `quote_id` → `unlinked`
   - withdrawn/rejected quote → `null` (hidden)

## Scope discipline

This frontend pass made **no** changes to:

- backend
- database schema
- RLS policies
- RPCs / SECURITY DEFINER functions
- edge functions
- migrations

All work is contained in the React/TypeScript layer plus locale JSON.
