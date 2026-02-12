-- Allow admins to view all jobs (any status, any owner)
CREATE POLICY "Admins can view all jobs"
ON public.jobs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));