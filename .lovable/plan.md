

# Final Fixes: Scroll Lock + Photo Key + Profile Status Polish

## Summary

Two small but important fixes needed to complete the modal/lightbox implementation, plus a minor improvement to the Pro Dashboard profile status display.

---

## Part 1: Add Scroll Lock to PhotoLightbox

### Problem
When the lightbox is open, users can still scroll the background page, which feels broken and can cause the dialog behind to shift.

### Solution
Add a `useEffect` that locks `document.body.style.overflow` while lightbox is open and restores it on close.

### Change Location
`src/pages/jobs/JobDetailsModal.tsx` - inside `PhotoLightbox` component, after the keyboard navigation effect.

### Code to Add
```tsx
// Prevent background scroll while lightbox is open
React.useEffect(() => {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = prevOverflow;
  };
}, []);
```

---

## Part 2: Use Stable Key for Photo Thumbnails

### Problem
Using `key={idx}` for thumbnails is fragile - if photos array changes, React may incorrectly reuse DOM nodes.

### Solution
Use `key={url}` instead (URLs are unique identifiers for photos).

### Change Location
`src/pages/jobs/JobDetailsModal.tsx` - line 413-415 in the photo grid map.

### Before
```tsx
{jobPack.photos.slice(0, 6).map((url, idx) => (
  <button key={idx} ...>
```

### After
```tsx
{jobPack.photos.slice(0, 6).map((url, idx) => (
  <button key={url} ...>
```

---

## Part 3: Improve Profile Status Display (Optional Polish)

### Current Issue
The "Profile complete" check uses `stats.servicesCount > 0`, which duplicates "Services added" and doesn't actually check profile completeness.

### Solution
For now, we can add a comment noting this is a placeholder. The proper fix would be to add a `displayName` field check, but that requires knowing if `professional_profiles` has a `display_name` column.

### Temporary Fix
Keep the current behavior but improve the messaging - if we don't have a proper "profile complete" signal, show a checklist of what's needed.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/jobs/JobDetailsModal.tsx` | Add scroll lock effect + fix photo key |

---

## Technical Details

### PhotoLightbox Scroll Lock (add after line 114)

```tsx
// Prevent background scroll while lightbox is open
React.useEffect(() => {
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = prevOverflow;
  };
}, []);
```

### Photo Thumbnail Key Fix (line 414)

Change from:
```tsx
<button
  key={idx}
```

To:
```tsx
<button
  key={url}
```

---

## Expected Outcome

After implementation:
- Background stays locked when viewing photos in lightbox
- Photo thumbnails use stable keys for correct React reconciliation
- Modal + lightbox are production-ready

---

## Verification Checklist

### Scroll Lock
1. Open a job with photos
2. Click a photo to open lightbox
3. Try to scroll the page (should not move)
4. Close lightbox
5. Scrolling should work again

### Photo Keys
1. Open a job with photos
2. Navigate between photos
3. No visual glitches or unexpected behavior

