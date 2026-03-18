
-- Add governance columns to question_packs
ALTER TABLE public.question_packs
  ADD COLUMN IF NOT EXISTS schema_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'valid',
  ADD COLUMN IF NOT EXISTS last_validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS validation_errors jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS lint_warnings jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS owner text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_question_packs_status ON public.question_packs(status) WHERE is_active = true;

COMMENT ON COLUMN public.question_packs.schema_version IS 'Version of the question schema format (bumped on breaking changes)';
COMMENT ON COLUMN public.question_packs.status IS 'Governance status: draft | valid | invalid | deprecated';
COMMENT ON COLUMN public.question_packs.validation_errors IS 'Array of schema validation errors from last validation run';
COMMENT ON COLUMN public.question_packs.lint_warnings IS 'Array of quality lint warnings from last validation run';
