

# Plan: Progressive Retry with Escalating Recovery

## Problem
Currently, the retry button on CategorySelector endlessly reloads the same broken state. There's no escalation — users can click "Try again" forever with no improvement. The auto-skip handlers also jump directly to skip without giving the user a retry chance first.

## What Changes

### 1. Add retry counter to `useResilientQuery`
Track how many times the user has manually retried. Expose `retryCount` and a wrapped `retryWithEscalation` function that:
- **Retry 0 (initial load)**: Normal DB fetch with 5s timeout
- **Retry 1 (first manual retry)**: Re-fetch live data one more time
- **Retry 2+ (second retry)**: Switch to `useFallback = true` immediately, change CTA from "Try again" to "Keep going"

Track `wizard_retry_pressed` event with retry count.

### 2. Update CategorySelector error UI
- Retry 0-1: Show "Try again" button (current behavior)
- Retry 2+: Show fallback categories automatically AND change button to "Keep going" (renders Plan C tiles)
- Track `wizard_fallback_triggered` when Plan C activates via retry escalation

### 3. Update SubcategorySelector empty/error state
Currently shows "No subcategories" text with no escape. Change to:
- First appearance of error/empty: Show "Try again" button
- After 1 failed retry: Show "Keep going" button that calls `onAutoSkip`
- Friendly copy: "We'll simplify things to keep you moving"

### 4. Update MicroStep empty/error state  
Same pattern as SubcategorySelector:
- First error: "Try again"
- Second error: "Keep going" → triggers `onAutoSkip` (custom mode → Logistics)

### 5. Fix auto-skip handlers in CanonicalJobWizard
Per user's instructions, update the three handlers:

**handleSubcategoryAutoSkip**: Switch to custom mode, clear structured fields, jump to Logistics (NOT Micro — Micro depends on subcategoryId which is empty).

**handleMicroAutoSkip**: Switch to custom mode, clear micro fields, jump to Logistics.

**handleQuestionsAutoSkip**: New handler. Track event, jump to Logistics.

### 6. Add `onAutoSkip` prop to QuestionsStep
On fetch timeout/failure (after the existing 5s abort), call `onAutoSkip?.()` so the wizard advances instead of showing an empty state.

## Technical Details

### useResilientQuery changes
- Add `retryCount` state (number), increment on each manual `refetch` call
- Expose `retryCount` and `manualRetry()` (wraps refetch + increments counter)
- After `retryCount >= 2`, force `useFallback = true`
- Track `wizard_retry_pressed` on each manual retry

### CategorySelector changes (~15 lines)
- Use `retryCount` and `manualRetry` from hook
- Error block: conditionally show "Try again" vs render fallback tiles + "Keep going"

### SubcategorySelector changes (~20 lines)
- Add `retryCount` / `manualRetry` from hook
- Replace static "No subcategories" text with retry/escalation UI
- After 1 failed retry on empty/error, show "Keep going" button → `onAutoSkip()`

### MicroStep changes (~20 lines)
- Same pattern as SubcategorySelector

### CanonicalJobWizard changes (~40 lines)
- Rewrite `handleSubcategoryAutoSkip` per user's exact code (custom mode → Logistics)
- Rewrite `handleMicroAutoSkip` per user's exact code
- Add `handleQuestionsAutoSkip` 
- Pass `onAutoSkip={handleQuestionsAutoSkip}` to QuestionsStep

### QuestionsStep changes (~5 lines)
- Add `onAutoSkip?: () => void` to Props
- Call `onAutoSkip?.()` in the catch block after timeout/failure

### Event taxonomy
- Add `wizard_retry_pressed` to eventTaxonomy.ts

## Files to Edit

| File | Change |
|---|---|
| `useResilientQuery.ts` | Add retryCount, manualRetry, escalation logic |
| `CategorySelector.tsx` | Use escalating retry UI |
| `SubcategorySelector.tsx` | Add retry/escalation UI for empty/error states |
| `MicroStep.tsx` | Add retry/escalation UI for empty/error states |
| `CanonicalJobWizard.tsx` | Fix 3 auto-skip handlers, add QuestionsStep onAutoSkip |
| `QuestionsStep.tsx` | Add onAutoSkip prop, call on failure |
| `eventTaxonomy.ts` | Add wizard_retry_pressed |

No database or edge function changes needed.

