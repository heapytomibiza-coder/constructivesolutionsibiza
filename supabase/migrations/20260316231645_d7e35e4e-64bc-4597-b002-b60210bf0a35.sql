-- P0: Performance indexes for high-query columns
CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON public.jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_micro_slug ON public.jobs (micro_slug) WHERE micro_slug IS NOT NULL;

-- P1: Unique constraint to prevent race-condition duplicate conversations
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_triple ON public.conversations (job_id, client_id, pro_id);