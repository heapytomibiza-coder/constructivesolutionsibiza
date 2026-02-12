-- Drop the old restrictive SELECT policy
DROP POLICY "Users can view own support requests" ON public.support_requests;

-- Create a new policy that lets both conversation participants see the support request
CREATE POLICY "Users can view support requests for their conversations"
ON public.support_requests
FOR SELECT
USING (
  created_by_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = support_requests.conversation_id
    AND (c.client_id = auth.uid() OR c.pro_id = auth.uid())
  )
);