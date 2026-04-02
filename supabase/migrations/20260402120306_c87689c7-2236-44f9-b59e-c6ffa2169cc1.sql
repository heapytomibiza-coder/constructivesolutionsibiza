
-- Portfolio projects for professional profiles
CREATE TABLE public.portfolio_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text,
  photo_urls text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

-- Anyone can view published portfolio entries
CREATE POLICY "Anyone can view published portfolio"
ON public.portfolio_projects
FOR SELECT
USING (is_published = true);

-- Owners can view all their own entries
CREATE POLICY "Owners can view own portfolio"
ON public.portfolio_projects
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only the assigned pro of a completed job can create a portfolio entry
CREATE POLICY "Assigned pro can create portfolio entry"
ON public.portfolio_projects
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = portfolio_projects.job_id
      AND j.assigned_professional_id = auth.uid()
      AND j.status = 'completed'
  )
);

-- Owners can update their own entries
CREATE POLICY "Owners can update own portfolio"
ON public.portfolio_projects
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Owners can delete their own entries
CREATE POLICY "Owners can delete own portfolio"
ON public.portfolio_projects
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_portfolio_projects_updated_at
BEFORE UPDATE ON public.portfolio_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
