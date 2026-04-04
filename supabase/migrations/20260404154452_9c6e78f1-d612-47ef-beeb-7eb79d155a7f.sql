-- Revert ghost jobs: in_progress with no assigned professional → open
UPDATE public.jobs
SET status = 'open', updated_at = now()
WHERE status = 'in_progress' AND assigned_professional_id IS NULL;

-- Prevent future ghost jobs
ALTER TABLE public.jobs
ADD CONSTRAINT chk_in_progress_has_professional
CHECK (status != 'in_progress' OR assigned_professional_id IS NOT NULL);