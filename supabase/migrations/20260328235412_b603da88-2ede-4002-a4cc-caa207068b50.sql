
-- ============================================================
-- PHASE 6 TICKET 3: get_repeat_hire_pair RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_repeat_hire_pair(
  p_client_id UUID,
  p_pro_id UUID
)
RETURNS TABLE(hire_count BIGINT, last_hired_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::BIGINT AS hire_count,
    MAX(j.completed_at) AS last_hired_at
  FROM public.jobs j
  WHERE j.user_id = p_client_id
    AND j.assigned_professional_id = p_pro_id
    AND j.status = 'completed'
    AND j.completed_at IS NOT NULL;
$$;

-- ============================================================
-- PHASE 6 TICKET 1: Client Reputation Table + RPC
-- ============================================================
CREATE TABLE public.client_reputation (
  user_id UUID PRIMARY KEY,
  total_jobs INTEGER NOT NULL DEFAULT 0,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  completion_rate NUMERIC NOT NULL DEFAULT 0,
  review_rate NUMERIC NOT NULL DEFAULT 0,
  dispute_rate NUMERIC NOT NULL DEFAULT 0,
  repeat_hire_rate NUMERIC NOT NULL DEFAULT 0,
  avg_response_hours NUMERIC NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  badges TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_reputation ENABLE ROW LEVEL SECURITY;

-- Self-read
CREATE POLICY "Users can read own reputation"
  ON public.client_reputation FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin read
CREATE POLICY "Admins can read all reputations"
  ON public.client_reputation FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

-- Pro read (pros can see client reputation for clients on their jobs)
CREATE POLICY "Pros can read client reputation for their jobs"
  ON public.client_reputation FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.user_id = client_reputation.user_id
        AND j.assigned_professional_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.client_id = client_reputation.user_id
        AND c.pro_id = auth.uid()
    )
  );

-- RPC to calculate client reputation
CREATE OR REPLACE FUNCTION public.calculate_client_reputation(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_jobs INTEGER;
  v_completed_jobs INTEGER;
  v_completion_rate NUMERIC;
  v_reviews_given INTEGER;
  v_reviewable_jobs INTEGER;
  v_review_rate NUMERIC;
  v_disputes INTEGER;
  v_dispute_rate NUMERIC;
  v_repeat_clients BIGINT;
  v_total_clients BIGINT;
  v_repeat_hire_rate NUMERIC;
  v_avg_response NUMERIC;
  v_response_score NUMERIC;
  v_score INTEGER;
  v_badges TEXT[] := '{}';
BEGIN
  -- Total jobs created by this client (excluding drafts)
  SELECT COUNT(*) INTO v_total_jobs
  FROM public.jobs
  WHERE user_id = p_user_id AND status NOT IN ('draft');

  -- Completed jobs
  SELECT COUNT(*) INTO v_completed_jobs
  FROM public.jobs
  WHERE user_id = p_user_id AND status = 'completed';

  -- Completion rate
  v_completion_rate := CASE WHEN v_total_jobs > 0
    THEN v_completed_jobs::NUMERIC / v_total_jobs
    ELSE 0 END;

  -- Review rate (reviews given as client / completed jobs)
  SELECT COUNT(*) INTO v_reviews_given
  FROM public.job_reviews
  WHERE reviewer_user_id = p_user_id AND reviewer_role = 'client';

  v_reviewable_jobs := GREATEST(v_completed_jobs, 1);
  v_review_rate := LEAST(v_reviews_given::NUMERIC / v_reviewable_jobs, 1.0);

  -- Dispute rate
  SELECT COUNT(*) INTO v_disputes
  FROM public.disputes
  WHERE raised_by = p_user_id OR counterparty_id = p_user_id;

  v_dispute_rate := CASE WHEN v_total_jobs > 0
    THEN LEAST(v_disputes::NUMERIC / v_total_jobs, 1.0)
    ELSE 0 END;

  -- Repeat hire rate (how many distinct pros hired more than once / total distinct pros)
  SELECT
    COUNT(*) FILTER (WHERE cnt >= 2),
    GREATEST(COUNT(*), 1)
  INTO v_repeat_clients, v_total_clients
  FROM (
    SELECT assigned_professional_id, COUNT(*) AS cnt
    FROM public.jobs
    WHERE user_id = p_user_id AND status = 'completed' AND assigned_professional_id IS NOT NULL
    GROUP BY assigned_professional_id
  ) sub;

  v_repeat_hire_rate := v_repeat_clients::NUMERIC / v_total_clients;

  -- Avg response time (hours from conversation creation to first message by client)
  SELECT COALESCE(AVG(response_hours), 24) INTO v_avg_response
  FROM (
    SELECT EXTRACT(EPOCH FROM (m.created_at - c.created_at)) / 3600.0 AS response_hours
    FROM public.conversations c
    JOIN public.messages m ON m.conversation_id = c.id AND m.sender_id = c.client_id
    WHERE c.client_id = p_user_id
    AND m.created_at = (
      SELECT MIN(m2.created_at) FROM public.messages m2
      WHERE m2.conversation_id = c.id AND m2.sender_id = c.client_id
    )
  ) sub;

  -- Response speed score (0-1, faster is better)
  v_response_score := CASE
    WHEN v_avg_response <= 2 THEN 1.0
    WHEN v_avg_response <= 8 THEN 0.75
    WHEN v_avg_response <= 24 THEN 0.5
    WHEN v_avg_response <= 48 THEN 0.25
    ELSE 0.1
  END;

  -- Final score (0-100)
  v_score := ROUND(
    (v_completion_rate * 20) +
    (v_review_rate * 20) +
    ((1 - v_dispute_rate) * 20) +
    (v_response_score * 20) +
    (v_repeat_hire_rate * 20)
  )::INTEGER;

  -- Derive badges
  IF v_score >= 80 THEN
    v_badges := array_append(v_badges, 'reliable_client');
  END IF;
  IF v_avg_response < 4 THEN
    v_badges := array_append(v_badges, 'fast_responder');
  END IF;
  IF v_review_rate >= 0.7 THEN
    v_badges := array_append(v_badges, 'consistent_reviewer');
  END IF;

  -- Upsert
  INSERT INTO public.client_reputation (
    user_id, total_jobs, completed_jobs, completion_rate, review_rate,
    dispute_rate, repeat_hire_rate, avg_response_hours, score, badges, updated_at
  ) VALUES (
    p_user_id, v_total_jobs, v_completed_jobs, v_completion_rate, v_review_rate,
    v_dispute_rate, v_repeat_hire_rate, v_avg_response, v_score, v_badges, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_jobs = EXCLUDED.total_jobs,
    completed_jobs = EXCLUDED.completed_jobs,
    completion_rate = EXCLUDED.completion_rate,
    review_rate = EXCLUDED.review_rate,
    dispute_rate = EXCLUDED.dispute_rate,
    repeat_hire_rate = EXCLUDED.repeat_hire_rate,
    avg_response_hours = EXCLUDED.avg_response_hours,
    score = EXCLUDED.score,
    badges = EXCLUDED.badges,
    updated_at = now();
END;
$$;

-- ============================================================
-- PHASE 6 TICKET 2: Professional Rankings Table + RPC
-- ============================================================
CREATE TABLE public.professional_rankings (
  user_id UUID PRIMARY KEY,
  rating_avg NUMERIC NOT NULL DEFAULT 0,
  completion_rate NUMERIC NOT NULL DEFAULT 0,
  response_speed_score NUMERIC NOT NULL DEFAULT 0,
  repeat_hire_rate NUMERIC NOT NULL DEFAULT 0,
  activity_score NUMERIC NOT NULL DEFAULT 0,
  ranking_score NUMERIC NOT NULL DEFAULT 0,
  labels TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.professional_rankings ENABLE ROW LEVEL SECURITY;

-- Public read for search ranking
CREATE POLICY "Anyone can read professional rankings"
  ON public.professional_rankings FOR SELECT
  TO public
  USING (true);

-- Admin full access
CREATE POLICY "Admins can manage professional rankings"
  ON public.professional_rankings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

-- RPC to calculate professional ranking
CREATE OR REPLACE FUNCTION public.calculate_professional_ranking(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rating_avg NUMERIC;
  v_total_assigned INTEGER;
  v_completed INTEGER;
  v_completion_rate NUMERIC;
  v_avg_response NUMERIC;
  v_response_score NUMERIC;
  v_repeat_clients BIGINT;
  v_total_clients BIGINT;
  v_repeat_hire_rate NUMERIC;
  v_recent_jobs INTEGER;
  v_activity_score NUMERIC;
  v_ranking_score NUMERIC;
  v_labels TEXT[] := '{}';
BEGIN
  -- Rating: weighted average across all micro stats
  SELECT COALESCE(
    SUM(total_rating_sum)::NUMERIC / NULLIF(SUM(rating_count), 0),
    0
  ) INTO v_rating_avg
  FROM public.professional_micro_stats
  WHERE user_id = p_user_id;

  -- Completion rate
  SELECT
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*)
  INTO v_completed, v_total_assigned
  FROM public.jobs
  WHERE assigned_professional_id = p_user_id
    AND status IN ('completed', 'in_progress', 'cancelled', 'disputed');

  v_completion_rate := CASE WHEN v_total_assigned > 0
    THEN v_completed::NUMERIC / v_total_assigned
    ELSE 0 END;

  -- Response speed (avg hours from conversation creation to first pro message)
  SELECT COALESCE(AVG(response_hours), 24) INTO v_avg_response
  FROM (
    SELECT EXTRACT(EPOCH FROM (m.created_at - c.created_at)) / 3600.0 AS response_hours
    FROM public.conversations c
    JOIN public.messages m ON m.conversation_id = c.id AND m.sender_id = c.pro_id
    WHERE c.pro_id = p_user_id
    AND m.created_at = (
      SELECT MIN(m2.created_at) FROM public.messages m2
      WHERE m2.conversation_id = c.id AND m2.sender_id = c.pro_id
    )
  ) sub;

  v_response_score := CASE
    WHEN v_avg_response <= 1 THEN 1.0
    WHEN v_avg_response <= 4 THEN 0.8
    WHEN v_avg_response <= 12 THEN 0.6
    WHEN v_avg_response <= 24 THEN 0.4
    ELSE 0.2
  END;

  -- Repeat hire rate
  SELECT
    COUNT(*) FILTER (WHERE cnt >= 2),
    GREATEST(COUNT(*), 1)
  INTO v_repeat_clients, v_total_clients
  FROM (
    SELECT user_id AS client, COUNT(*) AS cnt
    FROM public.jobs
    WHERE assigned_professional_id = p_user_id AND status = 'completed'
    GROUP BY user_id
  ) sub;

  v_repeat_hire_rate := v_repeat_clients::NUMERIC / v_total_clients;

  -- Activity score (jobs completed in last 90 days, capped at 10)
  SELECT COUNT(*) INTO v_recent_jobs
  FROM public.jobs
  WHERE assigned_professional_id = p_user_id
    AND status = 'completed'
    AND completed_at >= now() - INTERVAL '90 days';

  v_activity_score := LEAST(v_recent_jobs::NUMERIC / 10.0, 1.0);

  -- Normalize rating to 0-1 scale (assuming 5-star max)
  -- Final ranking score
  v_ranking_score := ROUND((
    (LEAST(v_rating_avg / 5.0, 1.0) * 0.25) +
    (v_completion_rate * 0.20) +
    (v_response_score * 0.15) +
    (v_repeat_hire_rate * 0.20) +
    (v_activity_score * 0.20)
  )::NUMERIC, 4);

  -- Labels
  IF v_rating_avg >= 4.7 THEN
    v_labels := array_append(v_labels, 'top_rated');
  END IF;
  IF v_completion_rate >= 0.9 AND v_completed >= 5 THEN
    v_labels := array_append(v_labels, 'highly_reliable');
  END IF;
  IF v_recent_jobs >= 5 THEN
    v_labels := array_append(v_labels, 'in_demand');
  END IF;

  -- Upsert
  INSERT INTO public.professional_rankings (
    user_id, rating_avg, completion_rate, response_speed_score,
    repeat_hire_rate, activity_score, ranking_score, labels, updated_at
  ) VALUES (
    p_user_id, v_rating_avg, v_completion_rate, v_response_score,
    v_repeat_hire_rate, v_activity_score, v_ranking_score, v_labels, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    rating_avg = EXCLUDED.rating_avg,
    completion_rate = EXCLUDED.completion_rate,
    response_speed_score = EXCLUDED.response_speed_score,
    repeat_hire_rate = EXCLUDED.repeat_hire_rate,
    activity_score = EXCLUDED.activity_score,
    ranking_score = EXCLUDED.ranking_score,
    labels = EXCLUDED.labels,
    updated_at = now();
END;
$$;

-- ============================================================
-- PHASE 6 TICKET 4: Demand Snapshots Table + RPC
-- ============================================================
CREATE TABLE public.demand_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  area TEXT,
  job_count_7d INTEGER NOT NULL DEFAULT 0,
  job_count_30d INTEGER NOT NULL DEFAULT 0,
  pct_change_7d NUMERIC DEFAULT 0,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_snapshots ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read (tier gating done in frontend)
CREATE POLICY "Authenticated users can read demand snapshots"
  ON public.demand_snapshots FOR SELECT
  TO authenticated
  USING (true);

-- Admin full access
CREATE POLICY "Admins can manage demand snapshots"
  ON public.demand_snapshots FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

-- RPC to refresh demand snapshots
CREATE OR REPLACE FUNCTION public.refresh_demand_snapshots()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Delete today's snapshots (idempotent refresh)
  DELETE FROM public.demand_snapshots WHERE snapshot_date = v_today;

  -- Insert category-level snapshots
  INSERT INTO public.demand_snapshots (category, area, job_count_7d, job_count_30d, pct_change_7d, snapshot_date)
  SELECT
    COALESCE(j.category, 'uncategorized') AS category,
    NULL AS area,
    COUNT(*) FILTER (WHERE j.created_at >= now() - INTERVAL '7 days') AS job_count_7d,
    COUNT(*) FILTER (WHERE j.created_at >= now() - INTERVAL '30 days') AS job_count_30d,
    CASE
      WHEN COUNT(*) FILTER (WHERE j.created_at >= now() - INTERVAL '14 days' AND j.created_at < now() - INTERVAL '7 days') > 0
      THEN ROUND(
        (COUNT(*) FILTER (WHERE j.created_at >= now() - INTERVAL '7 days')::NUMERIC /
         COUNT(*) FILTER (WHERE j.created_at >= now() - INTERVAL '14 days' AND j.created_at < now() - INTERVAL '7 days') - 1) * 100,
        1
      )
      ELSE 0
    END AS pct_change_7d,
    v_today
  FROM public.jobs j
  WHERE j.created_at >= now() - INTERVAL '30 days'
    AND j.status NOT IN ('draft')
  GROUP BY j.category;

  -- Insert area-level snapshots
  INSERT INTO public.demand_snapshots (category, area, job_count_7d, job_count_30d, pct_change_7d, snapshot_date)
  SELECT
    COALESCE(j.category, 'uncategorized') AS category,
    j.area,
    COUNT(*) FILTER (WHERE j.created_at >= now() - INTERVAL '7 days') AS job_count_7d,
    COUNT(*) FILTER (WHERE j.created_at >= now() - INTERVAL '30 days') AS job_count_30d,
    0 AS pct_change_7d,
    v_today
  FROM public.jobs j
  WHERE j.created_at >= now() - INTERVAL '30 days'
    AND j.status NOT IN ('draft')
    AND j.area IS NOT NULL
  GROUP BY j.category, j.area;
END;
$$;

-- ============================================================
-- TRIGGERS: Recalculate on job completion + review submission
-- ============================================================

-- Trigger function: recalculate client reputation + pro ranking on job completion
CREATE OR REPLACE FUNCTION public.trg_recalculate_trust_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Recalculate client reputation
    PERFORM public.calculate_client_reputation(NEW.user_id);
    -- Recalculate pro ranking if assigned
    IF NEW.assigned_professional_id IS NOT NULL THEN
      PERFORM public.calculate_professional_ranking(NEW.assigned_professional_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_job_completed_trust_scores
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION public.trg_recalculate_trust_scores();

-- Trigger function: recalculate on review submission
CREATE OR REPLACE FUNCTION public.trg_review_recalculate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
BEGIN
  -- Get job details for this review
  SELECT user_id, assigned_professional_id INTO v_job
  FROM public.jobs WHERE id = NEW.job_id;

  IF v_job IS NOT NULL THEN
    -- Recalculate client reputation
    PERFORM public.calculate_client_reputation(v_job.user_id);
    -- Recalculate pro ranking
    IF v_job.assigned_professional_id IS NOT NULL THEN
      PERFORM public.calculate_professional_ranking(v_job.assigned_professional_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_review_trust_scores
  AFTER INSERT ON public.job_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_review_recalculate();
