

# Glitch & Broken Pathway Audit — Findings

## Issues Found

### 1. BUG: `returnTo` vs `returnUrl` mismatch (JobDetailsModal)
**File:** `src/pages/jobs/JobDetailsModal.tsx` line 419
**Problem:** When an unauthenticated user clicks "Sign in to Respond", the code navigates to `/auth?returnTo=/jobs`. But the Auth page reads `returnUrl` (not `returnTo`). The param is silently ignored, so after login the user is dropped at the dashboard instead of being returned to the jobs page.
**Fix:** Change `returnTo` to `returnUrl`.

### 2. BUG: `clientId` undefined on first load — wrong role detection
**File:** `src/pages/messages/Messages.tsx` lines 74-87
**Problem:** On mobile, when a user opens a direct link like `/messages/:id`, the conversation list hasn't fetched yet, so `selectedConversation` is `null`. This means `clientId` passed to `ConversationThread` is `undefined`. Inside the thread, `userRole` defaults to `'professional'` for every user (line 33: `currentUserId === clientId` is always false when clientId is undefined). This means:
- Support requests filed from a direct-link load will have the wrong `userRole`
- The "You're the client" / "You're responding" label is incorrect

**Fix:** Pass `clientId` as `undefined` initially (already happening), but in `ConversationThread`, treat undefined `clientId` as "unknown" and either defer the role determination or fetch the conversation independently.

### 3. GLITCH: `markRead` silently skipped when conversation not yet loaded
**File:** `src/pages/messages/Messages.tsx` lines 37-41
**Problem:** On direct navigation to `/messages/:id`, the `useEffect` for marking read depends on `selectedConversation`, which is `null` until the conversation list query resolves. If the list loads slowly, the conversation stays marked as unread even though the user is actively viewing it. Not a crash, but causes stale unread badges.
**Fix:** This resolves itself once conversations load, so it's cosmetic. Low priority.

### 4. MISSING: No `messages` route in mobile nav
**Problem:** There's no nav entry for `/messages` in the route registry (it has `titleKey` but no `nav` property). Users can only reach messages via dashboard links or notifications. Not a "broken" path but a discoverability gap on mobile.
**Note only** — may be intentional since notification bell and dashboard tiles link to it.

---

## Proposed Fixes (2 changes)

### Fix 1 — `returnTo` → `returnUrl` (one-liner)
In `src/pages/jobs/JobDetailsModal.tsx` line 419, change:
```tsx
navigate(`/auth?returnTo=/jobs`);
```
to:
```tsx
navigate(`/auth?returnUrl=/jobs`);
```

### Fix 2 — Robust `userRole` in ConversationThread
In `src/pages/messages/ConversationThread.tsx`, change the role derivation to handle the undefined `clientId` case gracefully. When `clientId` is not yet known, default to a safe value or derive from conversation data independently. The simplest safe fix:

```tsx
// Before (line 33)
const userRole = currentUserId === clientId ? 'client' : 'professional';

// After — only assign 'professional' when we're sure
const userRole = clientId === undefined
  ? 'client'   // Safe default until conversation loads
  : currentUserId === clientId ? 'client' : 'professional';
```

This is safe because: if the user IS a professional, `clientId` will be a different ID (not undefined), so the comparison still works once data loads. The only time `clientId` is undefined is during the loading race, and defaulting to 'client' prevents mis-labeled support tickets.

---

**Total: 2 files, 2 targeted fixes. No database or routing changes needed.**

