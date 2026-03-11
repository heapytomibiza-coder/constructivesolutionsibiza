
-- Performance indexes on hot query paths
CREATE INDEX IF NOT EXISTS idx_jobs_status_listed_created 
  ON public.jobs (status, is_publicly_listed, created_at DESC)
  WHERE is_publicly_listed = true;

CREATE INDEX IF NOT EXISTS idx_jobs_user_id_status 
  ON public.jobs (user_id, status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
  ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created 
  ON public.analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_views_listing_created 
  ON public.service_views (service_listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_queue_pending 
  ON public.email_notifications_queue (sent_at, attempts)
  WHERE sent_at IS NULL;

-- Unique constraint: prevent duplicate conversations for same job+client+pro
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_job_client_pro 
  ON public.conversations (job_id, client_id, pro_id);
