
-- The service_listings_browse view uses security_invoker=true, which means
-- the JOIN on professional_profiles filters out providers where is_publicly_listed=false.
-- Live service listings should always be visible regardless of profile listing status.
-- Fix: Add a dedicated RLS policy for service_listings_browse access on professional_profiles.

-- Allow public to read professional profiles that have live service listings
CREATE POLICY "Public can view providers with live listings"
ON public.professional_profiles FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM public.service_listings sl
    WHERE sl.provider_id = user_id AND sl.status = 'live'
  )
);
