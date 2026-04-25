-- 1. Create the job-photos bucket (public read so getPublicUrl works on the job board)
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Public read of all objects in this bucket
CREATE POLICY "Job photos are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'job-photos');

-- 3. Authenticated users can upload only into their own user-id folder
CREATE POLICY "Users can upload job photos to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Owners can update their own objects
CREATE POLICY "Users can update own job photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'job-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'job-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Owners can delete their own objects
CREATE POLICY "Users can delete own job photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);