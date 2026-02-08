-- Add partial unique index to prevent duplicate open tickets per conversation
CREATE UNIQUE INDEX IF NOT EXISTS one_open_ticket_per_conversation
ON public.support_requests (conversation_id)
WHERE status IN ('open', 'triage', 'joined');

-- Drop the existing overly permissive support policy
DROP POLICY IF EXISTS "Support can read messages for escalated conversations" ON public.messages;

-- Create properly role-gated policy for support/admin to read messages
-- Support can read only when:
-- 1. They are an admin (full oversight)
-- 2. They have the admin role AND ticket is assigned to them
-- 3. They have the admin role AND ticket is in triage queue (unassigned open/triage)
-- 4. They are a participant in the conversation (after joining)
CREATE POLICY "Support can read messages for escalated conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
  -- Admin can always read for oversight
  public.has_role(auth.uid(), 'admin')
  OR
  -- Support/Admin with assigned ticket
  (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.support_requests sr
      WHERE sr.conversation_id = messages.conversation_id
      AND sr.assigned_to = auth.uid()
      AND sr.status NOT IN ('closed')
    )
  )
  OR
  -- Support/Admin can view unassigned triage queue
  (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.support_requests sr
      WHERE sr.conversation_id = messages.conversation_id
      AND sr.assigned_to IS NULL
      AND sr.status IN ('open', 'triage')
    )
  )
  OR
  -- Support who joined the conversation as participant
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  )
);