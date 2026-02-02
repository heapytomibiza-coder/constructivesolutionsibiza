-- Add read timestamp columns for unread tracking
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS last_read_at_client timestamptz,
ADD COLUMN IF NOT EXISTS last_read_at_pro timestamptz;

-- Set defaults for existing conversations
UPDATE public.conversations
SET 
  last_read_at_client = COALESCE(last_read_at_client, created_at),
  last_read_at_pro = COALESCE(last_read_at_pro, created_at);

-- Indexes for read state queries
CREATE INDEX IF NOT EXISTS idx_conversations_last_read_client
  ON public.conversations (last_read_at_client);

CREATE INDEX IF NOT EXISTS idx_conversations_last_read_pro
  ON public.conversations (last_read_at_pro);

-- Index for efficient unread count queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender_created
  ON public.messages (conversation_id, sender_id, created_at DESC);

-- RPC function to get conversations with unread count
CREATE OR REPLACE FUNCTION public.get_conversations_with_unread()
RETURNS TABLE (
  id uuid,
  job_id uuid,
  client_id uuid,
  pro_id uuid,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz,
  last_read_at_client timestamptz,
  last_read_at_pro timestamptz,
  unread_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.job_id,
    c.client_id,
    c.pro_id,
    c.last_message_at,
    c.last_message_preview,
    c.created_at,
    c.last_read_at_client,
    c.last_read_at_pro,
    (
      SELECT count(*)
      FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.created_at > COALESCE(
          CASE
            WHEN auth.uid() = c.client_id THEN c.last_read_at_client
            ELSE c.last_read_at_pro
          END,
          c.created_at
        )
        AND m.sender_id <> auth.uid()
    ) AS unread_count
  FROM public.conversations c
  WHERE auth.uid() IN (c.client_id, c.pro_id)
  ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_conversations_with_unread() TO authenticated;