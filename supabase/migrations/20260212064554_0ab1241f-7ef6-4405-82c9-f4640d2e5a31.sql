
-- ============================================
-- EMAIL NOTIFICATIONS QUEUE (generic, multi-type)
-- ============================================
CREATE TABLE public.email_notifications_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  recipient_user_id uuid,
  payload jsonb NOT NULL DEFAULT '{}',
  sent_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_notifications_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email notification queue"
ON public.email_notifications_queue FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- Index for efficient queue processing
CREATE INDEX idx_email_notifications_unsent
ON public.email_notifications_queue (created_at)
WHERE sent_at IS NULL AND attempts < 3;

-- ============================================
-- TRIGGER 1: Message notification (debounced per conversation+recipient)
-- ============================================
CREATE OR REPLACE FUNCTION public.enqueue_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_recipient_id uuid;
  v_client_id uuid;
  v_pro_id uuid;
BEGIN
  -- Skip system messages
  IF NEW.message_type != 'user' THEN
    RETURN NEW;
  END IF;

  SELECT c.client_id, c.pro_id INTO v_client_id, v_pro_id
  FROM public.conversations c WHERE c.id = NEW.conversation_id;

  -- Recipient is the other participant
  IF NEW.sender_id = v_client_id THEN
    v_recipient_id := v_pro_id;
  ELSE
    v_recipient_id := v_client_id;
  END IF;

  -- Only enqueue if no pending notification for this conversation+recipient (debounce)
  IF NOT EXISTS (
    SELECT 1 FROM public.email_notifications_queue
    WHERE event_type = 'new_message'
      AND recipient_user_id = v_recipient_id
      AND payload->>'conversation_id' = NEW.conversation_id::text
      AND sent_at IS NULL
  ) THEN
    INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
    VALUES ('new_message', v_recipient_id, jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'message_preview', left(NEW.body, 140)
    ));
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_enqueue_message_notification
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_message_notification();

-- ============================================
-- TRIGGER 2: Professional signup → admin alert
-- ============================================
CREATE OR REPLACE FUNCTION public.enqueue_pro_signup_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
  VALUES ('pro_signup', NULL, jsonb_build_object(
    'pro_user_id', NEW.user_id,
    'display_name', COALESCE(NEW.display_name, 'New Professional')
  ));
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_enqueue_pro_signup_notification
AFTER INSERT ON public.professional_profiles
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_pro_signup_notification();

-- ============================================
-- TRIGGER 3: Support ticket → admin alert
-- ============================================
CREATE OR REPLACE FUNCTION public.enqueue_support_ticket_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.email_notifications_queue (event_type, recipient_user_id, payload)
  VALUES ('support_ticket', NULL, jsonb_build_object(
    'ticket_number', NEW.ticket_number,
    'issue_type', NEW.issue_type,
    'priority', NEW.priority,
    'summary', COALESCE(NEW.summary, ''),
    'created_by_role', NEW.created_by_role
  ));
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_enqueue_support_ticket_notification
AFTER INSERT ON public.support_requests
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_support_ticket_notification();
