
CREATE OR REPLACE FUNCTION public.enqueue_forum_post_notification()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
  VALUES ('forum_post', NULL, jsonb_build_object(
    'post_id', NEW.id,
    'title', NEW.title,
    'author_display_name', COALESCE(NEW.author_display_name, 'Community Member'),
    'content_preview', left(NEW.content, 200)
  ));
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_enqueue_forum_post_notification
  AFTER INSERT ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_forum_post_notification();
