-- Make the progress-photos bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'progress-photos';

-- Drop any existing overly permissive SELECT policy for this bucket
DROP POLICY IF EXISTS "Anyone can view progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Progress photos are publicly accessible" ON storage.objects;

-- Create a properly scoped SELECT policy: only job parties and admins
CREATE POLICY "Job parties can view progress photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'progress-photos'
  AND (
    -- User is the job owner or assigned professional
    EXISTS (
      SELECT 1
      FROM public.job_progress_updates jpu
      JOIN public.jobs j ON j.id = jpu.job_id
      WHERE jpu.photo_url = name
        AND (j.user_id = auth.uid() OR j.assigned_professional_id = auth.uid())
    )
    -- Or user is an admin
    OR (has_role(auth.uid(), 'admin'::text) AND is_admin_email())
  )
);