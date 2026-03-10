
-- Performance indexes identified in platform audit
CREATE INDEX IF NOT EXISTS idx_jobs_micro_slug ON public.jobs (micro_slug);
CREATE INDEX IF NOT EXISTS idx_jobs_status_listed ON public.jobs (status, is_publicly_listed);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created ON public.analytics_events (event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON public.email_notifications_queue (sent_at, attempts) WHERE sent_at IS NULL AND attempts < 3;
CREATE INDEX IF NOT EXISTS idx_jobs_user_id_status ON public.jobs (user_id, status);
