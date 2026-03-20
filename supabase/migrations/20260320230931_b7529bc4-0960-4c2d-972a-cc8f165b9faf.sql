CREATE OR REPLACE FUNCTION public.create_draft_service_listings(p_provider_id UUID, p_micro_ids UUID[])
RETURNS SETOF public.service_listings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_micro_id UUID;
  v_micro_name TEXT;
  v_listing_id UUID;
BEGIN
  IF auth.uid() != p_provider_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOREACH v_micro_id IN ARRAY COALESCE(p_micro_ids, ARRAY[]::UUID[])
  LOOP
    v_listing_id := NULL;

    SELECT name INTO v_micro_name
    FROM public.service_micro_categories
    WHERE id = v_micro_id AND is_active = true;

    IF v_micro_name IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.service_listings (provider_id, micro_id, display_title, status)
    VALUES (p_provider_id, v_micro_id, v_micro_name, 'draft')
    ON CONFLICT (provider_id, micro_id) DO NOTHING
    RETURNING id INTO v_listing_id;

    IF v_listing_id IS NOT NULL THEN
      RETURN QUERY SELECT * FROM public.service_listings WHERE id = v_listing_id;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_service_listings_for_provider(p_provider_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_created_count INTEGER := 0;
  v_archived_count INTEGER := 0;
BEGIN
  IF auth.uid() != p_provider_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  WITH missing_services AS (
    SELECT ps.micro_id
    FROM public.professional_services ps
    LEFT JOIN public.service_listings sl
      ON sl.provider_id = ps.user_id
     AND sl.micro_id = ps.micro_id
    WHERE ps.user_id = p_provider_id
      AND ps.status = 'offered'
      AND sl.id IS NULL
  ), created_rows AS (
    INSERT INTO public.service_listings (provider_id, micro_id, display_title, status)
    SELECT p_provider_id, m.id, m.name, 'draft'
    FROM missing_services ms
    JOIN public.service_micro_categories m ON m.id = ms.micro_id
    WHERE m.is_active = true
    ON CONFLICT (provider_id, micro_id) DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_created_count FROM created_rows;

  WITH orphaned_drafts AS (
    DELETE FROM public.service_listings sl
    WHERE sl.provider_id = p_provider_id
      AND sl.status = 'draft'
      AND NOT EXISTS (
        SELECT 1
        FROM public.professional_services ps
        WHERE ps.user_id = sl.provider_id
          AND ps.micro_id = sl.micro_id
          AND ps.status = 'offered'
      )
    RETURNING sl.id
  )
  SELECT count(*) INTO v_archived_count FROM orphaned_drafts;

  UPDATE public.service_listings sl
  SET status = 'paused',
      updated_at = now()
  WHERE sl.provider_id = p_provider_id
    AND sl.status = 'live'
    AND NOT EXISTS (
      SELECT 1
      FROM public.professional_services ps
      WHERE ps.user_id = sl.provider_id
        AND ps.micro_id = sl.micro_id
        AND ps.status = 'offered'
    );

  RETURN jsonb_build_object(
    'created_count', v_created_count,
    'removed_draft_count', v_archived_count
  );
END;
$$;