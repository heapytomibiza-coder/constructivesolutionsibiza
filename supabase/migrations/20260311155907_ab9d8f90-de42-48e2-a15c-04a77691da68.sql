
-- Dead-letter column for permanently failed email notifications
ALTER TABLE public.email_notifications_queue 
  ADD COLUMN IF NOT EXISTS failed_at timestamptz DEFAULT NULL;

-- Index for monitoring failed items
CREATE INDEX IF NOT EXISTS idx_email_queue_failed 
  ON public.email_notifications_queue (failed_at)
  WHERE failed_at IS NOT NULL;
