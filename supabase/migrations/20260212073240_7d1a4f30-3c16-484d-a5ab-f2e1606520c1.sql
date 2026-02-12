
-- 1) Job Status History audit table
CREATE TABLE IF NOT EXISTS public.job_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  change_source text NOT NULL DEFAULT 'app',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_status_history_job_id_idx
  ON public.job_status_history (job_id, created_at DESC);

ALTER TABLE public.job_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_history_owner_select"
ON public.job_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_status_history.job_id
      AND j.user_id = auth.uid()
  )
);

CREATE POLICY "job_history_admin_select"
ON public.job_status_history FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION public.log_job_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.job_status_history(job_id, from_status, to_status, changed_by, change_source, metadata)
    VALUES (NEW.id, NULL, NEW.status, auth.uid(), 'app', jsonb_build_object('initial', true));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.job_status_history(job_id, from_status, to_status, changed_by, change_source)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), 'app');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_job_status_change
AFTER INSERT OR UPDATE OF status ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.log_job_status_change();

-- 2) Notification Preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY,
  email_messages boolean NOT NULL DEFAULT true,
  email_job_matches boolean NOT NULL DEFAULT true,
  email_digests boolean NOT NULL DEFAULT false,
  digest_frequency text NOT NULL DEFAULT 'daily',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs_select_own"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "prefs_insert_own"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prefs_update_own"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3) Admin Health Snapshot RPC
CREATE OR REPLACE FUNCTION public.admin_health_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pending_emails int;
  v_failed_emails int;
  v_oldest_pending_min numeric;
  v_jobs_posted_today int;
  v_active_users_24h int;
  v_active_users_7d int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT count(*) INTO v_pending_emails
  FROM public.email_notifications_queue
  WHERE sent_at IS NULL AND attempts < 3;

  SELECT count(*) INTO v_failed_emails
  FROM public.email_notifications_queue
  WHERE sent_at IS NULL AND attempts >= 3;

  SELECT coalesce(floor(extract(epoch FROM (now() - min(created_at)))/60), 0)
  INTO v_oldest_pending_min
  FROM public.email_notifications_queue
  WHERE sent_at IS NULL AND attempts < 3;

  SELECT count(*) INTO v_jobs_posted_today
  FROM public.jobs
  WHERE status = 'open'
    AND is_publicly_listed = true
    AND created_at >= date_trunc('day', now());

  SELECT count(DISTINCT sender_id) INTO v_active_users_24h
  FROM public.messages
  WHERE created_at >= now() - interval '24 hours';

  SELECT count(DISTINCT sender_id) INTO v_active_users_7d
  FROM public.messages
  WHERE created_at >= now() - interval '7 days';

  RETURN jsonb_build_object(
    'emails', jsonb_build_object(
      'pending', v_pending_emails,
      'failed', v_failed_emails,
      'oldest_pending_minutes', v_oldest_pending_min
    ),
    'jobs', jsonb_build_object(
      'posted_today', v_jobs_posted_today
    ),
    'users', jsonb_build_object(
      'active_24h', v_active_users_24h,
      'active_7d', v_active_users_7d
    )
  );
END;
$$;

-- Auto-create notification preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_intent TEXT;
  v_roles TEXT[];
  v_active_role TEXT;
  v_phone TEXT;
BEGIN
  v_intent := COALESCE(NEW.raw_user_meta_data->>'intent', 'client');
  v_phone := NEW.raw_user_meta_data->>'phone';
  
  IF v_intent = 'client' THEN
    v_roles := ARRAY['client']::TEXT[];
    v_active_role := 'client';
  ELSIF v_intent = 'professional' THEN
    v_roles := ARRAY['client', 'professional']::TEXT[];
    v_active_role := 'professional';
  ELSIF v_intent = 'both' THEN
    v_roles := ARRAY['client', 'professional']::TEXT[];
    v_active_role := 'client';
  ELSE
    v_roles := ARRAY['client']::TEXT[];
    v_active_role := 'client';
  END IF;
  
  INSERT INTO public.user_roles (user_id, roles, active_role)
  VALUES (NEW.id, v_roles, v_active_role);
  
  INSERT INTO public.profiles (user_id, phone)
  VALUES (NEW.id, v_phone);
  
  -- Create notification preferences with defaults
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  IF v_intent IN ('professional', 'both') THEN
    INSERT INTO public.professional_profiles (user_id, onboarding_phase, verification_status)
    VALUES (NEW.id, 'not_started', 'unverified');
  END IF;
  
  RETURN NEW;
END;
$$;
