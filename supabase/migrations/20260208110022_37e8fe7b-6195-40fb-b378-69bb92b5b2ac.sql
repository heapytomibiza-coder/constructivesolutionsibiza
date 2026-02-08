-- Support section tables for @csi-support feature

-- Sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START 1000;

-- Support requests table
CREATE TABLE public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_by_user_id UUID NOT NULL,
  created_by_role TEXT NOT NULL CHECK (created_by_role IN ('client', 'professional')),
  issue_type TEXT NOT NULL CHECK (issue_type IN ('no_response', 'no_show', 'dispute', 'payment', 'safety_concern', 'other')),
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'triage', 'joined', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID,
  ticket_number TEXT NOT NULL DEFAULT ('CSI-' || nextval('support_ticket_seq')::TEXT),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Support request events (audit trail)
CREATE TABLE public.support_request_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_request_id UUID NOT NULL REFERENCES public.support_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'status_change', 'assigned', 'note_added', 'support_joined', 'resolved', 'priority_change')),
  actor_user_id UUID NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('client', 'professional', 'support', 'admin')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversation participants (for multi-party support)
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role_in_conversation TEXT NOT NULL CHECK (role_in_conversation IN ('client', 'professional', 'support')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  UNIQUE (conversation_id, user_id)
);

-- Add message_type and metadata to messages if not exists
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'user' CHECK (message_type IN ('user', 'system'));
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Enable RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_support_requests_status ON public.support_requests(status);
CREATE INDEX idx_support_requests_conversation ON public.support_requests(conversation_id);
CREATE INDEX idx_support_requests_created_by ON public.support_requests(created_by_user_id);
CREATE INDEX idx_support_request_events_request ON public.support_request_events(support_request_id);
CREATE INDEX idx_conversation_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user ON public.conversation_participants(user_id);

-- RLS Policies for support_requests

-- Users can view their own support requests
CREATE POLICY "Users can view own support requests"
ON public.support_requests FOR SELECT
TO authenticated
USING (created_by_user_id = auth.uid());

-- Admins can view all support requests
CREATE POLICY "Admins can view all support requests"
ON public.support_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can create support requests for conversations they're part of
CREATE POLICY "Users can create support requests for their conversations"
ON public.support_requests FOR INSERT
TO authenticated
WITH CHECK (
  created_by_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND (c.client_id = auth.uid() OR c.pro_id = auth.uid())
  )
);

-- Admins can update support requests (status, priority, assignment)
CREATE POLICY "Admins can update support requests"
ON public.support_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for support_request_events

-- Users can view events for their support requests
CREATE POLICY "Users can view own support request events"
ON public.support_request_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_requests sr
    WHERE sr.id = support_request_id 
    AND sr.created_by_user_id = auth.uid()
  )
);

-- Admins can view all events
CREATE POLICY "Admins can view all support request events"
ON public.support_request_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert events
CREATE POLICY "Admins can insert support request events"
ON public.support_request_events FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can insert 'created' event when creating a request
CREATE POLICY "Users can insert created event for own requests"
ON public.support_request_events FOR INSERT
TO authenticated
WITH CHECK (
  event_type = 'created' AND
  actor_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.support_requests sr
    WHERE sr.id = support_request_id 
    AND sr.created_by_user_id = auth.uid()
  )
);

-- RLS Policies for conversation_participants

-- Participants can view who's in their conversations
CREATE POLICY "Conversation members can view participants"
ON public.conversation_participants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id 
    AND (c.client_id = auth.uid() OR c.pro_id = auth.uid())
  ) OR
  user_id = auth.uid()
);

-- Admins can view all participants
CREATE POLICY "Admins can view all participants"
ON public.conversation_participants FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert participants (for support join)
CREATE POLICY "Admins can insert participants"
ON public.conversation_participants FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update participants (for leave)
CREATE POLICY "Admins can update participants"
ON public.conversation_participants FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE TRIGGER update_support_requests_updated_at
BEFORE UPDATE ON public.support_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Allow support/admin to read conversation messages when a support request exists
CREATE POLICY "Support can read messages for escalated conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_requests sr
    WHERE sr.conversation_id = conversation_id
    AND sr.status NOT IN ('closed')
    AND public.has_role(auth.uid(), 'admin')
  ) OR
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  )
);

-- Admin view for support inbox
CREATE OR REPLACE VIEW public.admin_support_inbox
WITH (security_invoker = true)
AS
SELECT 
  sr.id,
  sr.ticket_number,
  sr.conversation_id,
  sr.job_id,
  sr.created_by_user_id,
  sr.created_by_role,
  sr.issue_type,
  sr.summary,
  sr.status,
  sr.priority,
  sr.assigned_to,
  sr.created_at,
  sr.updated_at,
  sr.resolved_at,
  j.title as job_title,
  j.category as job_category,
  c.client_id,
  c.pro_id,
  c.last_message_at,
  c.last_message_preview,
  EXTRACT(EPOCH FROM (now() - sr.created_at)) / 3600 as age_hours
FROM public.support_requests sr
LEFT JOIN public.jobs j ON j.id = sr.job_id
LEFT JOIN public.conversations c ON c.id = sr.conversation_id;

-- Update admin_platform_stats to include support metrics
DROP VIEW IF EXISTS public.admin_platform_stats;
CREATE OR REPLACE VIEW public.admin_platform_stats
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*) FROM public.user_roles)::integer AS total_users,
  (SELECT COUNT(*) FROM public.professional_profiles)::integer AS total_professionals,
  (SELECT COUNT(*) FROM public.professional_profiles WHERE is_publicly_listed = true)::integer AS active_professionals,
  (SELECT COUNT(*) FROM public.jobs)::integer AS total_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'open')::integer AS open_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'in_progress')::integer AS active_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'completed')::integer AS completed_jobs,
  (SELECT COUNT(*) FROM public.forum_posts)::integer AS total_posts,
  (SELECT COUNT(*) FROM public.conversations)::integer AS total_conversations,
  (SELECT COUNT(*) FROM public.support_requests WHERE status NOT IN ('resolved', 'closed'))::integer AS open_support_tickets,
  (SELECT COUNT(*) FROM public.support_requests WHERE status = 'open')::integer AS new_support_tickets;