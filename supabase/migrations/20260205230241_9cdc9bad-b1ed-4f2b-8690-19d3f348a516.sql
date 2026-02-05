-- Create RPC for clients to create direct conversations with professionals
-- This complements the existing get_or_create_conversation (which is pro-initiated)

CREATE OR REPLACE FUNCTION public.create_direct_conversation(
  p_job_id UUID,
  p_client_id UUID,
  p_pro_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_conversation_id UUID;
  v_job_owner UUID;
BEGIN
  -- Verify client owns the job
  SELECT user_id INTO v_job_owner
  FROM public.jobs
  WHERE id = p_job_id;
  
  IF v_job_owner IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  
  IF v_job_owner != p_client_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Verify caller is the client
  IF auth.uid() != p_client_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Client cannot message themselves
  IF p_client_id = p_pro_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;
  
  -- Check for existing conversation
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE job_id = p_job_id 
    AND client_id = p_client_id 
    AND pro_id = p_pro_id;
  
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;
  
  -- Create new conversation
  INSERT INTO public.conversations (job_id, client_id, pro_id)
  VALUES (p_job_id, p_client_id, p_pro_id)
  RETURNING id INTO v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$;