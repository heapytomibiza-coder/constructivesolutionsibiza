-- Add RLS policies for admins to moderate forum content

-- Allow admins to read all forum posts
CREATE POLICY "Admins can read all forum posts"
ON public.forum_posts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete any forum post
CREATE POLICY "Admins can delete any forum post"
ON public.forum_posts
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to read all forum replies
CREATE POLICY "Admins can read all forum replies"
ON public.forum_replies
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete any forum reply
CREATE POLICY "Admins can delete any forum reply"
ON public.forum_replies
FOR DELETE
USING (has_role(auth.uid(), 'admin'));