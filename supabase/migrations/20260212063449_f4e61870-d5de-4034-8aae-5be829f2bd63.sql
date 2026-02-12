-- Prevent duplicate queue entries for the same job+event
CREATE UNIQUE INDEX IF NOT EXISTS job_notifications_unique
ON public.job_notifications_queue (job_id, event);