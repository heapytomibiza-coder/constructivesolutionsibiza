-- Create profiles table for user contact info
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  phone text,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user to create profile with phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_intent TEXT;
  v_roles TEXT[];
  v_active_role TEXT;
  v_phone TEXT;
BEGIN
  v_intent := COALESCE(NEW.raw_user_meta_data->>'intent', 'client');
  v_phone := NEW.raw_user_meta_data->>'phone';
  
  -- Role logic
  IF v_intent = 'client' THEN
    v_roles := ARRAY['client']::TEXT[];
    v_active_role := 'client';
  ELSIF v_intent = 'professional' THEN
    v_roles := ARRAY['client', 'professional']::TEXT[];
    v_active_role := 'professional';
  ELSIF v_intent = 'both' THEN
    v_roles := ARRAY['client', 'professional']::TEXT[];
    v_active_role := 'client';
  ELSE
    v_roles := ARRAY['client']::TEXT[];
    v_active_role := 'client';
  END IF;
  
  -- Insert user roles
  INSERT INTO public.user_roles (user_id, roles, active_role)
  VALUES (NEW.id, v_roles, v_active_role);
  
  -- Insert profile with phone
  INSERT INTO public.profiles (user_id, phone)
  VALUES (NEW.id, v_phone);
  
  -- If professional intent, create professional_profiles stub
  IF v_intent IN ('professional', 'both') THEN
    INSERT INTO public.professional_profiles (user_id, onboarding_phase, verification_status)
    VALUES (NEW.id, 'not_started', 'unverified');
  END IF;
  
  RETURN NEW;
END;
$$;