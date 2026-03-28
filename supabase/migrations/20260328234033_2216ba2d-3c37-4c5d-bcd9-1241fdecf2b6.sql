-- Drop the old insecure 3-parameter overload that accepts p_professional_id from client
DROP FUNCTION IF EXISTS public.accept_quote_and_assign(UUID, UUID, UUID);