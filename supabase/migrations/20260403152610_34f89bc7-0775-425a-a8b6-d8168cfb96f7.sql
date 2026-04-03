DROP FUNCTION IF EXISTS public.submit_quote_with_items(uuid,text,numeric,numeric,numeric,numeric,integer,date,text,text,text,numeric,numeric,numeric,integer,uuid,jsonb);

CREATE FUNCTION public.submit_quote_with_items(
  p_job_id uuid,
  p_price_type text,
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
  v_daily_limit integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Single source of truth: get_tier_limit handles subscription lookup + bronze fallback
  v_daily_limit := public.get_tier_limit(v_user_id, 'quote_daily_limit');

  SELECT check_rate_limit(v_user_id, 'quote_submit', v_daily_limit, '24 hours'::interval) INTO v_rate_ok;
  IF v_rate_ok IS FALSE THEN
    RAISE EXCEPTION 'Daily quote limit reached (% quotes/day)', v_daily_limit;
  END IF;

  IF p_previous_quote_id IS NOT NULL THEN
    UPDATE quotes
    SET status = 'revised', updated_at = now()
    WHERE id = p_previous_quote_id
      AND professional_id = v_user_id;
  END IF;

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