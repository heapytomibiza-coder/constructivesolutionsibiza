
-- ============================================================
-- FIX 1: Change quote_line_items policies from {public} to {authenticated}
-- ============================================================

-- Drop all existing quote_line_items policies
DROP POLICY IF EXISTS "Clients can view quote line items on own jobs" ON public.quote_line_items;
DROP POLICY IF EXISTS "Pros can view own quote line items" ON public.quote_line_items;
DROP POLICY IF EXISTS "Pros can insert own quote line items" ON public.quote_line_items;
DROP POLICY IF EXISTS "Pros can update own quote line items" ON public.quote_line_items;
DROP POLICY IF EXISTS "Pros can delete own quote line items" ON public.quote_line_items;
DROP POLICY IF EXISTS "Admins can manage all quote line items" ON public.quote_line_items;

-- Recreate with {authenticated} role
CREATE POLICY "Clients can view quote line items on own jobs"
  ON public.quote_line_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quotes q JOIN public.jobs j ON j.id = q.job_id
    WHERE q.id = quote_line_items.quote_id AND j.user_id = auth.uid()
  ));

CREATE POLICY "Pros can view own quote line items"
  ON public.quote_line_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = quote_line_items.quote_id AND q.professional_id = auth.uid()
  ));

CREATE POLICY "Pros can insert own quote line items"
  ON public.quote_line_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = quote_line_items.quote_id AND q.professional_id = auth.uid()
  ));

CREATE POLICY "Pros can update own quote line items"
  ON public.quote_line_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = quote_line_items.quote_id AND q.professional_id = auth.uid()
  ));

CREATE POLICY "Pros can delete own quote line items"
  ON public.quote_line_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = quote_line_items.quote_id AND q.professional_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all quote line items"
  ON public.quote_line_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND public.is_admin_email())
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND public.is_admin_email());

-- ============================================================
-- FIX 2: Add conversation-participant SELECT on quotes
-- This allows pros with a conversation on a job to view all quotes
-- (prevents 403 when viewing quotes tab)
-- ============================================================

CREATE POLICY "Conversation participants can view job quotes"
  ON public.quotes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.job_id = quotes.job_id
    AND auth.uid() IN (c.client_id, c.pro_id)
  ));
