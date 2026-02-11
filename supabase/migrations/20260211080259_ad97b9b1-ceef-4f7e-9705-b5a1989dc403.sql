
-- Create job_invites table for direct professional invitations
CREATE TABLE public.job_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, professional_id)
);

-- Enable RLS
ALTER TABLE public.job_invites ENABLE ROW LEVEL SECURITY;

-- Job owner can view their own invites
CREATE POLICY "Job owners can view invites"
ON public.job_invites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_invites.job_id
    AND j.user_id = auth.uid()
  )
);

-- Job owner can create invites
CREATE POLICY "Job owners can create invites"
ON public.job_invites
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_invites.job_id
    AND j.user_id = auth.uid()
  )
);

-- Job owner can update invites (cancel etc)
CREATE POLICY "Job owners can update invites"
ON public.job_invites
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_invites.job_id
    AND j.user_id = auth.uid()
  )
);

-- Invited professionals can view their invites
CREATE POLICY "Professionals can view their invites"
ON public.job_invites
FOR SELECT
USING (professional_id = auth.uid());

-- Invited professionals can update status (accept/decline)
CREATE POLICY "Professionals can respond to invites"
ON public.job_invites
FOR UPDATE
USING (professional_id = auth.uid())
WITH CHECK (professional_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_job_invites_updated_at
BEFORE UPDATE ON public.job_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
