-- Update trigger to use ON CONFLICT DO NOTHING with the new unique index
CREATE OR REPLACE FUNCTION public.enqueue_job_posted_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'open' AND NEW.is_publicly_listed = true THEN
    IF TG_OP = 'INSERT' OR
       OLD.status != 'open' OR
       OLD.is_publicly_listed != true THEN
      INSERT INTO public.job_notifications_queue (job_id, event)
      VALUES (NEW.id, 'job_posted')
      ON CONFLICT (job_id, event) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;