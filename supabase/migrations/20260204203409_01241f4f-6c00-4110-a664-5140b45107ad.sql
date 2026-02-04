-- Add assigned_professional_id and completed_at to jobs table
ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS assigned_professional_id UUID,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create job_reviews table for two-way ratings
CREATE TABLE public.job_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL,
  reviewee_user_id UUID NOT NULL,
  reviewer_role TEXT NOT NULL,
  reviewee_role TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT job_reviews_reviewer_role_check CHECK (reviewer_role IN ('client', 'professional')),
  CONSTRAINT job_reviews_reviewee_role_check CHECK (reviewee_role IN ('client', 'professional')),
  CONSTRAINT job_reviews_rating_check CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT job_reviews_visibility_check CHECK (visibility IN ('private', 'public')),
  CONSTRAINT unique_review_per_job_per_reviewer UNIQUE (job_id, reviewer_user_id)
);

-- Enable RLS
ALTER TABLE public.job_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can insert reviews if they are the reviewer and part of the job
CREATE POLICY "Users can insert reviews for their jobs"
ON public.job_reviews
FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_user_id
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_reviews.job_id
    AND j.status = 'completed'
    AND (j.user_id = auth.uid() OR j.assigned_professional_id = auth.uid())
  )
);

-- RLS Policy: Users can view reviews they wrote or received
CREATE POLICY "Users can view their own reviews"
ON public.job_reviews
FOR SELECT
USING (
  auth.uid() = reviewer_user_id 
  OR auth.uid() = reviewee_user_id
);

-- RLS Policy: Public reviews (professional ratings) can be viewed by anyone authenticated
CREATE POLICY "Anyone can view public reviews"
ON public.job_reviews
FOR SELECT
USING (visibility = 'public');

-- Add index for performance
CREATE INDEX idx_job_reviews_job_id ON public.job_reviews(job_id);
CREATE INDEX idx_job_reviews_reviewee ON public.job_reviews(reviewee_user_id);