-- Fix 1: Set security_invoker on service_listings_browse view
ALTER VIEW public.service_listings_browse SET (security_invoker = true);

-- Fix 2: Add INSERT policy on analytics_events for authenticated users
CREATE POLICY "Authenticated users can insert own analytics events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);