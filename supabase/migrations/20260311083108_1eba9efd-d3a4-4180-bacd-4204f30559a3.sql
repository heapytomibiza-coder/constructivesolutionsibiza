
-- ============================================
-- Trigger: Admin alert when a new job is posted (to admin)
-- ============================================
CREATE OR REPLACE FUNCTION public.enqueue_admin_new_job_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'open' AND NEW.is_publicly_listed = true THEN
    IF TG_OP = 'INSERT' OR OLD.status != 'open' OR OLD.is_publicly_listed != true THEN
      INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
      VALUES ('admin_new_job', NULL, jsonb_build_object(
        'job_id', NEW.id,
        'title', NEW.title,
        'category', COALESCE(NEW.category, ''),
        'area', COALESCE(NEW.area, 'Ibiza'),
        'budget', COALESCE(NEW.budget_type || ': ' || COALESCE(NEW.budget_value::text, ''), 'TBD')
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_new_job_notification ON public.jobs;
CREATE TRIGGER trg_admin_new_job_notification
  AFTER INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_new_job_notification();

-- ============================================
-- Trigger: Admin alert on new user registration
-- ============================================
CREATE OR REPLACE FUNCTION public.enqueue_admin_new_user_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
  VALUES ('admin_new_user', NULL, jsonb_build_object(
    'user_id', NEW.user_id,
    'display_name', COALESCE(NEW.display_name, ''),
    'intent', 'client'
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_new_user_notification ON public.profiles;
CREATE TRIGGER trg_admin_new_user_notification
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_admin_new_user_notification();

-- ============================================
-- Trigger: Welcome email to new users
-- ============================================
CREATE OR REPLACE FUNCTION public.enqueue_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_intent TEXT;
BEGIN
  SELECT active_role INTO v_intent FROM public.user_roles WHERE user_id = NEW.user_id;
  INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
  VALUES ('welcome', NEW.user_id, jsonb_build_object(
    'display_name', COALESCE(NEW.display_name, ''),
    'intent', COALESCE(v_intent, 'client')
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_welcome_email ON public.profiles;
CREATE TRIGGER trg_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_welcome_email();

-- ============================================
-- Trigger: Job posted confirmation to the user
-- ============================================
CREATE OR REPLACE FUNCTION public.enqueue_job_posted_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'open' AND NEW.is_publicly_listed = true THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
      VALUES ('job_posted_confirm', NEW.user_id, jsonb_build_object(
        'job_id', NEW.id,
        'title', NEW.title,
        'category', COALESCE(NEW.category, ''),
        'area', COALESCE(NEW.area, 'Ibiza')
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_job_posted_confirm ON public.jobs;
CREATE TRIGGER trg_job_posted_confirm
  AFTER INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_posted_confirm();

-- ============================================
-- Trigger: Quote received → notify client
-- ============================================
CREATE OR REPLACE FUNCTION public.enqueue_quote_received_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job RECORD;
  v_pro_name TEXT;
  v_conv_id UUID;
BEGIN
  SELECT id, title, user_id INTO v_job FROM public.jobs WHERE id = NEW.job_id;
  SELECT display_name INTO v_pro_name FROM public.professional_profiles WHERE user_id = NEW.professional_id;
  SELECT id INTO v_conv_id FROM public.conversations WHERE job_id = NEW.job_id AND pro_id = NEW.professional_id LIMIT 1;

  INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
  VALUES ('quote_received', v_job.user_id, jsonb_build_object(
    'job_id', NEW.job_id,
    'job_title', COALESCE(v_job.title, 'Job'),
    'pro_name', COALESCE(v_pro_name, 'Professional'),
    'price_type', NEW.price_type,
    'total', NEW.total,
    'conversation_id', COALESCE(v_conv_id::text, '')
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quote_received ON public.quotes;
CREATE TRIGGER trg_quote_received
  AFTER INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_quote_received_notification();

-- ============================================
-- Trigger: Quote accepted/declined → notify professional
-- ============================================
CREATE OR REPLACE FUNCTION public.enqueue_quote_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job_title TEXT;
BEGIN
  IF NEW.status IN ('accepted', 'declined') AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT title INTO v_job_title FROM public.jobs WHERE id = NEW.job_id;

    INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
    VALUES (
      CASE WHEN NEW.status = 'accepted' THEN 'quote_accepted' ELSE 'quote_declined' END,
      NEW.professional_id,
      jsonb_build_object(
        'job_id', NEW.job_id,
        'job_title', COALESCE(v_job_title, 'Job'),
        'quote_id', NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quote_status ON public.quotes;
CREATE TRIGGER trg_quote_status
  AFTER UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_quote_status_notification();

-- ============================================
-- Trigger: Job completed → notify both parties
-- ============================================
CREATE OR REPLACE FUNCTION public.enqueue_job_completed_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    -- Notify the job owner (client)
    INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
    VALUES ('job_completed', NEW.user_id, jsonb_build_object(
      'job_id', NEW.id,
      'title', NEW.title,
      'is_tasker', false
    ));

    -- Notify the assigned professional if exists
    IF NEW.assigned_professional_id IS NOT NULL THEN
      INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
      VALUES ('job_completed', NEW.assigned_professional_id, jsonb_build_object(
        'job_id', NEW.id,
        'title', NEW.title,
        'is_tasker', true
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_job_completed_notification ON public.jobs;
CREATE TRIGGER trg_job_completed_notification
  AFTER UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_completed_notification();
