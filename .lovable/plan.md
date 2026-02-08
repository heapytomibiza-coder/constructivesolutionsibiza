

# Admin Domain Refinements + User-Facing Support Trigger

This plan addresses the 4 key refinements identified in the feedback, then implements the user-facing `@csi-support` trigger in the Messages domain.

---

## Current State Analysis

| Issue | Current State | Action |
|-------|--------------|--------|
| Badge JSX | Correctly using `<Badge>` component | ✅ Already correct |
| Actor role | Uses `'admin'` but schema allows `'support'` | Fix to use `'support'` |
| Message RLS | Support reads when request exists OR participant | Tighten to assigned/triage |
| Assigned filter | Shows "assigned to anyone" | Add "Assigned to me" |
| Duplicate audit | `support_request_events` + `admin_actions_log` | Use events as primary |

The badge components (SupportStatusBadge, SupportPriorityBadge, IssueTypeBadge) are already correctly returning JSX with `<Badge>` components. This was verified in the code review.

---

## Implementation Plan

### Step 1: Fix Actor Role Values

Normalize `actor_role` to `'support'` in all support actions (schema already allows this).

**Files to modify:**
- `src/pages/admin/actions/assignSupportTicket.action.ts`
- `src/pages/admin/actions/updateSupportStatus.action.ts`
- `src/pages/admin/actions/joinSupportThread.action.ts`

**Change:**
```typescript
// Before
actor_role: 'admin'

// After
actor_role: 'support'
```

---

### Step 2: Tighten Message RLS for Support Access

Update the policy so support can read messages only when:
1. Ticket is assigned to them, OR
2. Ticket is in 'open' or 'triage' status (unassigned queue), OR
3. They are a conversation participant (after joining)

**Database migration:**

```sql
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Support can read messages for escalated conversations" ON public.messages;

-- Create tighter policy: support reads only assigned/triage tickets or if participant
CREATE POLICY "Support can read messages for assigned or triage tickets"
ON public.messages FOR SELECT
TO authenticated
USING (
  -- Admin can always read (for oversight)
  public.has_role(auth.uid(), 'admin') OR
  -- Support can read if ticket is assigned to them
  EXISTS (
    SELECT 1 FROM public.support_requests sr
    WHERE sr.conversation_id = conversation_id
    AND sr.assigned_to = auth.uid()
    AND sr.status NOT IN ('closed')
  ) OR
  -- Support can read unassigned triage queue
  EXISTS (
    SELECT 1 FROM public.support_requests sr
    WHERE sr.conversation_id = conversation_id
    AND sr.assigned_to IS NULL
    AND sr.status IN ('open', 'triage')
  ) OR
  -- Support who joined the conversation
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  )
);
```

---

### Step 3: Add "Assigned to Me" Filter

**Files to modify:**
- `src/pages/admin/types.ts` - Add new filter value
- `src/pages/admin/queries/supportRequests.query.ts` - Handle new filter
- `src/pages/admin/sections/support/SupportInbox.tsx` - Add tab

**Type changes:**
```typescript
export type SupportStatusFilter = 
  'all' | 'active' | 'open' | 'triage' | 
  'assigned' | 'assigned_to_me' | 'resolved';
```

**Query changes:**
```typescript
else if (filter === 'assigned_to_me') {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    query = query.eq('assigned_to', user.id);
  }
}
```

---

### Step 4: User-Facing Support Trigger (Messages Domain)

This is the core feature: allowing users to request support from within a conversation.

#### New Files

```text
src/pages/messages/
  components/
    RequestSupportButton.tsx    # Button in thread header
    SupportRequestDialog.tsx    # Issue type + summary form
    SystemMessage.tsx           # Distinct styling for system messages
    index.ts
  actions/
    createSupportRequest.action.ts
  hooks/
    useSupportRequestStatus.ts  # Check if open request exists
```

#### RequestSupportButton.tsx

Located in the conversation header, shows:
- "Request Support" when no open request
- "Support Requested" (disabled) when request exists

```typescript
interface Props {
  conversationId: string;
  jobId?: string;
  userRole: 'client' | 'professional';
}

export function RequestSupportButton({ conversationId, jobId, userRole }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { hasOpenRequest, isLoading } = useSupportRequestStatus(conversationId);

  if (hasOpenRequest) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Headset className="h-4 w-4 mr-2" />
        Support Requested
      </Button>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setDialogOpen(true)}
        disabled={isLoading}
      >
        <Headset className="h-4 w-4 mr-2" />
        Request Support
      </Button>
      <SupportRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        conversationId={conversationId}
        jobId={jobId}
        userRole={userRole}
      />
    </>
  );
}
```

#### SupportRequestDialog.tsx

Form with:
- Issue type radio group (icons + labels)
- Optional summary textarea (max 500 chars)
- Submit button

Issue types:
- No response
- No show
- Dispute
- Payment
- Safety concern (auto HIGH priority)
- Other

#### createSupportRequest.action.ts

```typescript
export async function createSupportRequest(params: {
  conversationId: string;
  jobId?: string;
  issueType: string;
  summary?: string;
  userRole: 'client' | 'professional';
}): Promise<CreateResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Check for existing open request (spam prevention)
  const { data: existing } = await supabase
    .from("support_requests")
    .select("id, ticket_number")
    .eq("conversation_id", params.conversationId)
    .not("status", "in", "(resolved,closed)")
    .limit(1);

  if (existing?.length) {
    return { success: false, error: "A support request is already open for this conversation" };
  }

  // Auto-assign priority
  const priority = params.issueType === 'safety_concern' ? 'high' 
    : params.issueType === 'no_show' ? 'high'
    : 'medium';

  // Insert request
  const { data: request, error } = await supabase
    .from("support_requests")
    .insert({
      conversation_id: params.conversationId,
      job_id: params.jobId || null,
      created_by_user_id: user.id,
      created_by_role: params.userRole,
      issue_type: params.issueType,
      summary: params.summary || null,
      priority,
    })
    .select()
    .single();

  if (error) throw error;

  // Insert event
  await supabase.from("support_request_events").insert({
    support_request_id: request.id,
    event_type: 'created',
    actor_user_id: user.id,
    actor_role: params.userRole,
    metadata: { issue_type: params.issueType },
  });

  // Insert system message
  await supabase.from("messages").insert({
    conversation_id: params.conversationId,
    sender_id: user.id,
    body: `Support has been notified. Ticket ${request.ticket_number}`,
    message_type: 'system',
    metadata: { 
      support_request_id: request.id,
      ticket_number: request.ticket_number,
      issue_type: params.issueType,
    },
  });

  return { success: true, ticketNumber: request.ticket_number };
}
```

#### SystemMessage.tsx

Distinct visual treatment for system messages:

```typescript
export function SystemMessage({ message }: { message: Message }) {
  return (
    <div className="flex justify-center my-4">
      <div className="inline-flex items-center gap-2 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4" />
        <span>{message.body}</span>
      </div>
    </div>
  );
}
```

#### ConversationThread.tsx Updates

1. Add `RequestSupportButton` to header
2. Modify message rendering to detect `message_type === 'system'`
3. Handle `@csi-support` mention in composer

```typescript
// In thread header, after job title
<RequestSupportButton
  conversationId={conversationId}
  jobId={selectedConversation?.job_id}
  userRole={currentUserId === selectedConversation?.client_id ? 'client' : 'professional'}
/>

// In message rendering
{messages.map((msg) => (
  msg.message_type === 'system' ? (
    <SystemMessage key={msg.id} message={msg} />
  ) : (
    <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === currentUserId} />
  )
))}
```

#### Update Message Interface

Add the new fields to the Message type:

```typescript
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  message_type?: 'user' | 'system';
  metadata?: Record<string, unknown>;
}
```

---

### Step 5: @csi-support Mention Trigger (Optional Enhancement)

Detect `@csi-support` or `@csiinfoteam` in the message composer:

```typescript
const SUPPORT_MENTION_REGEX = /@csi(?:-support|infoteam)\b/i;

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key !== "Enter" || e.shiftKey) return;
  
  // Check for support mention
  if (SUPPORT_MENTION_REGEX.test(draft)) {
    e.preventDefault();
    // Open support dialog instead of sending
    setSupportDialogOpen(true);
    return;
  }
  
  e.preventDefault();
  handleSend();
};
```

---

## Database Migration Summary

Single migration file with:
1. Tightened messages RLS policy for support access
2. No schema changes needed (existing tables support the feature)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/messages/components/RequestSupportButton.tsx` | Button in thread header |
| `src/pages/messages/components/SupportRequestDialog.tsx` | Issue type form |
| `src/pages/messages/components/SystemMessage.tsx` | System message styling |
| `src/pages/messages/components/index.ts` | Exports |
| `src/pages/messages/actions/createSupportRequest.action.ts` | Create request + system message |
| `src/pages/messages/hooks/useSupportRequestStatus.ts` | Check existing requests |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/actions/assignSupportTicket.action.ts` | actor_role: 'support' |
| `src/pages/admin/actions/updateSupportStatus.action.ts` | actor_role: 'support' |
| `src/pages/admin/actions/joinSupportThread.action.ts` | actor_role: 'support' |
| `src/pages/admin/types.ts` | Add 'assigned_to_me' filter |
| `src/pages/admin/queries/supportRequests.query.ts` | Handle new filter |
| `src/pages/admin/sections/support/SupportInbox.tsx` | Add "My Tickets" tab |
| `src/pages/messages/ConversationThread.tsx` | Add support button + system messages |
| `src/pages/messages/hooks/useMessages.ts` | Add message_type to interface |
| `src/pages/messages/hooks/index.ts` | Export new hook |

---

## Implementation Order

| Order | Task | Effort |
|-------|------|--------|
| 1 | Fix actor_role in admin actions | Small |
| 2 | Database migration: tighten message RLS | Small |
| 3 | Add "Assigned to me" filter | Small |
| 4 | Create useSupportRequestStatus hook | Small |
| 5 | Create SystemMessage component | Small |
| 6 | Create SupportRequestDialog component | Medium |
| 7 | Create createSupportRequest action | Medium |
| 8 | Create RequestSupportButton component | Small |
| 9 | Update ConversationThread with button + system messages | Medium |
| 10 | Add @csi-support mention trigger (optional) | Small |

---

## Testing Checklist

After implementation:
- [ ] Admin can view support inbox with all filter tabs
- [ ] "Assigned to me" shows only tickets assigned to current admin
- [ ] User can click "Request Support" in conversation thread
- [ ] Issue type selection works with all 6 types
- [ ] System message appears in thread after submission
- [ ] Ticket appears in admin support inbox
- [ ] Spam prevention: can't create duplicate open requests
- [ ] Safety concern auto-assigns HIGH priority
- [ ] Support can only read messages for assigned tickets or triage queue

