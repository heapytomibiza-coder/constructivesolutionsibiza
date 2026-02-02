

# Fix: Proper Effect Cleanup for Highlight Timeout

## Summary
The current highlight effect works but has a minor issue: the timeout cleanup is returned from the inner `tick()` function rather than the effect itself. This means React never uses it. We'll fix this by storing the timeout ID in the outer scope.

## Current Code (lines 140-161)
```typescript
React.useEffect(() => {
  if (!highlightId || isLoading) return;

  const selector = `[data-job-id="${CSS.escape(highlightId)}"]`;

  // Retry for up to 1s to catch first render
  const start = Date.now();
  const tick = () => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary");
      const t = window.setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 3000);
      return () => window.clearTimeout(t);  // ← Never reaches React
    }
    if (Date.now() - start < 1000) {
      requestAnimationFrame(tick);
    }
  };

  tick();
}, [highlightId, isLoading, jobs]);
```

## Fixed Code
```typescript
React.useEffect(() => {
  if (!highlightId || isLoading) return;

  const selector = `[data-job-id="${CSS.escape(highlightId)}"]`;
  const start = Date.now();
  let timeoutId: number | undefined;

  const tick = () => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary");
      timeoutId = window.setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary");
      }, 3000);
      return;
    }
    if (Date.now() - start < 1000) {
      requestAnimationFrame(tick);
    }
  };

  tick();

  return () => {
    if (timeoutId) window.clearTimeout(timeoutId);
  };
}, [highlightId, isLoading, jobs]);
```

## What This Fixes
- Stores `timeoutId` in outer scope so the effect cleanup can access it
- If user navigates away before 3s, the timeout is properly cleared
- Prevents potential memory leaks in edge cases

## File to Modify
**src/pages/jobs/JobsMarketplace.tsx** - Lines 140-161

## Test Checklist
1. Post via wizard → navigate to `/jobs?highlight=<id>`
2. Verify job scrolls into view with ring highlight
3. Navigate away before 3s → no console errors
4. Wait 3s → ring disappears cleanly
5. Apply filter → stats update correctly

