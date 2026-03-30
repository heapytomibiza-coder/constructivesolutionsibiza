ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS email_quotes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_project_updates boolean NOT NULL DEFAULT true;