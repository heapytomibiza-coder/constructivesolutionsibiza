-- Phase 1: Professional Services Table
CREATE TABLE professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  micro_id UUID NOT NULL REFERENCES service_micro_categories(id) ON DELETE CASCADE,
  notify BOOLEAN DEFAULT true,
  searchable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, micro_id)
);

-- Enable RLS
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users manage their own services
CREATE POLICY "Users manage own services"
  ON professional_services FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for matching queries
CREATE INDEX idx_professional_services_micro
  ON professional_services(micro_id);

CREATE INDEX idx_professional_services_user
  ON professional_services(user_id);

-- Phase 2: Matched Jobs View
CREATE VIEW matched_jobs_for_professional AS
SELECT DISTINCT
  jb.*,
  ps.user_id AS professional_user_id
FROM jobs_board jb
JOIN service_micro_categories smc ON smc.slug = jb.micro_slug
JOIN professional_services ps ON ps.micro_id = smc.id
WHERE jb.is_publicly_listed = true
  AND jb.status = 'open';