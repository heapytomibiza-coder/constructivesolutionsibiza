-- 1. Create job_progress_updates table
CREATE TABLE public.job_progress_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  author_id uuid NOT NULL,
  note text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_progress_updates ENABLE ROW LEVEL SECURITY;

-- Author can insert their own updates (must be job owner or assigned pro)
CREATE POLICY "Authors can insert progress updates"
ON public.job_progress_updates
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_progress_updates.job_id
    AND (j.user_id = auth.uid() OR j.assigned_professional_id = auth.uid())
  )
);

-- Job owner and assigned pro can read updates
CREATE POLICY "Job parties can view progress updates"
ON public.job_progress_updates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_progress_updates.job_id
    AND (j.user_id = auth.uid() OR j.assigned_professional_id = auth.uid())
  )
);

-- Admins can view all
CREATE POLICY "Admins can view all progress updates"
ON public.job_progress_updates
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::text) AND is_admin_email());

-- 2. Create progress-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', true);

-- Public read for progress photos
CREATE POLICY "Anyone can view progress photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'progress-photos');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload progress photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update/delete their own photos
CREATE POLICY "Users can update own progress photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own progress photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Allow assigned professionals to view job status history
CREATE POLICY "assigned_pro_can_view_history"
ON public.job_status_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_status_history.job_id
    AND j.assigned_professional_id = auth.uid()
  )
);