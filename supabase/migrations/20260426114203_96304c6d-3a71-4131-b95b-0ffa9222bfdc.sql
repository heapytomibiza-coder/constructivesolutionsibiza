REVOKE ALL ON FUNCTION public.accept_response(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_response(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_response(uuid) TO authenticated;