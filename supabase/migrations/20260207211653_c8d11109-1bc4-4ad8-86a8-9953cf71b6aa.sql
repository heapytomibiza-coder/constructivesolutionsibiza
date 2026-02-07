-- Phase 1: Extend professional_profiles with new columns for onboarding
ALTER TABLE professional_profiles 
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS service_area_type TEXT DEFAULT 'zones',
  ADD COLUMN IF NOT EXISTS service_zones TEXT[],
  ADD COLUMN IF NOT EXISTS service_radius_km INTEGER,
  ADD COLUMN IF NOT EXISTS base_location JSONB,
  ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS typical_lead_time TEXT DEFAULT 'same_week',
  ADD COLUMN IF NOT EXISTS accepts_emergency BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS working_hours JSONB,
  ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'quote_required',
  ADD COLUMN IF NOT EXISTS hourly_rate_min DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS hourly_rate_max DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS day_rate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS minimum_call_out DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS emergency_multiplier DECIMAL(3,2) DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS profile_status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Create professional_documents table for verification uploads
CREATE TABLE IF NOT EXISTS professional_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on professional_documents
ALTER TABLE professional_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for professional_documents
CREATE POLICY "Users can view their own documents"
  ON professional_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON professional_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON professional_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON professional_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for professional documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('professional-documents', 'professional-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for professional-documents bucket
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'professional-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'professional-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'professional-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'professional-documents' AND auth.uid()::text = (storage.foldername(name))[1]);