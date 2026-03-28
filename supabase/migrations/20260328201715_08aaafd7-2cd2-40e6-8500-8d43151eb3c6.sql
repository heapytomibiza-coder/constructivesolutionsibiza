-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','elite')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','cancelled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  commission_rate NUMERIC NOT NULL DEFAULT 18,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email());

-- RPC to get user tier info
CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id UUID)
RETURNS TABLE(tier TEXT, commission_rate NUMERIC, status TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(s.tier, 'bronze') AS tier,
    COALESCE(s.commission_rate, 18) AS commission_rate,
    COALESCE(s.status, 'active') AS status
  FROM (SELECT 1) AS dummy
  LEFT JOIN subscriptions s ON s.user_id = p_user_id;
$$;