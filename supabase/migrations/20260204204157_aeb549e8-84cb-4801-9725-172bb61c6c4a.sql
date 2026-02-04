-- Fix job_reviews RLS: prevent client rating leaks + enforce correct reviewee

-- Drop overly permissive SELECT policies
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.job_reviews;
DROP POLICY IF EXISTS "Anyone can view public reviews" ON public.job_reviews;

-- Policy 1: Reviewers can read reviews they wrote
CREATE POLICY "Reviewers can read their reviews"
ON public.job_reviews
FOR SELECT
USING (auth.uid() = reviewer_user_id);

-- Policy 2: Anyone authenticated can read public reviews of professionals only
CREATE POLICY "Authenticated can read public pro reviews"
ON public.job_reviews
FOR SELECT
USING (
  visibility = 'public'
  AND reviewee_role = 'professional'
);

-- Fix INSERT policy: enforce reviewee is the actual job counterpart
DROP POLICY IF EXISTS "Users can insert reviews for their jobs" ON public.job_reviews;

CREATE POLICY "Users can insert reviews for their jobs"
ON public.job_reviews
FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_user_id
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = job_reviews.job_id
      AND j.status = 'completed'
      AND (
        -- Client reviewing the assigned pro
        (j.user_id = auth.uid()
          AND job_reviews.reviewer_role = 'client'
          AND job_reviews.reviewee_role = 'professional'
          AND job_reviews.reviewee_user_id = j.assigned_professional_id
        )
        OR
        -- Pro reviewing the client (private)
        (j.assigned_professional_id = auth.uid()
          AND job_reviews.reviewer_role = 'professional'
          AND job_reviews.reviewee_role = 'client'
          AND job_reviews.reviewee_user_id = j.user_id
        )
      )
  )
);

-- Add updated_at column and better indexes
ALTER TABLE public.job_reviews 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_job_reviews_reviewee_created 
  ON public.job_reviews(reviewee_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_reviews_reviewer_created 
  ON public.job_reviews(reviewer_user_id, created_at DESC);