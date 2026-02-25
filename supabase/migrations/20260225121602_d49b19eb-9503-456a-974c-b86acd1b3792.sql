
-- Step 1: Create 4 Lighthouse Monitor tables with RLS

-- 1a) error_events
CREATE TABLE IF NOT EXISTS public.error_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  error_type text NOT NULL,
  message text NOT NULL,
  stack text,
  url text,
  route text,
  browser text,
  viewport text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own error events"
  ON public.error_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read error events"
  ON public.error_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

-- 1b) tester_reports
CREATE TABLE IF NOT EXISTS public.tester_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  description text NOT NULL,
  url text,
  route text,
  browser text,
  viewport text,
  context jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tester_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own tester reports"
  ON public.tester_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read tester reports"
  ON public.tester_reports FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

CREATE POLICY "Admins can update tester reports"
  ON public.tester_reports FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email())
  WITH CHECK (has_role(auth.uid(), 'admin') AND is_admin_email());

-- 1c) page_views
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  url text,
  route text,
  load_time_ms integer,
  browser text,
  viewport text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own page views"
  ON public.page_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read page views"
  ON public.page_views FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

-- 1d) network_failures
CREATE TABLE IF NOT EXISTS public.network_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_url text,
  method text,
  status_code integer,
  error_message text,
  route text,
  browser text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.network_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own network failures"
  ON public.network_failures FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read network failures"
  ON public.network_failures FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());
