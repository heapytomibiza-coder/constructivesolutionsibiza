CREATE TABLE public.qa_reminder_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  week_key TEXT NOT NULL,
  destination TEXT NOT NULL DEFAULT 'telegram',
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (function_name, week_key)
);

ALTER TABLE public.qa_reminder_runs ENABLE ROW LEVEL SECURITY;

-- No public access — only service_role can read/write
CREATE POLICY "Service role only"
  ON public.qa_reminder_runs
  FOR ALL
  USING (false)
  WITH CHECK (false);