
CREATE OR REPLACE FUNCTION public.validate_job_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  CASE OLD.status
    WHEN 'draft' THEN
      IF NEW.status NOT IN ('open', 'cancelled') THEN
        RAISE EXCEPTION 'invalid_status_transition: % → % is not allowed', OLD.status, NEW.status;
      END IF;
    WHEN 'open' THEN
      IF NEW.status NOT IN ('in_progress', 'cancelled') THEN
        RAISE EXCEPTION 'invalid_status_transition: % → % is not allowed', OLD.status, NEW.status;
      END IF;
    WHEN 'in_progress' THEN
      IF NEW.status NOT IN ('completed', 'cancelled', 'open') THEN
        RAISE EXCEPTION 'invalid_status_transition: % → % is not allowed', OLD.status, NEW.status;
      END IF;
    WHEN 'completed' THEN
      RAISE EXCEPTION 'invalid_status_transition: completed is a terminal status';
    WHEN 'cancelled' THEN
      RAISE EXCEPTION 'invalid_status_transition: cancelled is a terminal status';
    ELSE
      RAISE EXCEPTION 'invalid_status_transition: unknown status %', OLD.status;
  END CASE;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_quote_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status IN ('accepted', 'rejected', 'withdrawn', 'superseded', 'expired') THEN
    RAISE EXCEPTION 'invalid_quote_transition: % is a terminal status', OLD.status;
  END IF;

  CASE OLD.status
    WHEN 'submitted' THEN
      IF NEW.status NOT IN ('accepted', 'rejected', 'revised', 'withdrawn', 'superseded', 'expired') THEN
        RAISE EXCEPTION 'invalid_quote_transition: % → % is not allowed', OLD.status, NEW.status;
      END IF;
    WHEN 'revised' THEN
      IF NEW.status NOT IN ('accepted', 'rejected', 'withdrawn', 'superseded', 'expired') THEN
        RAISE EXCEPTION 'invalid_quote_transition: % → % is not allowed', OLD.status, NEW.status;
      END IF;
    ELSE
      RAISE EXCEPTION 'invalid_quote_transition: unknown status %', OLD.status;
  END CASE;

  RETURN NEW;
END;
$$;
