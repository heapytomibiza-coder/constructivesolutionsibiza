
-- 1. Attribution sessions table
CREATE TABLE public.attribution_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  landing_url text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  ref text,
  gclid text,
  fbclid text,
  raw_params jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attribution_sessions_session_id_key UNIQUE (session_id)
);

CREATE INDEX idx_attribution_sessions_user_id ON public.attribution_sessions (user_id);
CREATE INDEX idx_attribution_sessions_utm_source_campaign ON public.attribution_sessions (utm_source, utm_campaign);
CREATE INDEX idx_attribution_sessions_ref ON public.attribution_sessions (ref);

ALTER TABLE public.attribution_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can SELECT
CREATE POLICY "Admins can read attribution sessions"
  ON public.attribution_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- No direct client writes — edge function uses service role

-- 2. Add attribution columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_touch_attribution jsonb,
  ADD COLUMN IF NOT EXISTS last_touch_attribution jsonb;

-- 3. Add attribution column to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS attribution jsonb;
