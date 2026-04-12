-- Table for AI-generated taxonomy classification suggestions
CREATE TABLE public.job_classification_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  model_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected')),
  suggested_category_slug text,
  suggested_subcategory_slug text,
  suggested_micro_slugs text[] DEFAULT '{}',
  confidence numeric,
  reasoning_summary text,
  raw_output jsonb,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by job
CREATE INDEX idx_classification_suggestions_job_id ON public.job_classification_suggestions(job_id);
CREATE INDEX idx_classification_suggestions_status ON public.job_classification_suggestions(status);

-- Enable RLS
ALTER TABLE public.job_classification_suggestions ENABLE ROW LEVEL SECURITY;

-- Admins can read all suggestions
CREATE POLICY "Admins can view classification suggestions"
  ON public.job_classification_suggestions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update (accept/reject) suggestions
CREATE POLICY "Admins can update classification suggestions"
  ON public.job_classification_suggestions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role inserts (no authenticated insert policy needed)
-- Edge functions use service_role key which bypasses RLS