
-- Fix 1: Tighten service_views INSERT to authenticated users only
DROP POLICY IF EXISTS "Users can record views on live listings" ON public.service_views;
CREATE POLICY "Users can record views on live listings"
  ON public.service_views
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.service_listings sl
      WHERE sl.id = service_views.service_listing_id
        AND sl.status = 'live'
    )
  );

-- Fix 2: Tighten storage policies to authenticated only
DROP POLICY IF EXISTS "Providers can upload service images" ON storage.objects;
CREATE POLICY "Providers can upload service images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'service-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Providers can update their service images" ON storage.objects;
CREATE POLICY "Providers can update their service images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'service-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Providers can delete their service images" ON storage.objects;
CREATE POLICY "Providers can delete their service images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'service-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
