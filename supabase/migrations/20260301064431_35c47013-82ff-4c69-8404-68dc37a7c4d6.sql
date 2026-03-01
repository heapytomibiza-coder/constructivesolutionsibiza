
-- Quote line items for Bookipi-style proposal builder
CREATE TABLE public.quote_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add VAT and computed totals to quotes
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS vat_percent NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valid_until DATE;

-- Enable RLS
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;

-- RLS: Pros can manage line items on their own quotes
CREATE POLICY "Pros can insert own quote line items"
  ON public.quote_line_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_line_items.quote_id
        AND q.professional_id = auth.uid()
    )
  );

CREATE POLICY "Pros can update own quote line items"
  ON public.quote_line_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_line_items.quote_id
        AND q.professional_id = auth.uid()
    )
  );

CREATE POLICY "Pros can delete own quote line items"
  ON public.quote_line_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_line_items.quote_id
        AND q.professional_id = auth.uid()
    )
  );

CREATE POLICY "Pros can view own quote line items"
  ON public.quote_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_line_items.quote_id
        AND q.professional_id = auth.uid()
    )
  );

-- Clients can view line items for quotes on their jobs
CREATE POLICY "Clients can view quote line items on own jobs"
  ON public.quote_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      JOIN public.jobs j ON j.id = q.job_id
      WHERE q.id = quote_line_items.quote_id
        AND j.user_id = auth.uid()
    )
  );

-- Admins full access
CREATE POLICY "Admins can manage all quote line items"
  ON public.quote_line_items FOR ALL
  USING (has_role(auth.uid(), 'admin') AND is_admin_email())
  WITH CHECK (has_role(auth.uid(), 'admin') AND is_admin_email());

-- Enable realtime for quotes (already may be enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_line_items;
