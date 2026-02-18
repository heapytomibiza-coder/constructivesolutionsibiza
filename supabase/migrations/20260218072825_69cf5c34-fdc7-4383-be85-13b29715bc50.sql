
-- ============================================================================
-- SERVICE LISTINGS - The public-facing catalog layer
-- ============================================================================

-- 1) service_listings: One per provider per microservice
CREATE TABLE public.service_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  micro_id UUID NOT NULL REFERENCES public.service_micro_categories(id),
  
  -- Display
  display_title TEXT NOT NULL DEFAULT '',
  short_description TEXT DEFAULT '',
  hero_image_url TEXT,
  gallery TEXT[] DEFAULT '{}',
  location_base TEXT,
  pricing_summary TEXT, -- e.g. "From 40 €/hr"
  
  -- Status gating
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'paused')),
  published_at TIMESTAMPTZ,
  
  -- Stats (denormalized for card display)
  view_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One listing per provider per micro
  UNIQUE(provider_id, micro_id)
);

ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;

-- Providers can manage their own listings
CREATE POLICY "Providers can view own listings"
  ON public.service_listings FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own listings"
  ON public.service_listings FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own listings"
  ON public.service_listings FOR UPDATE
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own listings"
  ON public.service_listings FOR DELETE
  USING (auth.uid() = provider_id);

-- Public can view live listings
CREATE POLICY "Public can view live listings"
  ON public.service_listings FOR SELECT
  USING (status = 'live');

-- Admins can view all
CREATE POLICY "Admins can view all listings"
  ON public.service_listings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_service_listings_updated_at
  BEFORE UPDATE ON public.service_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Publish gating trigger: prevent going live without required fields
CREATE OR REPLACE FUNCTION public.enforce_service_listing_publish_gate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'live' THEN
    IF COALESCE(NEW.display_title, '') = '' THEN
      RAISE EXCEPTION 'Cannot publish: display_title is required';
    END IF;
    IF COALESCE(NEW.short_description, '') = '' THEN
      RAISE EXCEPTION 'Cannot publish: short_description is required';
    END IF;
    IF NEW.hero_image_url IS NULL OR NEW.hero_image_url = '' THEN
      RAISE EXCEPTION 'Cannot publish: hero_image_url is required';
    END IF;
    -- Set published_at on first publish
    IF OLD.status IS DISTINCT FROM 'live' THEN
      NEW.published_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_service_listing_publish_gate
  BEFORE INSERT OR UPDATE ON public.service_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_service_listing_publish_gate();


-- ============================================================================
-- 2) service_pricing_items: Menu-style line items per listing
-- ============================================================================

CREATE TABLE public.service_pricing_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_listing_id UUID NOT NULL REFERENCES public.service_listings(id) ON DELETE CASCADE,
  
  label TEXT NOT NULL,
  info_description TEXT,
  price_amount NUMERIC,
  price_currency TEXT NOT NULL DEFAULT 'EUR',
  unit TEXT NOT NULL DEFAULT 'hour' CHECK (unit IN ('hour', 'day', 'sqm', 'job', 'item', 'unit')),
  
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_pricing_items ENABLE ROW LEVEL SECURITY;

-- Providers can manage pricing items for their own listings
CREATE POLICY "Providers can view own pricing items"
  ON public.service_pricing_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.service_listings sl
    WHERE sl.id = service_pricing_items.service_listing_id
    AND sl.provider_id = auth.uid()
  ));

CREATE POLICY "Providers can insert own pricing items"
  ON public.service_pricing_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.service_listings sl
    WHERE sl.id = service_pricing_items.service_listing_id
    AND sl.provider_id = auth.uid()
  ));

CREATE POLICY "Providers can update own pricing items"
  ON public.service_pricing_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.service_listings sl
    WHERE sl.id = service_pricing_items.service_listing_id
    AND sl.provider_id = auth.uid()
  ));

CREATE POLICY "Providers can delete own pricing items"
  ON public.service_pricing_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.service_listings sl
    WHERE sl.id = service_pricing_items.service_listing_id
    AND sl.provider_id = auth.uid()
  ));

-- Public can view items for live listings
CREATE POLICY "Public can view live listing pricing items"
  ON public.service_pricing_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.service_listings sl
    WHERE sl.id = service_pricing_items.service_listing_id
    AND sl.status = 'live'
  ));

CREATE TRIGGER update_service_pricing_items_updated_at
  BEFORE UPDATE ON public.service_pricing_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 3) service_views: Track page views per listing
-- ============================================================================

CREATE TABLE public.service_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_listing_id UUID NOT NULL REFERENCES public.service_listings(id) ON DELETE CASCADE,
  viewer_user_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (anonymous or authenticated)
CREATE POLICY "Anyone can record a view"
  ON public.service_views FOR INSERT
  WITH CHECK (true);

-- Providers can view stats for their own listings
CREATE POLICY "Providers can view own listing views"
  ON public.service_views FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.service_listings sl
    WHERE sl.id = service_views.service_listing_id
    AND sl.provider_id = auth.uid()
  ));

-- Admins can view all
CREATE POLICY "Admins can view all service views"
  ON public.service_views FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast view counting
CREATE INDEX idx_service_views_listing ON public.service_views(service_listing_id);

-- Trigger to increment denormalized view_count
CREATE OR REPLACE FUNCTION public.increment_service_listing_view_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.service_listings
  SET view_count = view_count + 1
  WHERE id = NEW.service_listing_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_service_listing_view_count
  AFTER INSERT ON public.service_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_service_listing_view_count();


-- ============================================================================
-- 4) RPC: Auto-create draft listings from professional_services
-- ============================================================================

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
  -- Verify caller is the provider
  IF auth.uid() != p_provider_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOREACH v_micro_id IN ARRAY p_micro_ids
  LOOP
    -- Get micro name for default title
    SELECT name INTO v_micro_name
    FROM public.service_micro_categories
    WHERE id = v_micro_id AND is_active = true;

    IF v_micro_name IS NULL THEN
      CONTINUE;
    END IF;

    -- Insert draft listing (skip if already exists)
    INSERT INTO public.service_listings (provider_id, micro_id, display_title, status)
    VALUES (p_provider_id, v_micro_id, v_micro_name, 'draft')
    ON CONFLICT (provider_id, micro_id) DO NOTHING
    RETURNING id INTO v_listing_id;

    -- If newly created, return it
    IF v_listing_id IS NOT NULL THEN
      RETURN QUERY SELECT * FROM public.service_listings WHERE id = v_listing_id;
    END IF;
  END LOOP;

  RETURN;
END;
$$;


-- ============================================================================
-- 5) Public browse view for service listings (denormalized for cards)
-- ============================================================================

CREATE OR REPLACE VIEW public.service_listings_browse AS
SELECT
  sl.id,
  sl.provider_id,
  sl.micro_id,
  sl.display_title,
  sl.short_description,
  sl.hero_image_url,
  sl.location_base,
  sl.pricing_summary,
  sl.view_count,
  sl.published_at,
  sl.created_at,
  -- Provider info
  pp.display_name AS provider_name,
  pp.avatar_url AS provider_avatar,
  pp.verification_status AS provider_verification,
  -- Taxonomy info
  smc.name AS micro_name,
  smc.slug AS micro_slug,
  ss.name AS subcategory_name,
  sc.name AS category_name,
  -- Min price for "Starting at" display
  (
    SELECT MIN(spi.price_amount)
    FROM public.service_pricing_items spi
    WHERE spi.service_listing_id = sl.id
    AND spi.is_enabled = true
    AND spi.price_amount IS NOT NULL
    AND spi.price_amount > 0
  ) AS starting_price,
  (
    SELECT spi.unit
    FROM public.service_pricing_items spi
    WHERE spi.service_listing_id = sl.id
    AND spi.is_enabled = true
    AND spi.price_amount IS NOT NULL
    AND spi.price_amount > 0
    ORDER BY spi.price_amount ASC
    LIMIT 1
  ) AS starting_price_unit
FROM public.service_listings sl
JOIN public.professional_profiles pp ON pp.user_id = sl.provider_id
JOIN public.service_micro_categories smc ON smc.id = sl.micro_id
JOIN public.service_subcategories ss ON ss.id = smc.subcategory_id
JOIN public.service_categories sc ON sc.id = ss.category_id
WHERE sl.status = 'live';


-- ============================================================================
-- 6) Storage bucket for service listing images
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view service images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-images');

CREATE POLICY "Providers can upload service images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Providers can update their service images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Providers can delete their service images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);
