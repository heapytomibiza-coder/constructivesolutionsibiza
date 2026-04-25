
-- 1) Rewrite admin_notify_matching_pros to use job_micro_links (multi-micro aware, deduped recipients)
CREATE OR REPLACE FUNCTION public.admin_notify_matching_pros(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job record;
  v_pro_count int := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT id, title, category, area
  INTO v_job
  FROM public.jobs
  WHERE id = p_job_id
    AND status = 'open'
    AND is_publicly_listed = true;

  IF v_job.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found or not open');
  END IF;

  -- Find matching pros via job_micro_links (multi-micro aware), dedup by user_id,
  -- align with feed eligibility (ps.status = 'offered', ps.notify = true),
  -- and skip pros who already have a conversation for this job.
  WITH matching_pros AS (
    SELECT DISTINCT ps.user_id
    FROM public.job_micro_links jml
    JOIN public.service_micro_categories smc
      ON smc.slug = jml.micro_slug
     AND smc.is_active = true
    JOIN public.professional_services ps
      ON ps.micro_id = smc.id
    WHERE jml.job_id = v_job.id
      AND ps.status = 'offered'
      AND ps.notify = true
      AND NOT EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.job_id = v_job.id
          AND c.pro_id = ps.user_id
      )
  )
  INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
  SELECT
    'admin_job_nudge',
    mp.user_id,
    jsonb_build_object(
      'job_id', v_job.id,
      'job_title', v_job.title,
      'category', v_job.category,
      'area', v_job.area,
      'triggered_by', 'admin_action'
    )
  FROM matching_pros mp;

  GET DIAGNOSTICS v_pro_count = ROW_COUNT;

  INSERT INTO public.admin_actions_log (admin_user_id, action_type, target_type, target_id, metadata)
  VALUES (
    auth.uid(),
    'notify_matching_pros',
    'job',
    p_job_id,
    jsonb_build_object(
      'pros_notified', v_pro_count,
      'category', v_job.category,
      'area', v_job.area,
      'source', 'job_micro_links'
    )
  );

  RETURN jsonb_build_object('success', true, 'pros_notified', v_pro_count);
END;
$function$;


-- 2) Guardrail trigger: non-custom jobs cannot be open/public without a JML row.
--    Runs AFTER the existing sync_job_micro_links() so the trigger has authoritative state.
CREATE OR REPLACE FUNCTION public.enforce_job_micro_links_for_public_open()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only enforce when the job is being made (or kept) open + publicly listed
  IF NEW.status = 'open' AND NEW.is_publicly_listed = true AND COALESCE(NEW.is_custom_request, false) = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.job_micro_links WHERE job_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Job % cannot be open and publicly listed without at least one job_micro_links row (non-custom jobs require a service selection)', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_job_micro_links_for_public_open ON public.jobs;

-- AFTER trigger so it fires after sync_job_micro_links has populated JML for this row.
CREATE CONSTRAINT TRIGGER trg_enforce_job_micro_links_for_public_open
  AFTER INSERT OR UPDATE OF status, is_publicly_listed, is_custom_request, micro_slug, answers ON public.jobs
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_job_micro_links_for_public_open();
