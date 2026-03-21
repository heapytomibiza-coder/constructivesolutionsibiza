-- Allow admins to view all pricing items for listing review
CREATE POLICY "Admins can view all pricing items"
  ON public.service_pricing_items FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all professional profiles for listing review
CREATE POLICY "Admins can view all professional profiles"
  ON public.professional_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));