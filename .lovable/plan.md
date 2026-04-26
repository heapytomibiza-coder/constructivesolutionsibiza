# Track 5 Source-of-Truth Correction Plan

## Current finding
I checked the current Lovable workspace paths directly. The Track 5 files now exist here, including:

```text
src/pages/jobs/responses/
src/pages/jobs/responses/components/
src/pages/jobs/responses/hooks/
src/pages/jobs/responses/queries/
src/pages/jobs/actions/__tests__/submitQuote.action.test.ts
src/pages/jobs/responses/components/__tests__/ResponseSyncBadge.test.ts
```

So the immediate issue is not that Track 5 is absent from this workspace now. The issue is that the previous audit bundle was incomplete and did not faithfully snapshot the full Track 5 file set.

## Decision
Do not audit yet. First recreate the Codex bundle cleanly from the current workspace source files.

## Implementation plan

1. **Delete/recreate only the audit bundle folder**
   - Target path: `audits/codex_track5_bundle/`
   - Do not touch app source files.
   - Do not change routes, UI, backend, schema, RPCs, or tests.

2. **Copy the full Track 5 file set verbatim**
   - Preserve relative paths inside the bundle so Codex can map each snapshot back to the source path.
   - Include all requested files:

```text
src/pages/jobs/responses/JobResponsesPage.tsx
src/pages/jobs/responses/mutations.ts
src/pages/jobs/responses/queries/useJobResponses.ts
src/pages/jobs/responses/queries/useMyResponse.ts
src/pages/jobs/responses/queries/useJobResponseCount.ts
src/pages/jobs/responses/components/ResponsesInbox.tsx
src/pages/jobs/responses/components/ResponseCard.tsx
src/pages/jobs/responses/components/ResponseStateTimeline.tsx
src/pages/jobs/responses/components/HireConfirmModal.tsx
src/pages/jobs/responses/components/ProResponseActionBar.tsx
src/pages/jobs/responses/components/ResponseSyncBadge.tsx
src/pages/jobs/responses/hooks/useResponseLinkRetry.ts
src/pages/jobs/actions/submitQuote.action.ts
src/pages/jobs/actions/__tests__/submitQuote.action.test.ts
src/pages/jobs/responses/components/__tests__/ResponseSyncBadge.test.ts
src/pages/dashboard/client/components/JobTicketQuotes.tsx
src/pages/dashboard/client/components/ProQuoteSummary.tsx
src/lib/eventTaxonomy.ts
public/locales/en/responses.json
public/locales/es/responses.json
public/locales/en/dashboard.json
```

3. **Create `audits/codex_track5_bundle/MANIFEST.md`**
   Include:
   - Purpose of the bundle.
   - Exact source path for every copied file.
   - What Codex should audit:
     - Responses inbox ordering and decision clarity.
     - Client entry points and response count badge.
     - Professional response action bar behavior.
     - Response sync badge state calculation.
     - One-shot retry hook and loop prevention.
     - `submitQuote` quote-to-response bridge behavior.
     - Structured logging for link failures.
     - Unit test coverage.
     - English/Spanish copy coverage.
   - What Codex must ignore:
     - Backend/schema/RLS/RPC implementation changes.
     - Quote creation behavior changes.
     - Edge functions.
     - Unrelated routes/components.
   - Current test result: `15/15 passing`.
   - Note: no backend/schema/RPC changes in this frontend pass.

4. **Verify the bundle before returning**
   - Count copied files: expected `21` source snapshots plus `MANIFEST.md`.
   - List the bundle tree.
   - Confirm each copied file exists in the current Lovable workspace source path.

## Return format after implementation

- Bundle path.
- Files included.
- Confirmation that source files were copied from the current Lovable workspace.
- Confirmation that no app behavior/source files were changed.
- Note that auditing should resume only after Codex receives this corrected bundle.