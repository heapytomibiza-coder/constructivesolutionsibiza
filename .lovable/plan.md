

# Plan: Timer Leak Prevention for ServiceUnlockStep

## Overview

Apply the final "gold" version polish to prevent timer leaks and stacking in the `flashSaved` callback. The `MicroToggleTile.tsx` is already complete with all polish applied.

---

## Current Issue

The current `flashSaved` implementation:
```tsx
const flashSaved = useCallback(() => {
  setShowSaved(true);
  window.setTimeout(() => setShowSaved(false), 1200);
}, []);
```

**Problems:**
1. **Timer stacking**: Rapid clicks create multiple overlapping timers
2. **Memory leak**: Timer continues running after component unmounts
3. **Inconsistent UI**: Badge may flash erratically under rapid selection

---

## Solution

Use `useRef` to track the timer and ensure proper cleanup:

```tsx
const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
  };
}, []);

// Prevent stacking + leaks
const flashSaved = useCallback(() => {
  setShowSaved(true);
  
  if (savedTimerRef.current) {
    window.clearTimeout(savedTimerRef.current);
  }
  
  savedTimerRef.current = window.setTimeout(() => {
    setShowSaved(false);
    savedTimerRef.current = null;
  }, 1200);
}, []);
```

---

## Changes Required

### File: `src/pages/onboarding/steps/ServiceUnlockStep.tsx`

| Line | Change |
|------|--------|
| 9 | Add `useRef` to imports |
| 35-36 | Add `savedTimerRef` after state declarations |
| 52-56 | Add cleanup effect after first selection effect |
| 64-68 | Update `flashSaved` to use ref and prevent stacking |

---

## Specific Edits

### 1. Update imports (line 9)
```tsx
// Before
import { useState, useMemo, useCallback, useEffect } from 'react';

// After
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
```

### 2. Add timer ref (after line 35)
```tsx
const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

### 3. Add cleanup effect (after line 56)
```tsx
// Cleanup timer on unmount
useEffect(() => {
  return () => {
    if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
  };
}, []);
```

### 4. Update flashSaved (lines 64-68)
```tsx
// Quiet "Saved" badge - no stacking, no leaks
const flashSaved = useCallback(() => {
  setShowSaved(true);

  if (savedTimerRef.current) {
    window.clearTimeout(savedTimerRef.current);
  }

  savedTimerRef.current = window.setTimeout(() => {
    setShowSaved(false);
    savedTimerRef.current = null;
  }, 1200);
}, []);
```

---

## Verification Checklist

After implementation:
- [ ] Rapid clicking doesn't cause badge to flash erratically
- [ ] Badge shows for exactly 1.2 seconds after last action
- [ ] No console warnings about state updates on unmounted components
- [ ] Timer is properly cleaned up when navigating away

---

## Files to Modify

1. `src/pages/onboarding/steps/ServiceUnlockStep.tsx`

---

## MicroToggleTile Status

✅ **Already complete** - All polish from the "gold" version is applied:
- `+` indicator on unselected tiles
- `✓` checkmark on selected tiles  
- Subtle ring effect on first selection
- 48px touch targets
- Staggered animations

