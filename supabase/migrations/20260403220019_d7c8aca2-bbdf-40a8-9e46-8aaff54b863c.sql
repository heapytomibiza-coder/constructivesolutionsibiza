
create or replace function public.calculate_worker_trust_score(p_user_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  v_score numeric := 100;
  v_major_disputes integer;
  v_minor_disputes integer;
  v_completed integer;
  v_total_assigned integer;
  v_completion_rate numeric;
  v_responses integer;
  v_invites integer;
  v_response_rate numeric;
  v_cancellations integer;
  v_avg_rating numeric;
  v_review_count integer;
  v_cutoff timestamptz := now() - interval '90 days';
BEGIN
  SELECT count(*) INTO v_major_disputes
  FROM public.disputes
  WHERE (raised_by = p_user_id OR counterparty_id = p_user_id)
    AND created_at >= v_cutoff
    AND (status = 'escalated' OR human_review_required = true);

  SELECT count(*) INTO v_minor_disputes
  FROM public.disputes
  WHERE (raised_by = p_user_id OR counterparty_id = p_user_id)
    AND created_at >= v_cutoff
    AND status != 'escalated'
    AND (human_review_required IS NULL OR human_review_required = false);

  SELECT count(*) FILTER (WHERE status = 'completed'),
         count(*)
  INTO v_completed, v_total_assigned
  FROM public.jobs
  WHERE assigned_professional_id = p_user_id
    AND status IN ('in_progress', 'completed', 'cancelled');

  IF v_total_assigned > 0 THEN
    v_completion_rate := (v_completed::numeric / v_total_assigned) * 100;
  ELSE
    v_completion_rate := 100;
  END IF;

  SELECT count(*) INTO v_invites
  FROM public.job_invites
  WHERE professional_id = p_user_id;

  SELECT count(*) INTO v_responses
  FROM public.conversations
  WHERE pro_id = p_user_id;

  IF v_invites > 0 THEN
    v_response_rate := (v_responses::numeric / v_invites) * 100;
  ELSE
    v_response_rate := 100;
  END IF;

  SELECT count(*) INTO v_cancellations
  FROM public.jobs
  WHERE assigned_professional_id = p_user_id
    AND status = 'cancelled';

  SELECT coalesce(avg(rating), 0), count(*)
  INTO v_avg_rating, v_review_count
  FROM public.job_reviews
  WHERE reviewee_user_id = p_user_id
    AND reviewee_role = 'professional';

  v_score := v_score - (v_major_disputes * 15);
  v_score := v_score - (v_minor_disputes * 7);

  IF v_completion_rate < 70 THEN
    v_score := v_score - 10;
  END IF;

  IF v_response_rate < 50 THEN
    v_score := v_score - 10;
  END IF;

  IF v_cancellations > 2 THEN
    v_score := v_score - 5;
  END IF;

  IF v_avg_rating >= 4.0 AND v_review_count >= 3 THEN
    v_score := v_score + 5;
  END IF;

  v_score := GREATEST(0, LEAST(100, v_score));

  UPDATE public.professional_profiles
  SET trust_score = v_score
  WHERE user_id = p_user_id;

  RETURN v_score;
END;
$$;
