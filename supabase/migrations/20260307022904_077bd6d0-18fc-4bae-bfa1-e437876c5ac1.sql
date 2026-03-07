-- Allow admins to update service_listings (for takedown/approve actions)
CREATE POLICY "Admins can update all listings"
  ON public.service_listings
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email())
  WITH CHECK (has_role(auth.uid(), 'admin') AND is_admin_email());