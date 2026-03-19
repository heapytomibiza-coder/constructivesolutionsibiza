
-- Make the public service browse view independent from underlying profile RLS.
-- The view only exposes safe public listing fields, so it should not inherit
-- caller-based filtering from joined tables.
ALTER VIEW public.service_listings_browse SET (security_invoker = false);
