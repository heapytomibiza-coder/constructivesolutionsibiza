
-- Trigger to enqueue notification when a bug report is submitted
CREATE OR REPLACE FUNCTION public.enqueue_bug_report_notification()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
  VALUES ('bug_report', NULL, jsonb_build_object(
    'report_id', NEW.id,
    'description', left(NEW.description, 300),
    'url', COALESCE(NEW.url, ''),
    'route', COALESCE(NEW.route, ''),
    'browser', COALESCE(left(NEW.browser, 100), ''),
    'viewport', COALESCE(NEW.viewport, ''),
    'user_id', NEW.user_id::text
  ));
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_enqueue_bug_report_notification
  AFTER INSERT ON public.tester_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_bug_report_notification();
