
# Wizard Step 4 Fix - COMPLETED ✓

Fixed the validation mismatch where hidden questions (text/textarea types, logistics-handled IDs) were blocking wizard progression.

## Changes Made
- Added `isDisplayedInQuestionsStep()` helper to `stepValidation.ts`
- Validation now only checks tile-type questions that are actually shown to users
- Logistics questions (timeline, urgency) validated in Step 5 only

