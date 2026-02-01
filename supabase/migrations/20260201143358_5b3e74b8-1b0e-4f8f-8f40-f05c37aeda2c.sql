-- 1) Unique constraint for safe upserts on micro_slug
CREATE UNIQUE INDEX IF NOT EXISTS uq_question_packs_micro_slug
ON public.question_packs (micro_slug);

-- 2) Validation trigger to prevent inserting packs for unknown/inactive slugs
CREATE OR REPLACE FUNCTION public.ensure_micro_slug_exists()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.service_micro_categories smc 
    WHERE smc.slug = NEW.micro_slug 
    AND smc.is_active = true
  ) THEN
    RAISE EXCEPTION 'Unknown or inactive micro_slug: %', NEW.micro_slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_micro_slug_exists ON public.question_packs;

CREATE TRIGGER trg_ensure_micro_slug_exists
BEFORE INSERT OR UPDATE ON public.question_packs
FOR EACH ROW EXECUTE FUNCTION public.ensure_micro_slug_exists();