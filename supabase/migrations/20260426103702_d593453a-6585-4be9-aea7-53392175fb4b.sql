-- Track 4: Matching Persistence (additive only)

CREATE TABLE IF NOT EXISTS public.job_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_score numeric(6,3) NOT NULL DEFAULT 0,
  final_score numeric(6,3) NOT NULL DEFAULT 0,
  match_reason jsonb NOT NULL DEFAULT '[]'::jsonb,
  wave integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'matched',
  matched_at timestamptz NOT NULL DEFAULT now(),
  viewed_at timestamptz NULL,
  responded_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_matches_job_professional_key UNIQUE (job_id, professional_id),
  CONSTRAINT job_matches_base_score_nonnegative_chk CHECK (base_score >= 0),
  CONSTRAINT job_matches_final_score_nonnegative_chk CHECK (final_score >= 0),
  CONSTRAINT job_matches_wave_positive_chk CHECK (wave >= 1),
  CONSTRAINT job_matches_status_chk CHECK (status IN ('matched','viewed','responded','dismissed','expired'))
);

CREATE INDEX IF NOT EXISTS idx_job_matches_job_id
  ON public.job_matches(job_id);

CREATE INDEX IF NOT EXISTS idx_job_matches_professional_id
  ON public.job_matches(professional_id);

CREATE INDEX IF NOT EXISTS idx_job_matches_status
  ON public.job_matches(status);

CREATE INDEX IF NOT EXISTS idx_job_matches_job_id_status
  ON public.job_matches(job_id, status);

CREATE INDEX IF NOT EXISTS idx_job_matches_professional_id_status
  ON public.job_matches(professional_id, status);

-- updated_at trigger (only create if missing)
DO $$
BEGIN
  IF to_regprocedure('public.update_updated_at_column()') IS NULL THEN
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $fn$
    BEGIN
      NEW.updated_at := now();
      RETURN NEW;
    END;
    $fn$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_job_matches_updated_at ON public.job_matches;

CREATE TRIGGER trg_job_matches_updated_at
  BEFORE UPDATE ON public.job_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

-- Table privileges
REVOKE ALL ON public.job_matches FROM PUBLIC;
REVOKE ALL ON public.job_matches FROM anon;
GRANT SELECT ON public.job_matches TO authenticated;

-- Admins can manage all rows
DROP POLICY IF EXISTS "Admins manage all job_matches" ON public.job_matches;

CREATE POLICY "Admins manage all job_matches"
ON public.job_matches
FOR ALL
USING (public.has_role(auth.uid(), 'admin') AND public.is_admin_email())
WITH CHECK (public.has_role(auth.uid(), 'admin') AND public.is_admin_email());

-- Professionals can read their own matches
DROP POLICY IF EXISTS "Professionals read own job_matches" ON public.job_matches;

CREATE POLICY "Professionals read own job_matches"
ON public.job_matches
FOR SELECT
USING (professional_id = auth.uid());

-- Clients can read matches for jobs they own
DROP POLICY IF EXISTS "Clients read matches for owned jobs" ON public.job_matches;

CREATE POLICY "Clients read matches for owned jobs"
ON public.job_matches
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = job_matches.job_id
      AND j.user_id = auth.uid()
  )
);

-- Admin-only upsert function
CREATE OR REPLACE FUNCTION public.upsert_job_matches(p_job_id uuid, p_matches jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.is_admin_email()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF p_job_id IS NULL THEN
    RAISE EXCEPTION 'job_id_required';
  END IF;

  IF p_matches IS NULL OR jsonb_typeof(p_matches) <> 'array' THEN
    RAISE EXCEPTION 'matches_array_required';
  END IF;

  INSERT INTO public.job_matches (
    job_id,
    professional_id,
    base_score,
    final_score,
    match_reason,
    wave,
    status,
    matched_at,
    viewed_at,
    responded_at
  )
  SELECT
    p_job_id AS job_id,
    (m->>'professional_id')::uuid AS professional_id,
    COALESCE((m->>'base_score')::numeric, 0)::numeric(6,3) AS base_score,
    COALESCE((m->>'final_score')::numeric, 0)::numeric(6,3) AS final_score,
    COALESCE(m->'match_reason', '[]'::jsonb) AS match_reason,
    GREATEST(COALESCE((m->>'wave')::integer, 1), 1) AS wave,
    CASE
      WHEN COALESCE(m->>'status', '') IN ('matched','viewed','responded','dismissed','expired')
        THEN (m->>'status')
      ELSE 'matched'
    END AS status,
    COALESCE(NULLIF(m->>'matched_at', '')::timestamptz, now()) AS matched_at,
    NULLIF(m->>'viewed_at', '')::timestamptz AS viewed_at,
    NULLIF(m->>'responded_at', '')::timestamptz AS responded_at
  FROM jsonb_array_elements(p_matches) AS m
  WHERE m ? 'professional_id'
  ON CONFLICT (job_id, professional_id)
  DO UPDATE SET
    base_score = EXCLUDED.base_score,
    final_score = EXCLUDED.final_score,
    match_reason = EXCLUDED.match_reason,
    wave = GREATEST(public.job_matches.wave, EXCLUDED.wave),
    status = CASE
      WHEN public.job_matches.status = 'responded' AND EXCLUDED.status <> 'responded'
        THEN public.job_matches.status
      ELSE EXCLUDED.status
    END,
    matched_at = public.job_matches.matched_at,
    viewed_at = COALESCE(public.job_matches.viewed_at, EXCLUDED.viewed_at),
    responded_at = COALESCE(public.job_matches.responded_at, EXCLUDED.responded_at),
    updated_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function privileges hardening
REVOKE ALL ON FUNCTION public.upsert_job_matches(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_job_matches(uuid, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.upsert_job_matches(uuid, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_job_matches(uuid, jsonb) TO authenticated;