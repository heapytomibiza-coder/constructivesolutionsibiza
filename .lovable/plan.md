

# Audit: MatchAndSend Mobile Layout

## Findings

### 1. Professional cards — button overflow (ISSUE)
**Lines 205-263**: The card uses `flex items-start justify-between gap-4` with two side-by-side buttons ("View Profile" + "Invite") in a `flex-shrink-0` container on the right. On a 375px screen, the name/metadata column and two buttons will compete for ~340px of usable space. The buttons alone consume ~200px, leaving ~140px for the name — workable for short names but will squeeze or clip with longer ones. More critically, the buttons never stack, so on very narrow screens the card content will compress uncomfortably.

**Fix**: On mobile, stack the card vertically — name/metadata on top, buttons below in a row. Use `flex-col sm:flex-row` on the outer wrapper and `w-full sm:w-auto` + `justify-end` on the button group.

### 2. Sticky header metadata row — horizontal overflow (MINOR ISSUE)
**Lines 144-159**: The metadata row shows location, timing, and budget in a single `flex` row with `gap-3`. On narrow screens with long area names or timing text, this can overflow horizontally without wrapping.

**Fix**: Add `flex-wrap` to the metadata row so items wrap naturally.

### 3. Success banner — already acceptable
**Lines 165-170**: Uses `flex items-center gap-2` with `flex-shrink-0` on the icon. Text will wrap naturally. No issue.

### 4. Container padding — already acceptable
Uses `container max-w-4xl` which applies default responsive padding. Fine.

### 5. Touch targets — borderline
The `size="sm"` buttons are ~32px tall which is below the 56px mobile-first standard from project memory. However, changing button size is a broader design decision, not a targeted fix. Note it but do not change in this pass.

## Plan — Minimal Fixes

### File: `src/pages/dashboard/client/MatchAndSend.tsx`

**Fix 1 — Card layout stacking** (line 205):
Change the card's inner flex from `flex items-start justify-between gap-4` to `flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3`. Change the button container (line 234) from `flex items-center gap-2 flex-shrink-0` to `flex items-center gap-2 w-full sm:w-auto justify-end`.

**Fix 2 — Header metadata wrapping** (line 144):
Add `flex-wrap` to the metadata div: `flex items-center gap-3 flex-wrap text-xs text-muted-foreground mt-0.5`.

No other files changed. No logic changes. No redesign.

