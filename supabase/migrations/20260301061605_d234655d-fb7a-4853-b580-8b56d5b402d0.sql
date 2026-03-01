
-- =============================================
-- Migration 1: quotes table + RLS + realtime
-- =============================================

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL,
  price_type text NOT NULL DEFAULT 'fixed',
  price_fixed numeric,
  price_min numeric,
  price_max numeric,
  hourly_rate numeric,
  time_estimate_days integer,
  start_date_estimate date,
  scope_text text NOT NULL DEFAULT '',
  exclusions_text text,
  status text NOT NULL DEFAULT 'submitted',
  revision_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, professional_id, revision_number)
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Pros can insert quotes for jobs they have a conversation on
CREATE POLICY "Pros can insert own quotes" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (
    professional_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.job_id = quotes.job_id AND c.pro_id = auth.uid()
    )
  );

-- Pros can read their own quotes
CREATE POLICY "Pros can view own quotes" ON public.quotes
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

-- Pros can update own quotes (revise/withdraw)
CREATE POLICY "Pros can update own quotes" ON public.quotes
  FOR UPDATE TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- Clients can read all quotes on their jobs
CREATE POLICY "Clients can view quotes on own jobs" ON public.quotes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j WHERE j.id = quotes.job_id AND j.user_id = auth.uid()
    )
  );

-- Clients can update quote status (accept/reject)
CREATE POLICY "Clients can update quote status on own jobs" ON public.quotes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j WHERE j.id = quotes.job_id AND j.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j WHERE j.id = quotes.job_id AND j.user_id = auth.uid()
    )
  );

-- Admins full access
CREATE POLICY "Admins can manage all quotes" ON public.quotes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email())
  WITH CHECK (has_role(auth.uid(), 'admin') AND is_admin_email());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_quotes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quotes_updated_at();
