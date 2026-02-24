-- Allow anonymous users to view public open jobs through the jobs_board view
-- The existing "Authenticated can view public open jobs" policy already has the right expression
-- but we need to ensure it also applies to unauthenticated (anon) users.
-- The current policy is PERMISSIVE and doesn't check auth.uid(), so it should work.
-- The issue may be that the policy was created with a ROLE restriction.
-- Let's drop and recreate it to ensure it applies to all roles including anon.

DROP POLICY IF EXISTS "Authenticated can view public open jobs" ON public.jobs;

CREATE POLICY "Anyone can view public open jobs"
ON public.jobs
FOR SELECT
USING (is_publicly_listed = true AND status = 'open');
