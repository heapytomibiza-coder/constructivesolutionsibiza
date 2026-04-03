
-- Make daily quote limit tier-aware by looking up subscription tier
CREATE OR REPLACE FUNCTION public.submit_quote_with_items(
  p_job_id uuid,
  p_price_type text DEFAULT 'fixed',
  p_price_fixed numeric DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL,
  p_hourly_rate numeric DEFAULT NULL,
  p_time_estimate_days integer DEFAULT NULL,
  p_start_date_estimate date DEFAULT NULL,
  p_scope_text text DEFAULT '',
  p_exclusions_text text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_vat_percent numeric DEFAULT 0,
  p_subtotal numeric DEFAULT NULL,
  p_total numeric DEFAULT NULL,
  p_revision_number integer DEFAULT 1,
  p_previous_quote_id uuid DEFAULT NULL,
  p_line_items jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_rate_ok boolean;
  v_quote_id uuid;
  v_item jsonb;
  v_idx integer := 0;
  v_tier text;
  v_daily_limit integer;
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Look up subscription tier (default to bronze if none exists)
  SELECT COALESCE(s.tier, 'bronze')
  INTO v_tier
  FROM subscriptions s
  WHERE s.user_id = v_user_id
    AND s.status = 'active'
  LIMIT 1;

  -- If no subscription row at all, default to bronze
  IF v_tier IS NULL THEN
    v_tier := 'bronze';
  END IF;

  -- Map tier to daily quote limit (mirrors entitlements.ts quote_daily_limit)
  v_daily_limit := CASE v_tier
    WHEN 'elite'  THEN 50
    WHEN 'gold'   THEN 30
    WHEN 'silver' THEN 15
    ELSE 5  -- bronze default
  END;

  -- Rate limit using tier-aware daily limit
  SELECT check_rate_limit(v_user_id, 'quote_submit', v_daily_limit, '24 hours'::interval) INTO v_rate_ok;
  IF v_rate_ok IS FALSE THEN
    RAISE EXCEPTION 'Daily quote limit reached (% quotes/day for % tier)', v_daily_limit, v_tier;
  END IF;

  -- If revising, mark old quote as revised (only if owned by this user)
  IF p_previous_quote_id IS NOT NULL THEN
    UPDATE quotes
    SET status = 'revised', updated_at = now()
    WHERE id = p_previous_quote_id
      AND professional_id = v_user_id;
  END IF;

  -- Insert quote
  INSERT INTO quotes (
    job_id, professional_id, price_type,
    price_fixed, price_min, price_max, hourly_rate,
    time_estimate_days, start_date_estimate,
    scope_text, exclusions_text, notes,
    vat_percent, subtotal, total,
    revision_number
  ) VALUES (
    p_job_id, v_user_id, p_price_type,
    p_price_fixed, p_price_min, p_price_max, p_hourly_rate,
    p_time_estimate_days, p_start_date_estimate,
    p_scope_text, p_exclusions_text, p_notes,
    p_vat_percent, p_subtotal, p_total,
    p_revision_number
  )
  RETURNING id INTO v_quote_id;

  -- Insert line items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    INSERT INTO quote_line_items (quote_id, description, quantity, unit_price, sort_order)
    VALUES (
      v_quote_id,
      (v_item ->> 'description')::text,
      COALESCE((v_item ->> 'quantity')::numeric, 1),
      COALESCE((v_item ->> 'unit_price')::numeric, 0),
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;

  RETURN v_quote_id;
END;
$$;
