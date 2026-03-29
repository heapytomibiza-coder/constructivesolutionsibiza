

# Priority 1: End-to-End Flow — Identify & Fix Code Gaps

## Current State (Honest Assessment)

The full journey exists in code: Wizard → Job Alert → Quote → Accept → Complete → Review.

But there are **3 real gaps** that would break the flow for a real user:

### Gap 1: Missing `in_progress` Transition
- `completeJob` requires `status = 'in_progress'`
- `accept_quote_and_assign` RPC sets `assigned_professional_id` but need to verify it also sets status to `in_progress`
- If it doesn't → **client can never complete a job** (blocker)
- **Fix**: Verify the RPC, and if missing, add `status = 'in_progress'` to the accept flow

### Gap 2: Quote Form Allows €0 / Empty Prices
- Pro can submit a "fixed" quote without entering a price amount
- No validation that `priceFixed > 0` when type is "fixed", or `priceMin/priceMax > 0` for estimates
- **Fix**: Add frontend validation in `SubmitQuoteForm` — require a positive number for the selected price type before allowing submit

### Gap 3: Payment Not Wired (Known — Not Blocking Launch)
- Payment protection exists as a concept (legal wording, homepage section) but isn't in the actual job lifecycle
- This is behind `escrow-beta` flag — acknowledged, not a code fix right now
- **Action**: Document this as a known gap, not a bug

## Implementation Plan

### Step 1 — Verify `accept_quote_and_assign` RPC sets `in_progress`
- Read the RPC definition from the database
- If status transition is missing, create a migration to fix it
- This is the **most critical gap** — without it, jobs get stuck after accepting a quote

### Step 2 — Add price validation to SubmitQuoteForm
- In `src/pages/jobs/components/SubmitQuoteForm.tsx`:
  - Fixed: require `priceFixed > 0`
  - Estimate: require `priceMin > 0` and `priceMax > priceMin`
  - Hourly: require `hourlyRate > 0`
- Show toast error if validation fails
- Disable submit button when price fields are empty/invalid

### Step 3 — Build the Smoke Test Checklist
- Create a documented checklist page or output the exact steps to test manually
- Each step maps to the real code path so you know exactly what's being tested

## Files Changed

| File | Change |
|------|--------|
| `src/pages/jobs/components/SubmitQuoteForm.tsx` | Price validation (positive numbers required) |
| Migration SQL (if needed) | Fix `accept_quote_and_assign` to set `status = 'in_progress'` |

## What This Does NOT Change
- Wizard flow — already solid
- Job alerts — already working
- Review system — already working
- Payment integration — intentionally deferred (escrow-beta flag)

## After This
Once gaps are fixed, you run the smoke test manually. Then we move to **Quote Structure Tightening** (priority 2) and **Landing Page Funnel** (priority 3).

