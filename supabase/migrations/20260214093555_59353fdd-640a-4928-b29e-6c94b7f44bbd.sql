-- Add admin RLS policies to professional_documents table for verification workflow
CREATE POLICY "Admins can read all professional documents"
ON public.professional_documents FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update document verification"
ON public.professional_documents FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add admin read access to professional-documents storage bucket
CREATE POLICY "Admins can view professional documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'professional-documents' AND public.has_role(auth.uid(), 'admin'));