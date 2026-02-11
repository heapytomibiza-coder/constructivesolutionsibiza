

# Fix: Block `file` type questions from QuestionsStep

## Problem

The screenshot shows question 6 of 10 is "Upload photos" with `type: 'file'`. It passes the blocklist filter (only `text`, `textarea`, `long_text` are blocked) but has no renderer in the tile-based UI -- resulting in a blank card with no interactive elements.

## Solution

Add `'file'` to the `BLOCKED_TYPES` set in `QuestionsStep.tsx`. File uploads are not appropriate for the tile-based one-question-at-a-time flow and should be handled separately (e.g., in the Extras step or after job creation).

## Technical Change

**File**: `src/features/wizard/canonical/steps/QuestionsStep.tsx` (line 238)

Change:
```typescript
const BLOCKED_TYPES = new Set(['text', 'textarea', 'long_text']);
```

To:
```typescript
const BLOCKED_TYPES = new Set(['text', 'textarea', 'long_text', 'file']);
```

This is a single-line change. The question will be filtered out, reducing the question count (e.g., 10 down to 9), and the "Upload photos" prompt can be handled in the Extras/Logistics step or as a post-save action on the ticket detail page where a proper file uploader component exists.

