-- Index for browse view: status + published_at ordering
CREATE INDEX IF NOT EXISTS idx_service_listings_status_published
ON public.service_listings (status, published_at DESC NULLS LAST);

-- Partial index for live-only queries
CREATE INDEX IF NOT EXISTS idx_service_listings_live
ON public.service_listings (published_at DESC NULLS LAST) WHERE status = 'live';