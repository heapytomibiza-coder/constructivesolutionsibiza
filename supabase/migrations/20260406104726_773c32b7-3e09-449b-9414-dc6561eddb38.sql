ALTER TABLE public.price_estimates
  ADD COLUMN rule_snapshot jsonb DEFAULT NULL;