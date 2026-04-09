

# Plan: Post-Fix Validation + Route Cleanup

## Issues Found

### 1. RouteGuard: State mutations during render (HIGH)

Lines 79-81 of `RouteGuard.tsx` call `setRetryCount`, `setTimedOut`, and `refresh()` directly inside the render body. This violates React rules and can cause:
- "Cannot update a component while rendering" warnings
- Double-fire in StrictMode
- Unpredictable retry behavior

**Fix:** Move the retry logic into a `useEffect` that triggers when `timedOut` becomes true. The render body should only read state, never mutate it.

Same issue exists in `PublicOnlyGuard` (less critical but should be consistent).

### 2. Messages: No guard for invalid conversation ID (MEDIUM)

When a user navigates to `/messages/some-invalid-id`, `selectedConversation` is `null` but `conversationId` is truthy. The `ConversationThread` renders with all metadata props as `undefined`. The thread itself handles this gracefully (fetches messages by ID, shows error if RLS blocks), but there's no user-facing "conversation not found" state.

**Fix:** Add a guard in `Messages.tsx`: if `conversationId` is set, conversations have loaded, but `selectedConversation` is null → show a "Conversation not found" message with a back link.

### 3. OperatorCockpit: Empty catch blocks (LOW)

Lines 38-39 and 46 have empty `catch {}`. These are intentionally fire-and-forget (audio play, notification constructor), but per workspace standards they should have minimal logging.

**Fix:** Add `console.debug` inside each catch so failures are traceable without being noisy.

### 4. Messages useMemo missing dependency (LOW)

Line 35: `useMemo` for `selectedConversation` depends on `conversationId` and `conversations` but only lists `[conversationId, conversations]` — this is actually correct. No change needed.

## Files to Edit

| File | Change |
|---|---|
| `src/guard/RouteGuard.tsx` | Move retry logic from render body into `useEffect`; same for `PublicOnlyGuard` |
| `src/pages/messages/Messages.tsx` | Add "conversation not found" guard when ID doesn't match |
| `src/pages/admin/sections/OperatorCockpit.tsx` | Replace empty `catch {}` with `console.debug` |

No database or edge function changes.

