
-- Fix professional_documents table admin policies to include is_admin_email() dual-gate
DROP POLICY IF EXISTS "Admins can view all documents" ON public.professional_documents;
CREATE POLICY "Admins can view all documents"
  ON public.professional_documents
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND public.is_admin_email());

DROP POLICY IF EXISTS "Admins can update document status" ON public.professional_documents;
CREATE POLICY "Admins can update document status"
  ON public.professional_documents
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND public.is_admin_email());

-- Fix professional-documents storage bucket admin policies
DROP POLICY IF EXISTS "Admins can view all professional documents" ON storage.objects;
CREATE POLICY "Admins can view all professional documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'professional-documents' AND public.has_role(auth.uid(), 'admin') AND public.is_admin_email());
