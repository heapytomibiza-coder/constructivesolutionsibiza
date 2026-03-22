-- Backfill trust_score for all existing professionals
-- Uses the same logic as calculate_worker_trust_score trigger function
DO $$
DECLARE
  r RECORD;
  v_score NUMERIC;
  v_major_disputes INT;
  v_minor_disputes INT;
  v_completion_rate NUMERIC;
  v_response_rate NUMERIC;
  v_review_avg NUMERIC;
  v_cancellations INT;
BEGIN
  FOR r IN SELECT user_id FROM public.professional_profiles WHERE trust_score IS NULL
  LOOP
    -- Major disputes (last 90 days)
    SELECT count(*) INTO v_major_disputes
    FROM public.disputes d
    WHERE (d.raised_by = r.user_id OR d.counterparty_id = r.user_id)
      AND d.created_at > now() - interval '90 days'
      AND d.status IN ('escalated', 'resolution_offered', 'awaiting_acceptance');

    -- Minor disputes (last 90 days)
    SELECT count(*) INTO v_minor_disputes
    FROM public.disputes d
    WHERE (d.raised_by = r.user_id OR d.counterparty_id = r.user_id)
      AND d.created_at > now() - interval '90 days'
      AND d.status NOT IN ('escalated', 'resolution_offered', 'awaiting_acceptance', 'closed', 'resolved')
      AND d.status != 'draft';

    -- Completion rate from jobs assigned to this pro
    SELECT
      CASE WHEN count(*) = 0 THEN 100
           ELSE (count(*) FILTER (WHERE status = 'completed')::numeric / count(*) * 100)
      END INTO v_completion_rate
    FROM public.jobs
    WHERE assigned_professional_id = r.user_id
      AND status IN ('completed', 'cancelled', 'in_progress');

    -- Response rate from invites
    SELECT
      CASE WHEN count(*) = 0 THEN 100
           ELSE (count(*) FILTER (WHERE status != 'pending')::numeric / count(*) * 100)
      END INTO v_response_rate
    FROM public.job_invites
    WHERE professional_id = r.user_id;

    -- Review average
    SELECT coalesce(avg(rating), 0) INTO v_review_avg
    FROM public.job_reviews
    WHERE reviewee_user_id = r.user_id;

    -- Cancellations
    SELECT count(*) INTO v_cancellations
    FROM public.jobs
    WHERE assigned_professional_id = r.user_id AND status = 'cancelled';

    -- Calculate score
    v_score := 100;
    v_score := v_score - (v_major_disputes * 15);
    v_score := v_score - (v_minor_disputes * 7);
    IF v_completion_rate < 70 THEN v_score := v_score - 10; END IF;
    IF v_response_rate < 50 THEN v_score := v_score - 10; END IF;
    IF v_cancellations > 2 THEN v_score := v_score - 5; END IF;
    IF v_review_avg >= 4.0 AND v_review_avg > 0 THEN v_score := v_score + 5; END IF;

    -- Clamp
    v_score := GREATEST(0, LEAST(100, v_score));

    UPDATE public.professional_profiles SET trust_score = v_score WHERE user_id = r.user_id;
  END LOOP;
END $$;