-- Allow admins to read all conversations (needed for Job Detail Drawer)
CREATE POLICY "Admins can view all conversations"
ON public.conversations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));