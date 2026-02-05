-- Fix security definer view by using security invoker instead
-- This ensures RLS policies of the querying user are respected

DROP VIEW IF EXISTS public.professional_matching_scores;

CREATE VIEW public.professional_matching_scores 
WITH (security_invoker = true)
AS
SELECT 
  ps.user_id,
  ps.micro_id,
  ps.status,
  ps.notify,
  ps.searchable,
  COALESCE(pmp.preference, 'neutral') AS preference,
  COALESCE(pms.completed_jobs_count, 0) AS completed_jobs_count,
  pms.avg_rating,
  COALESCE(pms.verification_level, 'unverified') AS verification_level,
  -- Scoring formula (higher = better match)
  (
    CASE COALESCE(pmp.preference, 'neutral')
      WHEN 'love' THEN 30
      WHEN 'like' THEN 20
      WHEN 'neutral' THEN 10
      WHEN 'avoid' THEN -50
      ELSE 10
    END
    + COALESCE(pms.completed_jobs_count, 0) * 2
    + COALESCE(pms.avg_rating, 0) * 5
    + CASE COALESCE(pms.verification_level, 'unverified')
        WHEN 'expert' THEN 50
        WHEN 'verified' THEN 30
        WHEN 'progressing' THEN 10
        ELSE 0
      END
  ) AS match_score
FROM public.professional_services ps
LEFT JOIN public.professional_micro_preferences pmp 
  ON ps.user_id = pmp.user_id AND ps.micro_id = pmp.micro_id
LEFT JOIN public.professional_micro_stats pms 
  ON ps.user_id = pms.user_id AND ps.micro_id = pms.micro_id
WHERE ps.searchable = true;