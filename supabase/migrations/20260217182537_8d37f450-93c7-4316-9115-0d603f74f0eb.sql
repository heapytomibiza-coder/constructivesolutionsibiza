
-- 1) DB trigger: enforce that only complete professionals can be publicly listed
CREATE OR REPLACE FUNCTION public.enforce_pro_public_listing_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.onboarding_phase IS DISTINCT FROM 'complete' THEN
    NEW.is_publicly_listed := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_pro_public_listing_guard ON public.professional_profiles;

CREATE TRIGGER trg_enforce_pro_public_listing_guard
BEFORE INSERT OR UPDATE ON public.professional_profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_pro_public_listing_guard();
