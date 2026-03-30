

# Fix: Custom Request Form "Continue" Button Unresponsive on Mobile

## Problem
Real user ("Izz") filled in the custom request form completely but cannot tap Continue. The button appears enabled but does not respond.

## Root Causes

### Cause 1: Fixed overlays stealing mobile touches
`PostJob.tsx` lines 23-29 have two `fixed inset-0` elements (background image + blur overlay) without `pointer-events-none`. On iOS Safari with `backdrop-blur`, these can intercept touch events even though the content div has `z-10`. The user was able to fill in the form fields (which are higher up the page) but the Continue button sits near the bottom edge where touch interception is more aggressive.

### Cause 2: Silent validation failure
`CustomRequestForm.tsx` line 74: `if (!canContinue || !selectedCategory) return;` — if the category lookup fails silently (e.g. race condition between `preselectedCategoryId` and the categories query), the button is enabled but clicking it does nothing. No toast, no error, no feedback.

## Fix

### File 1: `src/pages/jobs/PostJob.tsx`
Add `pointer-events-none` to both fixed background divs:
- Line 24: `className="fixed inset-0 ... pointer-events-none"`
- Line 29: `className="fixed inset-0 ... pointer-events-none"`

### File 2: `src/features/wizard/canonical/steps/CustomRequestForm.tsx`
Add defensive feedback so the form never fails silently:
- If `handleSubmit` is called but `selectedCategory` is falsy, show a toast: "Please select a category"
- If `canContinue` is false but somehow the button was tapped, show which field is missing

Two small changes, zero risk, fixes the live user's problem.

## No database changes.

