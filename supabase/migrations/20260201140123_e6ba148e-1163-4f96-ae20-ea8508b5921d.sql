-- Question Packs Table (Tier 1 question storage)
-- Links to micro-services via micro_slug (must match service_micro_categories.slug)

CREATE TABLE public.question_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  micro_slug TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(micro_slug, version)
);

-- Index for fast lookups by micro_slug
CREATE INDEX idx_question_packs_micro_slug ON public.question_packs(micro_slug) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.question_packs ENABLE ROW LEVEL SECURITY;

-- Public read policy (question packs are public reference data)
CREATE POLICY "Anyone can view active question packs" 
ON public.question_packs 
FOR SELECT 
USING (is_active = true);

-- Add updated_at trigger
CREATE TRIGGER update_question_packs_updated_at
BEFORE UPDATE ON public.question_packs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.question_packs IS 'Dynamic question packs for micro-services, keyed by micro_slug';
COMMENT ON COLUMN public.question_packs.micro_slug IS 'Must match service_micro_categories.slug exactly';
COMMENT ON COLUMN public.question_packs.questions IS 'Array of QuestionDef objects with id, label, type, options, etc.';