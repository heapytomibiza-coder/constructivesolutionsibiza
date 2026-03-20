
DROP FUNCTION IF EXISTS public.rpc_admin_dispute_inbox();

CREATE OR REPLACE FUNCTION public.rpc_admin_dispute_inbox()
 RETURNS TABLE(
   id uuid, job_id uuid, raised_by uuid, raised_by_role text,
   counterparty_id uuid, issue_types text[], status text,
   summary_neutral text, requested_outcome text,
   ai_confidence_score numeric, recommended_pathway text,
   human_review_required boolean, counterparty_responded_at timestamptz,
   response_deadline timestamptz, evidence_deadline timestamptz,
   created_at timestamptz, updated_at timestamptz,
   resolved_at timestamptz, closed_at timestamptz,
   job_title text, job_category text, job_budget_value numeric, job_area text,
   raiser_name text, counterparty_name text,
   evidence_count bigint, input_count bigint,
   analysis_exists boolean, age_hours numeric,
   completeness_level text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    d.id, d.job_id, d.raised_by, d.raised_by_role, d.counterparty_id,
    d.issue_types::text[], d.status::text,
    d.summary_neutral, d.requested_outcome,
    d.ai_confidence_score, d.recommended_pathway::text,
    d.human_review_required, d.counterparty_responded_at,
    d.response_deadline, d.evidence_deadline,
    d.created_at, d.updated_at, d.resolved_at, d.closed_at,
    j.title, j.category, j.budget_value, j.area,
    COALESCE(p_raiser.display_name, pp_raiser.display_name, 'Unknown'),
    COALESCE(p_counter.display_name, pp_counter.display_name, NULL),
    (SELECT count(*) FROM dispute_evidence de WHERE de.dispute_id = d.id),
    (SELECT count(*) FROM dispute_inputs di WHERE di.dispute_id = d.id),
    EXISTS(SELECT 1 FROM dispute_analysis da WHERE da.dispute_id = d.id AND da.is_current = true),
    ROUND(EXTRACT(epoch FROM now() - d.created_at) / 3600, 1),
    (SELECT
      CASE
        WHEN (
          EXISTS(SELECT 1 FROM dispute_inputs di2 WHERE di2.dispute_id = d.id AND di2.raw_text IS NOT NULL)
          AND EXISTS(SELECT 1 FROM dispute_inputs di3 WHERE di3.dispute_id = d.id AND di3.questionnaire_answers IS NOT NULL)
          AND (SELECT count(*) FROM dispute_evidence de2 WHERE de2.dispute_id = d.id) >= 1
          AND d.counterparty_responded_at IS NOT NULL
        ) THEN 'high'
        WHEN (
          EXISTS(SELECT 1 FROM dispute_inputs di2 WHERE di2.dispute_id = d.id AND di2.raw_text IS NOT NULL)
          AND (
            EXISTS(SELECT 1 FROM dispute_inputs di3 WHERE di3.dispute_id = d.id AND di3.questionnaire_answers IS NOT NULL)
            OR (SELECT count(*) FROM dispute_evidence de2 WHERE de2.dispute_id = d.id) >= 1
          )
        ) THEN 'medium'
        ELSE 'low'
      END
    )
  FROM disputes d
  LEFT JOIN jobs j ON j.id = d.job_id
  LEFT JOIN profiles p_raiser ON p_raiser.user_id = d.raised_by
  LEFT JOIN professional_profiles pp_raiser ON pp_raiser.user_id = d.raised_by
  LEFT JOIN profiles p_counter ON p_counter.user_id = d.counterparty_id
  LEFT JOIN professional_profiles pp_counter ON pp_counter.user_id = d.counterparty_id
  WHERE has_role(auth.uid(), 'admin') AND is_admin_email()
  ORDER BY
    CASE d.status
      WHEN 'open' THEN 1
      WHEN 'awaiting_counterparty' THEN 2
      WHEN 'evidence_collection' THEN 3
      WHEN 'assessment' THEN 4
      WHEN 'escalated' THEN 5
      WHEN 'resolution_offered' THEN 6
      WHEN 'awaiting_acceptance' THEN 7
      WHEN 'resolved' THEN 8
      WHEN 'closed' THEN 9
      ELSE 10
    END,
    d.human_review_required DESC,
    d.created_at ASC;
$function$;
