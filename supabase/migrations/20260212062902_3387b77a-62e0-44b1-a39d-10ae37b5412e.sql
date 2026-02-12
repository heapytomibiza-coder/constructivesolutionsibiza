
-- Queue table for job notifications
CREATE TABLE public.job_notifications_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  event TEXT NOT NULL DEFAULT 'job_posted',
  sent_at TIMESTAMPTZ NULL,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: only service role / edge functions access this
ALTER TABLE public.job_notifications_queue ENABLE ROW LEVEL SECURITY;

-- Admin can view
CREATE POLICY "Admins can view notification queue"
ON public.job_notifications_queue
FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- Trigger function: enqueue when job becomes posted
CREATE OR REPLACE FUNCTION public.enqueue_job_posted_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when job transitions to open + publicly listed
  IF NEW.status = 'open' AND NEW.is_publicly_listed = true THEN
    -- On INSERT: always enqueue
    -- On UPDATE: only if it wasn't already open+listed
    IF TG_OP = 'INSERT' OR
       OLD.status != 'open' OR
       OLD.is_publicly_listed != true THEN
      INSERT INTO public.job_notifications_queue (job_id, event)
      VALUES (NEW.id, 'job_posted');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER trg_enqueue_job_posted
AFTER INSERT OR UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_job_posted_notification();
