REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON public.job_matches
FROM authenticated;

GRANT SELECT ON public.job_matches TO authenticated;