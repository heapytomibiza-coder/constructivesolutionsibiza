
-- Soft deletes on forum tables
ALTER TABLE public.forum_posts ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.forum_posts ADD COLUMN deleted_by uuid;
ALTER TABLE public.forum_replies ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.forum_replies ADD COLUMN deleted_by uuid;
