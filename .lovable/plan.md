

# Messaging System Implementation Plan

## Overview
Implement a production-ready 1:1 messaging system between job posters (clients) and professionals, following the interaction-gating policy where conversations can only be initiated from job detail pages.

## Phase 1: Database Migration

Run the provided SQL migration to create:

### Tables
- **conversations**: Links a job with exactly 2 participants (client = job owner, pro = initiator)
  - Denormalized `last_message_at` and `last_message_preview` for fast inbox sorting
  - Unique constraint prevents duplicate threads per job/pair
  - Self-chat check constraint
- **messages**: Individual message records with 5000 char limit

### Supporting Infrastructure
- **Trigger**: `trg_set_conversation_last_message` auto-updates conversation preview on new message
- **RPC Function**: `get_or_create_conversation(job_id, pro_id)` for atomic thread creation
- **RLS Policies**: Participants-only read/write access
- **Realtime**: Both tables added to `supabase_realtime` publication

### Technical Notes
The migration adapts the provided SQL to match your schema:
- Uses `jobs.user_id` (not `created_by`)
- References `auth.users(id)` directly (no profiles table for foreign keys)
- Gating: conversations only allowed for `open` + `publicly_listed` jobs

---

## Phase 2: Frontend Implementation

### File Structure

```text
src/pages/messages/
  Messages.tsx            # Inbox + thread combined view (update existing)
  ConversationThread.tsx  # New: Message thread component
  hooks/
    useConversations.ts   # New: Inbox query hook
    useMessages.ts        # New: Thread query + realtime hook
```

### 2.1 JobDetailsModal.tsx Updates

Add message button with proper gating:

```text
Current state:
  Button disabled with "Message (coming soon)"

New behavior:
  - Not authenticated: Show "Sign in to message" button → redirect to /auth
  - Is job owner: Hide message button entirely
  - Authenticated non-owner:
    1. Call get_or_create_conversation RPC
    2. Navigate to /messages/:conversationId
```

### 2.2 Messages.tsx Transformation

Convert from placeholder to functional inbox:

```text
Layout (desktop):
+------------------+------------------------+
| Conversation     | Thread                 |
| List (sidebar)   | (selected conv)        |
+------------------+------------------------+

Layout (mobile):
- List view by default
- Tap to open thread (full screen)
- Back button to return
```

Key queries:
- Inbox: `conversations` where user is client_id OR pro_id, ordered by last_message_at
- Include job title and other party name for context

### 2.3 ConversationThread.tsx (New)

Message thread component with:
- Message list ordered by created_at ascending
- Sender vs receiver styling (right-aligned = me, left = them)
- Send message form
- Realtime subscription for live updates

### 2.4 Route Updates

Add parameterized route in App.tsx:
- `/messages` → Inbox (list view)
- `/messages/:conversationId` → Thread view

---

## Phase 3: Implementation Details

### Database Query Patterns

**Inbox Query**
```typescript
supabase
  .from("conversations")
  .select(`
    *,
    job:jobs(id, title, category),
    client:client_id(email),
    pro:pro_id(email)
  `)
  .or(`client_id.eq.${userId},pro_id.eq.${userId}`)
  .order("last_message_at", { ascending: false, nullsFirst: false })
```

**Thread Query**
```typescript
supabase
  .from("messages")
  .select("*")
  .eq("conversation_id", conversationId)
  .order("created_at", { ascending: true })
```

**Realtime Subscription**
```typescript
supabase
  .channel(`messages:${conversationId}`)
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
    (payload) => addMessage(payload.new)
  )
  .subscribe()
```

### Message Button Gating Logic

```text
if (!isAuthenticated) {
  → Show "Sign in to message"
  → onClick: navigate to /auth?returnTo=/jobs
}
else if (job.user_id === user.id) {
  → Hide button (can't message own job)
}
else {
  → Show "Message"
  → onClick:
      1. const { data: convId } = await supabase.rpc("get_or_create_conversation", {
           p_job_id: job.id,
           p_pro_id: user.id
         })
      2. navigate(`/messages/${convId}`)
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/messages/Messages.tsx` | Modify | Transform from placeholder to full inbox + thread view |
| `src/pages/messages/ConversationThread.tsx` | Create | Message thread component |
| `src/pages/messages/hooks/useConversations.ts` | Create | Inbox query with realtime |
| `src/pages/messages/hooks/useMessages.ts` | Create | Thread messages query + realtime |
| `src/pages/jobs/JobDetailsModal.tsx` | Modify | Enable Message button with proper gating |
| `src/App.tsx` | Modify | Add `/messages/:conversationId` route |

---

## Test Checklist

1. **Message Button Gating**
   - Unauthenticated user sees "Sign in to message"
   - Job owner doesn't see Message button on their job
   - Authenticated non-owner can click Message

2. **Conversation Creation**
   - First click creates conversation + navigates
   - Second click returns existing conversation

3. **Inbox**
   - Shows all conversations for current user
   - Sorted by most recent message
   - Displays job title and other party

4. **Thread**
   - Shows messages in chronological order
   - Sender messages right-aligned
   - New messages appear in real-time
   - Can send messages

5. **Edge Cases**
   - Cannot message closed jobs
   - Cannot message unlisted jobs
   - Cannot message your own job

