ALTER TABLE public.professional_profiles DROP CONSTRAINT valid_onboarding_phase;

ALTER TABLE public.professional_profiles ADD CONSTRAINT valid_onboarding_phase
  CHECK (onboarding_phase = ANY (ARRAY[
    'not_started'::text,
    'basic_info'::text,
    'service_area'::text,
    'services'::text,
    'review'::text,
    'complete'::text,
    -- Legacy values kept for backward compatibility
    'verification'::text,
    'service_setup'::text
  ]));