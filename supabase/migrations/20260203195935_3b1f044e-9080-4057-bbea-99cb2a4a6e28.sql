-- Add author_display_name snapshot to forum tables for display without joins
-- This stores a snapshot at post/reply creation time

ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS author_display_name TEXT DEFAULT 'Anonymous';

ALTER TABLE public.forum_replies 
ADD COLUMN IF NOT EXISTS author_display_name TEXT DEFAULT 'Anonymous';

-- Create function to auto-populate author_display_name from professional_profiles or user_roles
CREATE OR REPLACE FUNCTION public.set_forum_author_display_name()
RETURNS TRIGGER AS $$
DECLARE
  v_display_name TEXT;
BEGIN
  -- Try to get display_name from professional_profiles first
  SELECT display_name INTO v_display_name
  FROM public.professional_profiles
  WHERE user_id = NEW.author_id
  AND display_name IS NOT NULL
  LIMIT 1;
  
  -- If no professional profile, use a generic name
  IF v_display_name IS NULL THEN
    v_display_name := 'Community Member';
  END IF;
  
  NEW.author_display_name := v_display_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER trg_set_post_author_display_name
BEFORE INSERT ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.set_forum_author_display_name();

CREATE TRIGGER trg_set_reply_author_display_name
BEFORE INSERT ON public.forum_replies
FOR EACH ROW EXECUTE FUNCTION public.set_forum_author_display_name();