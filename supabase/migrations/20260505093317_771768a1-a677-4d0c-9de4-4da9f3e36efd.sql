
-- Admins can read all email_send_log
CREATE POLICY "Admins can read email send log"
ON public.email_send_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND public.is_admin_email());

-- Authenticated users can read their own email entries (by recipient email)
CREATE POLICY "Users can read own email send log"
ON public.email_send_log
FOR SELECT
TO authenticated
USING (
  recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Stats helper (admin only via RLS-scoped query inside)
CREATE OR REPLACE FUNCTION public.admin_email_log_stats(_since timestamptz DEFAULT now() - interval '7 days')
RETURNS TABLE(status text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status, count(*)::bigint
  FROM (
    SELECT DISTINCT ON (message_id) status, created_at
    FROM public.email_send_log
    WHERE message_id IS NOT NULL
    ORDER BY message_id, created_at DESC
  ) latest
  WHERE created_at >= _since
    AND public.has_role(auth.uid(), 'admin')
    AND public.is_admin_email()
  GROUP BY status;
$$;

REVOKE ALL ON FUNCTION public.admin_email_log_stats(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_email_log_stats(timestamptz) TO authenticated;
