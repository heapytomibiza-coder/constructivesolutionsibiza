
-- Table for saved professionals
CREATE TABLE public.saved_professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, professional_id)
);

ALTER TABLE public.saved_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved pros"
  ON public.saved_professionals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved pros"
  ON public.saved_professionals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own saved pros"
  ON public.saved_professionals FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RPC: get_saved_pros
CREATE OR REPLACE FUNCTION public.get_saved_pros()
RETURNS TABLE (
  professional_id uuid,
  display_name text,
  avatar_url text,
  avatar_thumb_url text,
  verification_status text,
  tagline text,
  saved_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sp.professional_id,
    pp.display_name,
    pp.avatar_url,
    pp.avatar_thumb_url,
    pp.verification_status,
    pp.tagline,
    sp.created_at AS saved_at
  FROM saved_professionals sp
  LEFT JOIN professional_profiles pp ON pp.user_id = sp.professional_id
  WHERE sp.user_id = auth.uid()
  ORDER BY sp.created_at DESC;
$$;

-- RPC: toggle_saved_pro
CREATE OR REPLACE FUNCTION public.toggle_saved_pro(p_professional_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM saved_professionals
    WHERE user_id = auth.uid() AND professional_id = p_professional_id
  ) INTO _exists;

  IF _exists THEN
    DELETE FROM saved_professionals
    WHERE user_id = auth.uid() AND professional_id = p_professional_id;
    RETURN jsonb_build_object('saved', false);
  ELSE
    INSERT INTO saved_professionals (user_id, professional_id)
    VALUES (auth.uid(), p_professional_id);
    RETURN jsonb_build_object('saved', true);
  END IF;
END;
$$;
