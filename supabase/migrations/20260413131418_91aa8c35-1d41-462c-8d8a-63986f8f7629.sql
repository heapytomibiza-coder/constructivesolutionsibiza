
-- 1. Drop and recreate job_details WITHOUT internal fields, WITH security_invoker
DROP VIEW IF EXISTS public.job_details;

CREATE VIEW public.job_details
WITH (security_invoker = true)
AS
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
  source_lang,
  title_i18n,
  teaser_i18n,
  description_i18n,
  (user_id = auth.uid()) AS is_owner
FROM jobs
WHERE (is_publicly_listed = true AND status = 'open') OR user_id = auth.uid();

-- Grant access to match existing behavior
GRANT SELECT ON public.job_details TO anon, authenticated;

-- 2. Drop and recreate matched_jobs_for_professional WITHOUT internal scoring, WITH worker_brief, WITH security_invoker
DROP VIEW IF EXISTS public.matched_jobs_for_professional;

CREATE VIEW public.matched_jobs_for_professional
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (j.id)
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
  j.source_lang,
  j.title_i18n,
  j.teaser_i18n,
  j.worker_brief,
  ps.user_id AS professional_user_id
FROM jobs j
JOIN job_micro_links jml ON jml.job_id = j.id
JOIN service_micro_categories m ON m.slug = jml.micro_slug AND m.is_active = true
JOIN professional_services ps ON ps.micro_id = m.id
JOIN professional_profiles pp ON pp.user_id = ps.user_id
LEFT JOIN professional_micro_preferences pmp ON pmp.user_id = ps.user_id AND pmp.micro_id = m.id
WHERE j.is_publicly_listed = true
  AND j.status = 'open'
  AND ps.user_id = auth.uid()
  AND (pp.service_zones IS NULL OR pp.service_zones = '{}'::text[] OR j.area = ANY(pp.service_zones))
  AND (pmp.min_budget_eur IS NULL OR pmp.min_budget_eur = 0 OR j.budget_max >= pmp.min_budget_eur::numeric OR j.budget_type = 'tbd')
ORDER BY j.id, j.created_at DESC;

-- Grant access
GRANT SELECT ON public.matched_jobs_for_professional TO authenticated;

-- 3. Replace messages support policy — remove broad admin branch
DROP POLICY IF EXISTS "Support can read messages for escalated conversations" ON public.messages;

CREATE POLICY "Support can read messages for escalated conversations"
ON public.messages
FOR SELECT
USING (
  -- Assigned support agent on an active support request
  (has_role(auth.uid(), 'admin'::text) AND is_admin_email() AND EXISTS (
    SELECT 1 FROM support_requests sr
    WHERE sr.conversation_id = messages.conversation_id
      AND sr.assigned_to = auth.uid()
      AND sr.status <> 'closed'
  ))
  OR
  -- Unassigned open/triage support requests (admin can triage)
  (has_role(auth.uid(), 'admin'::text) AND is_admin_email() AND EXISTS (
    SELECT 1 FROM support_requests sr
    WHERE sr.conversation_id = messages.conversation_id
      AND sr.assigned_to IS NULL
      AND sr.status IN ('open', 'triage')
  ))
  OR
  -- Conversation participants (support agents added as participants)
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
  )
);
