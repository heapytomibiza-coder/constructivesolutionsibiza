
-- Backfill job_micro_links for open/posted/live jobs that have no micro links
-- Maps jobs.subcategory slug → service_subcategories → service_micro_categories
INSERT INTO job_micro_links (job_id, micro_slug)
SELECT j.id, smc.slug
FROM jobs j
JOIN service_subcategories ss ON ss.slug = j.subcategory
JOIN service_micro_categories smc ON smc.subcategory_id = ss.id
WHERE j.status IN ('open', 'posted', 'live')
  AND NOT EXISTS (
    SELECT 1 FROM job_micro_links jml WHERE jml.job_id = j.id
  )
ON CONFLICT DO NOTHING;
