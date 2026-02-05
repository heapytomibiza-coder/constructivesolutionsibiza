-- Create storage bucket for forum images
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-images', 'forum-images', true);

-- RLS: Anyone can view forum images (public bucket)
CREATE POLICY "Anyone can view forum images"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum-images');

-- RLS: Authenticated users can upload forum images
CREATE POLICY "Authenticated users can upload forum images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'forum-images' 
  AND auth.uid() IS NOT NULL
);

-- RLS: Users can delete their own forum images
CREATE POLICY "Users can delete own forum images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'forum-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add photos column to forum_posts
ALTER TABLE public.forum_posts
ADD COLUMN photos text[] DEFAULT '{}';