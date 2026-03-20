
-- ============================================================================
-- DISPUTE ENGINE: Core Tables
-- ============================================================================

-- Dispute status enum
CREATE TYPE public.dispute_status AS ENUM (
  'draft',
  'open',
  'awaiting_counterparty',
  'evidence_collection',
  'assessment',
  'resolution_offered',
  'awaiting_acceptance',
  'resolved',
  'closed',
  'escalated'
);

-- Issue type enum
CREATE TYPE public.dispute_issue_type AS ENUM (
  'quality',
  'completion',
  'delay',
  'payment',
  'scope_change',
  'materials',
  'access_site_conditions',
  'communication_conduct',
  'damage',
  'abandonment',
  'pricing_variation'
);

-- Resolution pathway enum
CREATE TYPE public.resolution_pathway AS ENUM (
  'corrective_work',
  'financial_adjustment',
  'shared_responsibility',
  'expert_review'
);

-- ============================================================================
-- 1. DISPUTES TABLE
-- ============================================================================
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) NOT NULL,
  milestone_label TEXT,
  raised_by UUID NOT NULL,
  raised_by_role TEXT NOT NULL DEFAULT 'client',
  
  -- Classification
  issue_types dispute_issue_type[] NOT NULL DEFAULT '{}',
  secondary_tags TEXT[] DEFAULT '{}',
  
  -- Status
  status dispute_status NOT NULL DEFAULT 'draft',
  
  -- Summaries (built by AI or manually)
  summary_neutral TEXT,
  requested_outcome TEXT,
  
  -- AI outputs (denormalized for quick access)
  ai_confidence_score NUMERIC(3,2),
  recommended_pathway resolution_pathway,
  human_review_required BOOLEAN DEFAULT false,
  
  -- Counterparty
  counterparty_id UUID,
  counterparty_responded_at TIMESTAMPTZ,
  
  -- Resolution
  resolution_type resolution_pathway,
  resolution_description TEXT,
  resolution_accepted_at TIMESTAMPTZ,
  
  -- Deadlines
  evidence_deadline TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- ============================================================================
-- 2. DISPUTE_INPUTS TABLE (voice/text/questionnaire)
-- ============================================================================
CREATE TABLE public.dispute_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES public.disputes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  
  input_type TEXT NOT NULL DEFAULT 'text',
  -- 'voice', 'text', 'multiple_choice'
  
  raw_text TEXT,
  transcript TEXT,
  questionnaire_answers JSONB DEFAULT '{}',
  
  -- Voice file reference (storage path)
  voice_file_path TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. DISPUTE_EVIDENCE TABLE
-- ============================================================================
CREATE TABLE public.dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES public.disputes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image',
  -- 'image', 'video', 'document'
  file_name TEXT,
  file_size_bytes INTEGER,
  
  description TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. DISPUTE_ANALYSIS TABLE (AI outputs)
-- ============================================================================
CREATE TABLE public.dispute_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES public.disputes(id) ON DELETE CASCADE NOT NULL,
  
  issue_types dispute_issue_type[] DEFAULT '{}',
  agreed_facts JSONB DEFAULT '[]',
  disputed_points JSONB DEFAULT '[]',
  missing_evidence JSONB DEFAULT '[]',
  
  summary_neutral TEXT,
  suggested_pathway resolution_pathway,
  confidence_score NUMERIC(3,2),
  
  requires_human_review BOOLEAN DEFAULT false,
  
  -- Raw AI response for debugging
  raw_ai_response JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. DISPUTE_STATUS_HISTORY (audit trail)
-- ============================================================================
CREATE TABLE public.dispute_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES public.disputes(id) ON DELETE CASCADE NOT NULL,
  from_status dispute_status,
  to_status dispute_status NOT NULL,
  changed_by UUID,
  change_source TEXT NOT NULL DEFAULT 'app',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_disputes_job_id ON public.disputes(job_id);
CREATE INDEX idx_disputes_raised_by ON public.disputes(raised_by);
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_disputes_counterparty ON public.disputes(counterparty_id);
CREATE INDEX idx_dispute_inputs_dispute_id ON public.dispute_inputs(dispute_id);
CREATE INDEX idx_dispute_evidence_dispute_id ON public.dispute_evidence(dispute_id);
CREATE INDEX idx_dispute_analysis_dispute_id ON public.dispute_analysis(dispute_id);
CREATE INDEX idx_dispute_status_history_dispute_id ON public.dispute_status_history(dispute_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Log status changes
CREATE OR REPLACE FUNCTION public.log_dispute_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.dispute_status_history(dispute_id, from_status, to_status, changed_by, change_source, metadata)
    VALUES (NEW.id, NULL, NEW.status, auth.uid(), 'app', jsonb_build_object('initial', true));
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.dispute_status_history(dispute_id, from_status, to_status, changed_by, change_source)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), 'app');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_dispute_status_change
  AFTER INSERT OR UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_dispute_status_change();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_status_history ENABLE ROW LEVEL SECURITY;

-- Disputes: parties can see their own disputes, admins see all
CREATE POLICY "Users can view their disputes"
  ON public.disputes FOR SELECT TO authenticated
  USING (auth.uid() = raised_by OR auth.uid() = counterparty_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create disputes"
  ON public.disputes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = raised_by);

CREATE POLICY "Parties can update their disputes"
  ON public.disputes FOR UPDATE TO authenticated
  USING (auth.uid() = raised_by OR auth.uid() = counterparty_id OR has_role(auth.uid(), 'admin'));

-- Dispute inputs: owner can CRUD, other party can read, admin full
CREATE POLICY "Users can view dispute inputs"
  ON public.dispute_inputs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.disputes d 
      WHERE d.id = dispute_id 
      AND (d.raised_by = auth.uid() OR d.counterparty_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can add dispute inputs"
  ON public.dispute_inputs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Dispute evidence: same as inputs
CREATE POLICY "Users can view dispute evidence"
  ON public.dispute_evidence FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.disputes d 
      WHERE d.id = dispute_id 
      AND (d.raised_by = auth.uid() OR d.counterparty_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can add dispute evidence"
  ON public.dispute_evidence FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Dispute analysis: parties can view, only system/admin can insert
CREATE POLICY "Users can view dispute analysis"
  ON public.dispute_analysis FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.disputes d 
      WHERE d.id = dispute_id 
      AND (d.raised_by = auth.uid() OR d.counterparty_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
  );

-- Status history: parties can view
CREATE POLICY "Users can view dispute history"
  ON public.dispute_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.disputes d 
      WHERE d.id = dispute_id 
      AND (d.raised_by = auth.uid() OR d.counterparty_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
  );

-- ============================================================================
-- STORAGE BUCKET for dispute evidence
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('dispute-evidence', 'dispute-evidence', false, 10485760)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload dispute evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dispute-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view dispute evidence files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dispute-evidence');
