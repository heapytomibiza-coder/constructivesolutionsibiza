-- ============================================================
-- Sprint 1: Job Score + Worker Trust Score
-- ============================================================

-- 1. Add job_score column to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS job_score numeric DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_job_score ON public.jobs (job_score);

-- 2. Add trust_score column to professional_profiles
ALTER TABLE public.professional_profiles ADD COLUMN IF NOT EXISTS trust_score numeric DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_professional_profiles_trust_score ON public.professional_profiles (trust_score);

-- ============================================================
-- 3. Inline score calculator for trigger (no extra query)
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_job_score_inline(v_job public.jobs)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_score numeric := 0;
BEGIN
  IF v_job.description IS NOT NULL AND length(trim(v_job.description)) > 20 THEN
    v_score := v_score + 20;
  ELSIF v_job.description IS NOT NULL AND length(trim(v_job.description)) > 0 THEN
    v_score := v_score + 10;
  END IF;

  IF v_job.has_photos = true THEN
    v_score := v_score + 20;
  END IF;

  IF v_job.budget_value IS NOT NULL OR v_job.budget_min IS NOT NULL OR v_job.budget_max IS NOT NULL THEN
    v_score := v_score + 20;
  END IF;

  IF v_job.category IS NOT NULL AND v_job.micro_slug IS NOT NULL THEN
    v_score := v_score + 20;
  ELSIF v_job.category IS NOT NULL OR v_job.subcategory IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;

  IF v_job.start_date IS NOT NULL OR (v_job.start_timing IS NOT NULL AND v_job.start_timing != 'flexible') THEN
    v_score := v_score + 20;
  ELSIF v_job.start_timing = 'flexible' THEN
    v_score := v_score + 10;
  END IF;

  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$;

-- ============================================================
-- 4. Trigger: auto-calculate job_score on INSERT/UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION public.trigger_calculate_job_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR
     NEW.description IS DISTINCT FROM OLD.description OR
     NEW.has_photos IS DISTINCT FROM OLD.has_photos OR
     NEW.budget_value IS DISTINCT FROM OLD.budget_value OR
     NEW.budget_min IS DISTINCT FROM OLD.budget_min OR
     NEW.budget_max IS DISTINCT FROM OLD.budget_max OR
     NEW.category IS DISTINCT FROM OLD.category OR
     NEW.subcategory IS DISTINCT FROM OLD.subcategory OR
     NEW.micro_slug IS DISTINCT FROM OLD.micro_slug OR
     NEW.start_date IS DISTINCT FROM OLD.start_date OR
     NEW.start_timing IS DISTINCT FROM OLD.start_timing THEN

    NEW.job_score := public.calculate_job_score_inline(NEW);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calculate_job_score ON public.jobs;
CREATE TRIGGER trg_calculate_job_score
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_calculate_job_score();

-- ============================================================
-- 5. calculate_job_score RPC (for manual recalculation)
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_job_score(p_job_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_job public.jobs;
  v_score numeric;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_score := public.calculate_job_score_inline(v_job);
  UPDATE public.jobs SET job_score = v_score WHERE id = p_job_id;
  RETURN v_score;
END;
$$;

-- ============================================================
-- 6. calculate_worker_trust_score function
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_worker_trust_score(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
    AND (status IN ('escalated', 'admin_review') OR human_review_required = true);

  SELECT count(*) INTO v_minor_disputes
  FROM public.disputes
  WHERE (raised_by = p_user_id OR counterparty_id = p_user_id)
    AND created_at >= v_cutoff
    AND status NOT IN ('escalated', 'admin_review')
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

-- ============================================================
-- 7. Triggers to refresh trust_score
-- ============================================================

-- 7a. After dispute changes
CREATE OR REPLACE FUNCTION public.trigger_refresh_trust_on_dispute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.raised_by IS NOT NULL THEN
    PERFORM public.calculate_worker_trust_score(NEW.raised_by);
  END IF;
  IF NEW.counterparty_id IS NOT NULL THEN
    PERFORM public.calculate_worker_trust_score(NEW.counterparty_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_trust_on_dispute ON public.disputes;
CREATE TRIGGER trg_refresh_trust_on_dispute
  AFTER INSERT OR UPDATE OF status ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_refresh_trust_on_dispute();

-- 7b. After job completed
CREATE OR REPLACE FUNCTION public.trigger_refresh_trust_on_job_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF NEW.assigned_professional_id IS NOT NULL THEN
      PERFORM public.calculate_worker_trust_score(NEW.assigned_professional_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_trust_on_job_complete ON public.jobs;
CREATE TRIGGER trg_refresh_trust_on_job_complete
  AFTER UPDATE OF status ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_refresh_trust_on_job_complete();

-- 7c. After review submitted
CREATE OR REPLACE FUNCTION public.trigger_refresh_trust_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.reviewee_role = 'professional' THEN
    PERFORM public.calculate_worker_trust_score(NEW.reviewee_user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_trust_on_review ON public.job_reviews;
CREATE TRIGGER trg_refresh_trust_on_review
  AFTER INSERT ON public.job_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_refresh_trust_on_review();

-- ============================================================
-- 8. Backfill existing job scores
-- ============================================================
UPDATE public.jobs SET job_score = public.calculate_job_score_inline(jobs.*) WHERE job_score IS NULL;