

## Fix: Status Filter `'active'` → `'offered'`

### The Problem

The `professional_services` table stores onboarding selections with status `'offered'` (60 rows, zero with `'active'`). Two files filter by `'active'`, causing the scoped wizard and richer Tasker cards to return zero results.

### Changes (2 one-line edits)

| File | Line | From | To |
|------|------|------|-----|
| `src/features/wizard/canonical/hooks/useProServiceScope.ts` | ~31 | `.eq('status', 'active')` | `.eq('status', 'offered')` |
| `src/pages/public/Professionals.tsx` | ~117 | `.eq('status', 'active')` | `.eq('status', 'offered')` |

### What This Unblocks

- Scoped wizard shows the Tasker's actual categories/subcategories/micros (Tests A1-A4)
- Richer select-mode cards display top service tags (Tests B1, B3)
- Empty state only triggers for pros with genuinely zero selections (Test A3)

### Naming Discussion (deferred)

Your point about separating "Scope" from "Services" is valid architecture. The current table (`professional_services`) is effectively onboarding scope, not Phase 2 service listings. However, renaming the table or adding a separate `professional_scope_items` table is a larger change best handled as a dedicated task. The status fix is independent and unblocks the feature now.

### After the Fix

Re-run the QA checklist (A1 through C2) to validate.

