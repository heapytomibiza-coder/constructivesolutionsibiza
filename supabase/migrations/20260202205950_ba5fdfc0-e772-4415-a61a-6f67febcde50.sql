-- Insert fallback micro under "General Repairs" subcategory
INSERT INTO service_micro_categories (
  id, subcategory_id, name, slug, description, is_active, display_order
)
VALUES (
  gen_random_uuid(),
  'aa9adbd7-d9ca-4dd9-b2db-09a663293fbd',
  'General Project',
  'general-project',
  'General project requiring multiple services or custom work',
  true,
  999
)
ON CONFLICT (subcategory_id, slug) DO NOTHING;

-- Insert fallback question pack (uq_question_packs_micro_slug exists)
INSERT INTO question_packs (micro_slug, title, questions, is_active, version)
VALUES (
  'general-project',
  'General Project Details',
  '[
    {"id":"description","label":"Describe your project","type":"textarea","required":true,"placeholder":"What do you need help with?"},
    {"id":"size_estimate","label":"Project size (if applicable)","type":"text","placeholder":"e.g. 2 rooms, 50m², 3 units"},
    {"id":"materials","label":"Do you have materials already?","type":"radio","options":["Yes","No","Partially"]},
    {"id":"access_notes","label":"Any access considerations?","type":"textarea","placeholder":"Parking, stairs, building access, etc."}
  ]'::jsonb,
  true,
  1
)
ON CONFLICT (micro_slug) DO UPDATE SET
  title = EXCLUDED.title,
  questions = EXCLUDED.questions,
  is_active = EXCLUDED.is_active,
  version = EXCLUDED.version;