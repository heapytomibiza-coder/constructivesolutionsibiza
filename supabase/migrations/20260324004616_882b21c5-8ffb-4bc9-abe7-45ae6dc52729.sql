
-- Add is_locked and is_anonymous columns to forum_posts
ALTER TABLE public.forum_posts
  ADD COLUMN is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false;

-- Allow admins to update any forum post (for lock/anonymize)
CREATE POLICY "Admins can update any forum post"
  ON public.forum_posts
  FOR UPDATE
  TO public
  USING (has_role(auth.uid(), 'admin'::text) AND is_admin_email())
  WITH CHECK (has_role(auth.uid(), 'admin'::text) AND is_admin_email());
