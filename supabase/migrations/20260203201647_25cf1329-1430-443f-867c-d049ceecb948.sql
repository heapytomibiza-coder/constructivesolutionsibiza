-- Task 1: Normalize category_contract for all packs missing it
WITH pack_categories AS (
  SELECT 
    qp.id AS pack_id,
    c.slug AS category_slug
  FROM question_packs qp
  JOIN service_micro_categories m ON m.slug = qp.micro_slug AND m.is_active = true
  JOIN service_subcategories s ON s.id = m.subcategory_id
  JOIN service_categories c ON c.id = s.category_id
  WHERE qp.is_active = true
    AND (qp.metadata->>'category_contract' IS NULL 
         OR qp.metadata->>'category_contract' = '')
)
UPDATE question_packs qp
SET metadata = jsonb_set(
  COALESCE(qp.metadata, '{}'::jsonb),
  '{category_contract}',
  to_jsonb(pc.category_slug)
)
FROM pack_categories pc
WHERE qp.id = pc.pack_id;

-- Task 4.2: Add columns to jobs table for computed flags
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS flags TEXT[] DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS computed_inspection_bias TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS computed_safety TEXT;

-- Drop views in correct dependency order (CASCADE handles dependent views)
DROP VIEW IF EXISTS matched_jobs_for_professional CASCADE;
DROP VIEW IF EXISTS job_details CASCADE;
DROP VIEW IF EXISTS jobs_board CASCADE;

-- Recreate jobs_board view with new flag columns
CREATE VIEW jobs_board WITH (security_invoker = true) AS
SELECT
  id,
  title,
  teaser,
  category,
  subcategory,
  micro_slug,
  area,
  location,
  budget_type,
  budget_value,
  budget_min,
  budget_max,
  start_timing,
  start_date,
  has_photos,
  highlights,
  created_at,
  updated_at,
  status,
  is_publicly_listed,
  flags,
  computed_inspection_bias,
  computed_safety
FROM jobs
WHERE is_publicly_listed = true AND status = 'open';

-- Recreate job_details view with new flag columns
CREATE VIEW job_details WITH (security_invoker = true) AS
SELECT
  id,
  title,
  teaser,
  description,
  category,
  subcategory,
  micro_slug,
  area,
  location,
  budget_type,
  budget_value,
  budget_min,
  budget_max,
  start_timing,
  start_date,
  has_photos,
  highlights,
  answers,
  created_at,
  updated_at,
  status,
  is_publicly_listed,
  flags,
  computed_inspection_bias,
  computed_safety,
  (user_id = auth.uid()) AS is_owner
FROM jobs
WHERE is_publicly_listed = true AND status = 'open'
   OR user_id = auth.uid();

-- Recreate matched_jobs_for_professional view with new flag columns
CREATE VIEW matched_jobs_for_professional WITH (security_invoker = true) AS
SELECT
  j.id,
  j.title,
  j.teaser,
  j.category,
  j.subcategory,
  j.micro_slug,
  j.area,
  j.location,
  j.budget_type,
  j.budget_value,
  j.budget_min,
  j.budget_max,
  j.start_timing,
  j.start_date,
  j.has_photos,
  j.highlights,
  j.created_at,
  j.updated_at,
  j.status,
  j.is_publicly_listed,
  j.flags,
  j.computed_inspection_bias,
  j.computed_safety,
  ps.user_id AS professional_user_id
FROM jobs j
JOIN service_micro_categories m ON m.slug = j.micro_slug AND m.is_active = true
JOIN professional_services ps ON ps.micro_id = m.id
WHERE j.is_publicly_listed = true
  AND j.status = 'open'
  AND ps.user_id = auth.uid();