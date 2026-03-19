
-- Make user_id nullable so anonymous crash reports can be stored
ALTER TABLE public.error_events ALTER COLUMN user_id DROP NOT NULL;

-- Drop the old auth-only insert policy
DROP POLICY IF EXISTS "Users can insert own error events" ON public.error_events;

-- Allow authenticated users to insert their own errors
CREATE POLICY "Authenticated users can insert own errors"
ON public.error_events FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow anonymous crash reporting (user_id must be null)
CREATE POLICY "Anonymous crash reporting"
ON public.error_events FOR INSERT TO anon
WITH CHECK (user_id IS NULL);
