
CREATE OR REPLACE FUNCTION public.enforce_locked_post_no_replies()
RETURNS trigger
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.forum_posts
    WHERE id = NEW.post_id AND is_locked = true
  ) THEN
    RAISE EXCEPTION 'LOCKED_POST: Cannot reply to an archived post'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_locked_post_no_replies
  BEFORE INSERT ON public.forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_locked_post_no_replies();
