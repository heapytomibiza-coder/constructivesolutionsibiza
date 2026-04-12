

# Agent 4: Quote Quality Coach — Implementation Plan

## What We're Building
A "Review my quote" button in ProposalBuilder that calls an AI edge function to return advisory suggestions. Fully ephemeral — no DB writes, no schema changes, no blocking.

## Architecture Fit
- Same pattern as Agent 1/3: edge function + Lovable AI Gateway + `gemini-2.5-flash-lite`
- Button-triggered (not auto-run) — zero friction, zero latency impact on submission
- Professional-facing only — already scoped by ProposalBuilder being inside ConversationThread for pros
- Failure is invisible — if AI fails, button just shows "couldn't analyze" and submission remains unaffected

## Implementation Steps

### 1. Edge Function: `analyze-quote-quality`
- Input: `{ job_id, quote_text, line_items, exclusions, notes }`
- Fetches job context from DB (title, teaser, worker_brief, answers, flags, computed_safety, budget)
- Calls Lovable AI with the locked prompt from the spec
- Uses tool calling to enforce structured JSON output (quality_score, issues, missing_elements, suggestions, strengths, should_warn)
- Returns safe fallback on any failure
- Uses existing `_shared/cors.ts` pattern

### 2. Frontend: ProposalBuilder Changes
- Add "Review my quote" button between the Notes/Exclusions section and the sticky footer
- On click: build quote_text from current line items + notes + exclusions, call edge function
- Show inline suggestions panel (collapsible) with:
  - Warning items (amber) for issues/missing_elements
  - Green items for strengths
  - Suggestions as neutral tips
- "Dismiss" closes the panel; submission flow unchanged
- Loading state while AI processes (~2-3s)

### 3. Translation Keys
- Add `proposal.reviewQuote`, `proposal.reviewing`, `proposal.suggestions`, `proposal.strengths`, `proposal.dismissReview`, `proposal.reviewFailed` to `en/jobs.json` and `es/jobs.json`

### 4. No Schema Changes
Zero migrations. Fully ephemeral.

## Files Affected
- **New**: `supabase/functions/analyze-quote-quality/index.ts`
- **Edit**: `src/pages/jobs/components/ProposalBuilder.tsx` (add review button + suggestions panel)
- **Edit**: `public/locales/en/jobs.json` (new translation keys)
- **Edit**: `public/locales/es/jobs.json` (new translation keys)

## Safety
- Never blocks submission
- Never modifies quote data
- Never stores results
- Falls back silently on AI error
- Input capped (quote_text max 2000 chars to prevent token blowup)
- Output arrays capped at 5 items each, score clamped 0-1

