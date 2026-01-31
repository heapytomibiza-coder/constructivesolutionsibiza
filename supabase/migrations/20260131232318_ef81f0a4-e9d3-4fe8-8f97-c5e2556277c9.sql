-- User Roles Table
-- Tracks user roles (client, professional, admin) with active role tracking
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roles TEXT[] NOT NULL DEFAULT ARRAY['client']::TEXT[],
  active_role TEXT NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  CONSTRAINT valid_active_role CHECK (active_role = ANY(roles)),
  CONSTRAINT valid_roles CHECK (roles <@ ARRAY['client', 'professional', 'admin']::TEXT[])
);

-- Professional Profiles Table
-- Stores professional-specific data, onboarding status, verification
CREATE TABLE public.professional_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  onboarding_phase TEXT NOT NULL DEFAULT 'not_started',
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  services_count INTEGER NOT NULL DEFAULT 0,
  is_publicly_listed BOOLEAN NOT NULL DEFAULT false,
  location JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  CONSTRAINT valid_onboarding_phase CHECK (onboarding_phase IN ('not_started', 'basic_info', 'verification', 'service_setup', 'complete')),
  CONSTRAINT valid_verification_status CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'))
);

-- Jobs Table
-- Core job listings with privacy controls
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  answers JSONB,
  location JSONB,
  budget_min NUMERIC,
  budget_max NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft',
  is_publicly_listed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- User Roles Policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own roles"
  ON public.user_roles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert roles on signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Professional Profiles Policies
CREATE POLICY "Users can view their own professional profile"
  ON public.professional_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view listed professionals"
  ON public.professional_profiles FOR SELECT
  USING (is_publicly_listed = true);

CREATE POLICY "Users can update their own professional profile"
  ON public.professional_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own professional profile"
  ON public.professional_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Jobs Policies
CREATE POLICY "Users can view their own jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view listed jobs"
  ON public.jobs FOR SELECT
  USING (is_publicly_listed = true);

CREATE POLICY "Users can create their own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Public Views for anonymous browsing
CREATE VIEW public.public_jobs_preview AS
SELECT 
  id,
  title,
  category,
  status,
  created_at,
  budget_min,
  budget_max
FROM public.jobs
WHERE is_publicly_listed = true AND status = 'open';

CREATE VIEW public.public_job_details AS
SELECT 
  id,
  title,
  description,
  category,
  status,
  created_at,
  budget_min,
  budget_max
FROM public.jobs
WHERE is_publicly_listed = true;

CREATE VIEW public.public_professionals_preview AS
SELECT 
  id,
  display_name,
  avatar_url,
  services_count,
  verification_status
FROM public.professional_profiles
WHERE is_publicly_listed = true;

CREATE VIEW public.public_professional_details AS
SELECT 
  id,
  display_name,
  bio,
  avatar_url,
  services_count,
  verification_status
FROM public.professional_profiles
WHERE is_publicly_listed = true;

-- Trigger for auto-creating user_roles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, roles, active_role)
  VALUES (NEW.id, ARRAY['client']::TEXT[], 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professional_profiles_updated_at
  BEFORE UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();