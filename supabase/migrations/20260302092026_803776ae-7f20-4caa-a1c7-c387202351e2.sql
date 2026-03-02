
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create indexes to speed up DELETE operations on created_at
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at);
CREATE INDEX IF NOT EXISTS idx_error_events_created_at ON public.error_events (created_at);
CREATE INDEX IF NOT EXISTS idx_network_failures_created_at ON public.network_failures (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_attribution_sessions_first_seen ON public.attribution_sessions (first_seen_at);

-- Create purge function
CREATE OR REPLACE FUNCTION public.purge_stale_telemetry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.page_views WHERE created_at < now() - interval '30 days';
  DELETE FROM public.error_events WHERE created_at < now() - interval '60 days';
  DELETE FROM public.network_failures WHERE created_at < now() - interval '60 days';
  DELETE FROM public.analytics_events WHERE created_at < now() - interval '365 days';
  DELETE FROM public.attribution_sessions WHERE first_seen_at < now() - interval '180 days';
END;
$$;
