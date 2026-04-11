
-- 1a. Add columns
ALTER TABLE public.qa_reminder_runs
  ADD COLUMN IF NOT EXISTS trigger_source text NOT NULL DEFAULT 'cron',
  ADD COLUMN IF NOT EXISTS triggered_by uuid REFERENCES auth.users(id);

-- 1b. Enable RLS and add admin read policy
ALTER TABLE public.qa_reminder_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read qa_reminder_runs"
  ON public.qa_reminder_runs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

-- 1c. Create trigger_qa_reminder() RPC
CREATE OR REPLACE FUNCTION public.trigger_qa_reminder()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _secret text;
  _url text;
  _request_id bigint;
BEGIN
  -- Admin gate
  IF NOT (has_role(auth.uid(), 'admin') AND is_admin_email()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get vault-backed secret
  SELECT decrypted_secret INTO _secret
  FROM vault.decrypted_secrets
  WHERE name = 'INTERNAL_FUNCTION_SECRET'
  LIMIT 1;

  IF _secret IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'INTERNAL_FUNCTION_SECRET not found in vault');
  END IF;

  _url := 'https://ngwbpuxltyfweikdupoj.supabase.co/functions/v1/weekly-qa-reminder';

  SELECT net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', _secret
    ),
    body := jsonb_build_object('source', 'admin_manual', 'triggered_by', auth.uid()::text)
  ) INTO _request_id;

  RETURN jsonb_build_object('status', 'triggered', 'request_id', _request_id);
END;
$$;
