
-- 1. Index on jobs(micro_slug) for matched_jobs_for_professional view
CREATE INDEX IF NOT EXISTS idx_jobs_micro_slug ON public.jobs (micro_slug);

-- 2. Composite index on messages for unread counts and conversation message retrieval
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages (conversation_id, created_at DESC);

-- 3. Composite index on jobs for board/feed/listing queries
CREATE INDEX IF NOT EXISTS idx_jobs_status_listed_created ON public.jobs (status, is_publicly_listed, created_at DESC);

-- 4. Partial composite index on email_notifications_queue for dedup check in enqueue_message_notification trigger
-- The trigger checks: event_type = 'new_message' AND recipient_user_id = ? AND sent_at IS NULL
-- Also benefits the consumer query: WHERE sent_at IS NULL AND attempts < 3 ORDER BY created_at ASC
CREATE INDEX IF NOT EXISTS idx_email_queue_unsent_dedup ON public.email_notifications_queue (event_type, recipient_user_id) WHERE sent_at IS NULL;
